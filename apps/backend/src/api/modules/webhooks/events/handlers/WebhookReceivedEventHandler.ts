import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ILoggerService, IJobQueue } from '@fnd/backend';
import { IWebhookEventRepository } from '@fnd/database';
import { WebhookStatus } from '@fnd/domain';
import { WebhookReceivedEvent } from '../WebhookReceivedEvent';

/**
 * Handler para evento WebhookReceivedEvent
 * Responsável por adicionar o webhook à fila para processamento assíncrono
 */
@EventsHandler(WebhookReceivedEvent)
export class WebhookReceivedEventHandler implements IEventHandler<WebhookReceivedEvent> {
  constructor(
    @Inject('IJobQueue') private readonly jobQueue: IJobQueue,
    @Inject('IWebhookEventRepository')
    private readonly webhookEventRepository: IWebhookEventRepository,
    @Inject('ILoggerService') private readonly logger: ILoggerService
  ) {}

  async handle(event: WebhookReceivedEvent): Promise<void> {
    this.logger.info('Handling WebhookReceivedEvent', {
      operation: 'webhooks.event.received',
      module: 'WebhookReceivedEventHandler',
      webhookEventId: event.webhookEventId,
      accountId: event.accountId,
      queueName: event.queueName,
    });

    try {
      // Adicionar job à fila para processamento assíncrono
      await this.jobQueue.add(
        event.queueName,
        {
          webhookEventId: event.webhookEventId,
          accountId: event.accountId,
          projectId: event.projectId,
          webhookType: event.webhookType,
          provider: event.provider,
          payload: event.payload,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        }
      );

      this.logger.info('Webhook job added to queue', {
        operation: 'webhooks.event.job_queued',
        module: 'WebhookReceivedEventHandler',
        webhookEventId: event.webhookEventId,
        queueName: event.queueName,
      });

      // Atualizar status do webhook event para PROCESSING
      await this.webhookEventRepository.updateStatus(
        event.webhookEventId,
        WebhookStatus.PROCESSING
      );

      this.logger.info('Webhook status updated to PROCESSING', {
        operation: 'webhooks.event.status_updated',
        module: 'WebhookReceivedEventHandler',
        webhookEventId: event.webhookEventId,
      });
    } catch (error) {
      this.logger.error(
        'Failed to handle WebhookReceivedEvent',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'webhooks.event.error',
          module: 'WebhookReceivedEventHandler',
          webhookEventId: event.webhookEventId,
        }
      );

      // Atualizar status para FAILED
      await this.webhookEventRepository.updateStatus(
        event.webhookEventId,
        WebhookStatus.FAILED,
        error instanceof Error ? error.message : String(error)
      );

      throw error;
    }
  }
}
