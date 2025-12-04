import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  sendEmailHandler,
  createHandlerContext,
  verifyQStashSignature,
  type SendEmailPayload,
} from '@fnd/workers';

/**
 * Vercel Function wrapper for send-email worker
 * Verifies QStash signature and delegates to pure handler
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

    // Get QStash signature from headers
    const signature = req.headers['upstash-signature'] as string;
    if (!signature) {
      res.status(401).json({ error: 'Missing QStash signature' });
      return;
    }

    // Get signing keys from environment
    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

    if (!currentSigningKey || !nextSigningKey) {
      console.error('QStash signing keys not configured');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    // Verify signature
    const body = JSON.stringify(req.body);
    const isValid = await verifyQStashSignature(
      body,
      signature,
      currentSigningKey,
      nextSigningKey
    );

    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Parse payload
    const payload: SendEmailPayload = req.body;

    // Create context and call handler
    const context = await createHandlerContext();
    await sendEmailHandler(payload, context);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Send email handler error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
