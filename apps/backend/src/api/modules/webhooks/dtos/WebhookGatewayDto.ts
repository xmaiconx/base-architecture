import { WebhookType } from '@fnd/domain';

/**
 * DTO representando os dados decodificados do UUID do gateway
 */
export interface WebhookGatewayDto {
  accountId: string;
  projectId: string;
  webhookType: WebhookType;
  provider: string;
  channel?: string;
  implementation?: string;
}

/**
 * DTO para receber o webhook via gateway
 */
export interface ReceiveWebhookDto {
  uuid: string;
  payload: unknown;
}
