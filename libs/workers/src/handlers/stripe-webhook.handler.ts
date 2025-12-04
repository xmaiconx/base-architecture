import type { StripeWebhookPayload } from '../types/StripeWebhookPayload';
import type { HandlerContext } from '../types/HandlerContext';
import type { WebhookEvent } from '@fnd/domain';
import { WebhookStatus } from '@fnd/domain';

/**
 * Pure handler for processing Stripe webhook events
 * Saves event to webhook_events and processes based on type
 * @param payload Stripe event data
 * @param context Handler context with injected services
 */
export async function stripeWebhookHandler(
  payload: StripeWebhookPayload,
  context: HandlerContext
): Promise<void> {
  const { webhookEventRepository, logger, accountRepository } = context;

  try {
    // Validate payload
    if (!payload.id || !payload.type || !payload.data) {
      throw new Error('Invalid Stripe webhook payload: missing required fields');
    }

    logger.info('Processing Stripe webhook event', {
      eventId: payload.id,
      eventType: payload.type,
      handler: 'stripeWebhookHandler',
    });

    // Extract account ID from metadata if present
    const stripeObject = payload.data.object;
    const accountId = stripeObject?.metadata?.accountId || null;

    // Save webhook event to database for auditing
    const savedEvent = await webhookEventRepository.create({
      accountId: accountId || 'unknown',
      projectId: null,
      webhookType: 'stripe',
      provider: 'stripe',
      channel: null,
      implementation: null,
      eventName: payload.type,
      status: WebhookStatus.PENDING,
      payload: payload,
      metadata: null,
      queueName: null,
    });

    logger.info('Stripe webhook event saved to database', {
      webhookEventId: savedEvent.id,
      eventType: payload.type,
    });

    // Process event based on type
    try {
      await processStripeEvent(payload, accountId, context);

      // Mark as processed
      await webhookEventRepository.update(savedEvent.id, {
        processedAt: new Date(),
        status: WebhookStatus.PROCESSED,
      });

      logger.info('Stripe webhook event processed successfully', {
        webhookEventId: savedEvent.id,
        eventType: payload.type,
      });
    } catch (processingError) {
      // Mark as failed
      const errorMessage =
        processingError instanceof Error
          ? processingError.message
          : String(processingError);

      await webhookEventRepository.update(savedEvent.id, {
        status: WebhookStatus.FAILED,
        errorMessage,
      });

      const err = processingError instanceof Error ? processingError : new Error(String(processingError));
      logger.error('Stripe webhook event processing failed', err, {
        webhookEventId: savedEvent.id,
        eventType: payload.type,
      });

      throw processingError;
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Failed to handle Stripe webhook', error, {
      eventId: payload.id,
      eventType: payload.type,
    });
    throw error;
  }
}

/**
 * Process Stripe event based on type
 */
async function processStripeEvent(
  payload: StripeWebhookPayload,
  accountId: string | null,
  context: HandlerContext
): Promise<void> {
  const { logger } = context;
  const accountIdStr = accountId || undefined;

  switch (payload.type) {
    case 'customer.subscription.created':
      logger.info('Subscription created', {
        customerId: payload.data.object.customer,
        subscriptionId: payload.data.object.id,
        accountId: accountIdStr,
      });
      // TODO: Update account subscription status
      break;

    case 'customer.subscription.updated':
      logger.info('Subscription updated', {
        customerId: payload.data.object.customer,
        subscriptionId: payload.data.object.id,
        status: payload.data.object.status,
        accountId: accountIdStr,
      });
      // TODO: Update account subscription status
      break;

    case 'customer.subscription.deleted':
      logger.info('Subscription deleted', {
        customerId: payload.data.object.customer,
        subscriptionId: payload.data.object.id,
        accountId: accountIdStr,
      });
      // TODO: Update account subscription status to cancelled
      break;

    case 'invoice.paid':
      logger.info('Invoice paid', {
        invoiceId: payload.data.object.id,
        customerId: payload.data.object.customer,
        amount: payload.data.object.amount_paid,
        accountId: accountIdStr,
      });
      // TODO: Record payment in database
      break;

    case 'invoice.payment_failed':
      logger.warn('Invoice payment failed', {
        invoiceId: payload.data.object.id,
        customerId: payload.data.object.customer,
        accountId: accountIdStr,
      });
      // TODO: Send payment failure notification
      break;

    case 'checkout.session.completed':
      logger.info('Checkout session completed', {
        sessionId: payload.data.object.id,
        customerId: payload.data.object.customer,
        accountId: accountIdStr,
      });
      // TODO: Activate subscription/product
      break;

    default:
      logger.debug('Unhandled Stripe event type', {
        eventType: payload.type,
        accountId: accountIdStr,
      });
  }
}
