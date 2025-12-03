import { Injectable } from '@nestjs/common';
import { ParsedWebhookData } from '@fnd/backend';
import { BaseWebhookParser } from '../base/base-webhook-parser';

/**
 * Parser para webhooks: NotificameHub + Mercado Livre + Official
 */
@Injectable()
export class NotificamehubMercadolivreOfficialParser extends BaseWebhookParser {
  readonly providerName = 'NOTIFICAMEHUB';
  readonly defaultQueueName = 'webhook-notificamehub-mercadolivre-official';

  async parse(payload: unknown): Promise<ParsedWebhookData> {
    // TODO: Implementar parsing específico
    // Provider: NotificameHub
    // Channel: Mercado Livre
    // Implementation: Official
    //
    // Estrutura esperada do payload: (aguardando documentação)
    //
    // Extrair:
    // - eventName: tipo do evento
    // - metadata: informações relevantes

    return {
      eventName: 'message.notificamehub.mercadolivre.official',
      queueName: this.defaultQueueName,
      metadata: {
        provider: this.providerName,
        channel: 'MERCADOLIVRE',
        implementation: 'OFFICIAL',
        rawPayload: payload,
      },
    };
  }
}
