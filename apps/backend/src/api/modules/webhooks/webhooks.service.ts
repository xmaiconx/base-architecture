import { Injectable, Inject } from '@nestjs/common';
import { ILoggerService, IEventBroker } from '@fnd/backend';
import { IWebhookEventRepository } from '@fnd/database';
import { WebhookStatus } from '@fnd/domain';
import { WebhookGatewayService } from './services/webhook-gateway.service';
import { WebhookReceivedEvent } from './events/WebhookReceivedEvent';

/**
 * Serviço principal para gerenciar webhooks
 *
 * IMPORTANTE: Este serviço é LIGHTWEIGHT - apenas recebe, persiste e enfileira.
 * Todo o parsing e processamento acontece no Worker layer.
 */
@Injectable()
export class WebhooksService {
  constructor(
    @Inject('IWebhookEventRepository')
    private readonly webhookEventRepository: IWebhookEventRepository,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
    @Inject('IEventBroker') private readonly eventBroker: IEventBroker,
    private readonly gatewayService: WebhookGatewayService,
  ) {}

  /**
   * Recebe um webhook, persiste e enfileira para processamento assíncrono
   *
   * FLUXO SIMPLIFICADO:
   * 1. Decode UUID → gateway config
   * 2. Persist raw webhook (status: PENDING)
   * 3. Publish event → BullMQ queue
   * 4. Return 200 OK
   *
   * TODO: Parsing e processamento acontecem no Worker
   *
   * @param uuid - UUID codificado contendo configuração do gateway
   * @param payload - Payload bruto do webhook
   * @returns ID do webhook event criado
   */
  async receiveWebhook(uuid: string, payload: unknown): Promise<string> {
    this.logger.info('Receiving webhook', {
      operation: 'webhooks.receive.start',
      module: 'WebhooksService',
    });

    // 1. Decodificar UUID e extrair configuração
    const gatewayConfig = this.gatewayService.decode(uuid);

    this.logger.info('Webhook gateway config decoded', {
      operation: 'webhooks.receive.config',
      module: 'WebhooksService',
      accountId: gatewayConfig.accountId,
      projectId: gatewayConfig.projectId,
      webhookType: gatewayConfig.webhookType,
      provider: gatewayConfig.provider,
      channel: gatewayConfig.channel,
      implementation: gatewayConfig.implementation,
    });

    // 2. Persistir webhook event (RAW - sem parsing)
    // NOTA: Parsing será feito no Worker layer
    const queueName = this.buildQueueName(gatewayConfig);

    const webhookEvent = await this.webhookEventRepository.create({
      accountId: gatewayConfig.accountId,
      projectId: gatewayConfig.projectId,
      webhookType: gatewayConfig.webhookType,
      provider: gatewayConfig.provider,
      channel: gatewayConfig.channel,
      implementation: gatewayConfig.implementation,
      status: WebhookStatus.PENDING,
      payload,
      queueName,
    });

    this.logger.info('Webhook event persisted', {
      operation: 'webhooks.receive.persisted',
      module: 'WebhooksService',
      webhookEventId: webhookEvent.id,
      accountId: webhookEvent.accountId,
      queueName,
    });

    // 3. Publicar evento para processamento assíncrono (Worker)
    const event = new WebhookReceivedEvent(webhookEvent.id, {
      webhookEventId: webhookEvent.id,
      accountId: webhookEvent.accountId,
      projectId: webhookEvent.projectId,
      webhookType: webhookEvent.webhookType,
      provider: webhookEvent.provider,
      channel: webhookEvent.channel,
      implementation: webhookEvent.implementation,
      queueName,
      payload,
    });

    await this.eventBroker.publish(event);

    this.logger.info('Webhook enqueued for processing', {
      operation: 'webhooks.receive.enqueued',
      module: 'WebhooksService',
      webhookEventId: webhookEvent.id,
      queueName,
    });

    return webhookEvent.id;
  }

  /**
   * Constrói o nome da fila baseado no provider/channel/implementation
   * Pattern: webhook-{provider}-{channel}-{implementation}
   * Fallback: webhook-{provider}-default
   */
  private buildQueueName(config: {
    provider: string;
    channel?: string | null;
    implementation?: string | null;
  }): string {
    const provider = config.provider.toLowerCase();
    const channel = config.channel?.toLowerCase();
    const implementation = config.implementation?.toLowerCase();

    if (channel && implementation) {
      return `webhook-${provider}-${channel}-${implementation}`;
    }
    if (channel) {
      return `webhook-${provider}-${channel}`;
    }
    return `webhook-${provider}-default`;
  }
}
