import { Injectable } from '@nestjs/common';
import { ParsedWebhookData } from '@fnd/backend';
import { BaseWebhookParser } from '../base/base-webhook-parser';

/**
 * Parser para webhooks: NotificameHub + WhatsApp + Baileys
 */
@Injectable()
export class NotificamehubWhatsappBaileysParser extends BaseWebhookParser {
  readonly providerName = 'NOTIFICAMEHUB';
  readonly defaultQueueName = 'webhook-notificamehub-whatsapp-baileys';

  async parse(payload: unknown): Promise<ParsedWebhookData> {
    // TODO: Implementar parsing específico
    // Provider: NotificameHub
    // Channel: WhatsApp
    // Implementation: Baileys
    //
    // Estrutura esperada do payload: (aguardando documentação)
    //
    // Extrair:
    // - eventName: tipo do evento
    // - metadata: informações relevantes

    return {
      eventName: 'message.notificamehub.whatsapp.baileys',
      queueName: this.defaultQueueName,
      metadata: {
        provider: this.providerName,
        channel: 'WHATSAPP',
        implementation: 'BAILEYS',
        rawPayload: payload,
      },
    };
  }
}
