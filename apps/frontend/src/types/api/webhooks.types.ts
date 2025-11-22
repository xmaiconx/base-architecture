/**
 * Webhooks Module DTOs - Frontend Types
 * Mirrored from backend webhooks module
 */

export type WebhookType = 'incoming' | 'outgoing';
export type WebhookStatus = 'pending' | 'processing' | 'processed' | 'failed';

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

export interface UpdateWebhookEventDto {
  status?: WebhookStatus;
  eventName?: string | null;
  metadata?: Record<string, unknown> | null;
  queueName?: string | null;
  errorMessage?: string | null;
  processedAt?: Date | null;
}

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

export interface WebhookGatewayDto {
  accountId: string;
  projectId: string;
  webhookType: WebhookType;
  provider: string;
  channel?: string;
  implementation?: string;
}

export interface ReceiveWebhookDto {
  uuid: string;
  payload: unknown;
}
