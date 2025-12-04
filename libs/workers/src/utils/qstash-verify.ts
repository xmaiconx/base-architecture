import { Receiver } from '@upstash/qstash';

/**
 * Verify QStash signature using Upstash SDK
 * @param body Raw request body as string
 * @param signature QStash signature from request header
 * @param currentSigningKey Current signing key from QStash dashboard
 * @param nextSigningKey Next signing key from QStash dashboard
 * @returns true if signature is valid, false otherwise
 */
export async function verifyQStashSignature(
  body: string,
  signature: string,
  currentSigningKey: string,
  nextSigningKey: string
): Promise<boolean> {
  try {
    const receiver = new Receiver({
      currentSigningKey,
      nextSigningKey,
    });

    await receiver.verify({
      signature,
      body,
    });

    return true;
  } catch (error) {
    return false;
  }
}
