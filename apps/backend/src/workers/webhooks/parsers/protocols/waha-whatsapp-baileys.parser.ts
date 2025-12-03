import { Injectable } from '@nestjs/common';
import { ParsedWebhookData } from '@fnd/backend';
import { BaseWebhookParser } from '../base/base-webhook-parser';

/**
 * Parser para webhooks: Waha + WhatsApp + Baileys
 */
@Injectable()
export class WahaWhatsappBaileysParser extends BaseWebhookParser {
  readonly providerName = 'WAHA';
  readonly defaultQueueName = 'webhook-waha-whatsapp-baileys';

  async parse(payload: unknown): Promise<ParsedWebhookData> {
    // TODO: Implementar parsing específico
    // Provider: Waha
    // Channel: WhatsApp
    // Implementation: Baileys
    //
    // Estrutura esperada do payload: (aguardando documentação)
    //
    // Extrair:
    // - eventName: tipo do evento
    // - metadata: informações relevantes

    return {
      eventName: 'message.waha.whatsapp.baileys',
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
