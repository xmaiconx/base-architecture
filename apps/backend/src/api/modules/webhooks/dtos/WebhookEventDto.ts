import { WebhookType, WebhookStatus } from '@fnd/domain';

/**
 * DTO para criar um novo webhook event
 */
export interface CreateWebhookEventDto {
  accountId: string;
  projectId: string | null;
  webhookType: WebhookType;
  provider: string;
  channel?: string | null;
  implementation?: string | null;
  eventName?: string | null;
  payload: unknown;
  metadata?: Record<string, unknown> | null;
  queueName?: string | null;
}

/**
 * DTO para atualizar um webhook event
 */
export interface UpdateWebhookEventDto {
  status?: WebhookStatus;
  eventName?: string | null;
  metadata?: Record<string, unknown> | null;
  queueName?: string | null;
  errorMessage?: string | null;
  processedAt?: Date | null;
}

/**
 * DTO de resposta para webhook event
 */
export interface WebhookEventResponseDto {
  id: string;
  accountId: string;
  projectId: string | null;
  webhookType: WebhookType;
  provider: string;
  channel: string | null;
  implementation: string | null;
  eventName: string | null;
  status: WebhookStatus;
  queueName: string | null;
  errorMessage: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
