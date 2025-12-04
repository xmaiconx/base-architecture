/**
 * Stripe Webhook Payload - represents Stripe event data
 */
export interface StripeWebhookPayload {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode?: boolean;
  pending_webhooks?: number;
  request?: {
    id: string | null;
    idempotency_key: string | null;
  };
  api_version?: string;
}
