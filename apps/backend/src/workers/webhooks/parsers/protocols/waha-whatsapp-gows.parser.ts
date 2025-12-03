import { Injectable } from '@nestjs/common';
import { ParsedWebhookData } from '@fnd/backend';
import { BaseWebhookParser } from '../base/base-webhook-parser';

/**
 * Parser para webhooks: Waha + WhatsApp + GOWS (Go WhatsApp)
 */
@Injectable()
export class WahaWhatsappGowsParser extends BaseWebhookParser {
  readonly providerName = 'WAHA';
  readonly defaultQueueName = 'webhook-waha-whatsapp-gows';

  async parse(payload: unknown): Promise<ParsedWebhookData> {
    // TODO: Implementar parsing específico
    // Provider: Waha
    // Channel: WhatsApp
    // Implementation: GOWS (Go WhatsApp)
    //
    // Estrutura esperada do payload: (aguardando documentação)
    //
    // Extrair:
    // - eventName: tipo do evento
    // - metadata: informações relevantes

    return {
      eventName: 'message.waha.whatsapp.gows',
      queueName: this.defaultQueueName,
      metadata: {
        provider: this.providerName,
        channel: 'WHATSAPP',
        implementation: 'GOWS',
        rawPayload: payload,
      },
    };
  }
}
