import { createHmac, timingSafeEqual } from 'node:crypto';

/** Stripe recommends rejecting webhooks older than 5 minutes. */
export const STRIPE_WEBHOOK_TOLERANCE_SEC = 300;

export function parseStripeSignatureHeader(header: string): { timestamp: string; signatures: string[] } {
  const parts = header.split(',').map((part) => part.trim());
  let timestamp = '';
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');

    if (key === 't') {
      timestamp = value ?? '';
    }

    if (key === 'v1' && value) {
      signatures.push(value);
    }
  }

  return { timestamp, signatures };
}

export function assertStripeWebhookTimestampFresh(
  timestamp: string,
  toleranceSec = STRIPE_WEBHOOK_TOLERANCE_SEC
): void {
  const timestampSec = Number(timestamp);

  if (!Number.isFinite(timestampSec) || timestampSec <= 0) {
    throw new Error('Invalid Stripe webhook timestamp.');
  }

  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - timestampSec);

  if (ageSec > toleranceSec) {
    throw new Error('Stripe webhook timestamp outside tolerance window.');
  }
}

export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  toleranceSec = STRIPE_WEBHOOK_TOLERANCE_SEC
): void {
  if (!signatureHeader.trim()) {
    throw new Error('Missing Stripe signature header.');
  }

  const { timestamp, signatures } = parseStripeSignatureHeader(signatureHeader);

  if (!timestamp || signatures.length === 0) {
    throw new Error('Invalid Stripe signature header.');
  }

  assertStripeWebhookTimestampFresh(timestamp, toleranceSec);

  const signedPayload = timestamp + '.' + rawBody;
  const expected = createHmac('sha256', secret).update(signedPayload).digest('hex');

  const verified = signatures.some((signature) => {
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  });

  if (!verified) {
    throw new Error('Invalid Stripe webhook signature.');
  }
}