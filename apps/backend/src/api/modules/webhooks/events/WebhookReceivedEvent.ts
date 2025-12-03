import { BaseEvent } from '../../../../shared/base';
import { WebhookType } from '@fnd/domain';

export interface WebhookReceivedEventData {
  webhookEventId: string;
  accountId: string;
  projectId: string | null;
  webhookType: WebhookType;
  provider: string;
  channel?: string | null;
  implementation?: string | null;
  queueName: string;
  payload: unknown;
}

/**
 * Evento publicado quando um webhook é recebido e persistido
 * Event handlers devem adicionar o webhook à fila para processamento assíncrono
 */
export class WebhookReceivedEvent extends BaseEvent {
  constructor(aggregateId: string, data: WebhookReceivedEventData) {
    super('WebhookReceivedEvent', aggregateId, data);
  }

  get webhookEventId(): string {
    return this.data.webhookEventId;
  }

  get accountId(): string {
    return this.data.accountId;
  }

  get projectId(): string | null {
    return this.data.projectId;
  }

  get webhookType(): WebhookType {
    return this.data.webhookType;
  }

  get provider(): string {
    return this.data.provider;
  }

  get channel(): string | null | undefined {
    return this.data.channel;
  }

  get implementation(): string | null | undefined {
    return this.data.implementation;
  }

  get queueName(): string {
    return this.data.queueName;
  }

  get payload(): unknown {
    return this.data.payload;
  }
}
