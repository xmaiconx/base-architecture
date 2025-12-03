import { Injectable } from '@nestjs/common';
import { ParsedWebhookData } from '@fnd/backend';
import { BaseWebhookParser } from '../base/base-webhook-parser';

/**
 * Parser para webhooks: Whaticket + WhatsApp + WhatsMeow
 */
@Injectable()
export class WhaticketWhatsappWhatsMeowParser extends BaseWebhookParser {
  readonly providerName = 'WHATICKET';
  readonly defaultQueueName = 'webhook-whaticket-whatsapp-whatsmeow';

  async parse(payload: unknown): Promise<ParsedWebhookData> {
    // TODO: Implementar parsing específico
    // Provider: Whaticket
    // Channel: WhatsApp
    // Implementation: WhatsMeow
    //
    // Estrutura esperada do payload: (aguardando documentação)
    //
    // Extrair:
    // - eventName: tipo do evento
    // - metadata: informações relevantes

    return {
      eventName: 'message.whaticket.whatsapp.whatsmeow',
      queueName: this.defaultQueueName,
      metadata: {
        provider: this.providerName,
        channel: 'WHATSAPP',
        implementation: 'WHATSMEOW',
        rawPayload: payload,
      },
    };
  }
}
