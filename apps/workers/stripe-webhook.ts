import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import {
  stripeWebhookHandler,
  createHandlerContext,
  type StripeWebhookPayload,
} from '@fnd/workers';

/**
 * Vercel Function wrapper for stripe-webhook worker
 * Verifies Stripe signature (NOT QStash) and delegates to pure handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Get Stripe signature from headers
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      res.status(401).json({ error: 'Missing Stripe signature' });
      return;
    }

    // Get Stripe webhook secret from environment
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    // Initialize Stripe client
    const stripeApiKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeApiKey) {
      console.error('Stripe API key not configured');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const stripe = new Stripe(stripeApiKey, {
      apiVersion: '2025-02-24.acacia',
    });

    // Verify Stripe signature and construct event
    let event: Stripe.Event;
    try {
      // Get raw body (Vercel provides this as Buffer)
      const rawBody = req.body as any;
      const bodyString = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);

      event = stripe.webhooks.constructEvent(
        bodyString,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Stripe signature verification failed:', err);
      res.status(401).json({
        error: err instanceof Error ? err.message : 'Invalid signature',
      });
      return;
    }

    // Convert Stripe event to our payload format
    const payload: StripeWebhookPayload = {
      id: event.id,
      type: event.type,
      data: event.data,
      created: event.created,
      livemode: event.livemode,
    };

    // Create context and call handler
    const context = await createHandlerContext();
    await stripeWebhookHandler(payload, context);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
