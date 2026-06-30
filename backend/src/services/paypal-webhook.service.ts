import type { IncomingMessage } from 'node:http';

import { isConfiguredSecret, paymentConfig } from '../payment-config.js';

export type PayPalWebhookHeaders = {
  transmissionId: string;
  transmissionTime: string;
  transmissionSig: string;
  certUrl: string;
  authAlgo: string;
};

function readHeader(request: IncomingMessage, name: string): string {
  const value = request.headers[name.toLowerCase()];

  return typeof value === 'string' ? value.trim() : '';
}

export function readPayPalWebhookHeaders(request: IncomingMessage): PayPalWebhookHeaders | null {
  const transmissionId = readHeader(request, 'paypal-transmission-id');
  const transmissionTime = readHeader(request, 'paypal-transmission-time');
  const transmissionSig = readHeader(request, 'paypal-transmission-sig');
  const certUrl = readHeader(request, 'paypal-cert-url');
  const authAlgo = readHeader(request, 'paypal-auth-algo');

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    return null;
  }

  return {
    transmissionId,
    transmissionTime,
    transmissionSig,
    certUrl,
    authAlgo,
  };
}

export function isPayPalWebhookConfigured(): boolean {
  return (
    isConfiguredSecret(paymentConfig.paypalClientId) &&
    isConfiguredSecret(paymentConfig.paypalClientSecret) &&
    isConfiguredSecret(paymentConfig.paypalWebhookId)
  );
}

async function getPayPalAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    paymentConfig.paypalClientId + ':' + paymentConfig.paypalClientSecret,
  ).toString('base64');

  const body = new URLSearchParams({ grant_type: 'client_credentials' });
  const response = await fetch(paymentConfig.paypalApiBase + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + credentials,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error('PayPal OAuth failed: ' + (await response.text()));
  }

  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}

export async function verifyPayPalWebhookSignature(
  rawBody: string,
  headers: PayPalWebhookHeaders,
): Promise<void> {
  if (!isPayPalWebhookConfigured()) {
    throw new Error('PayPal webhook is not configured.');
  }

  const token = await getPayPalAccessToken();
  const response = await fetch(
    paymentConfig.paypalApiBase + '/v1/notifications/verify-webhook-signature',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: headers.authAlgo,
        cert_url: headers.certUrl,
        transmission_id: headers.transmissionId,
        transmission_sig: headers.transmissionSig,
        transmission_time: headers.transmissionTime,
        webhook_id: paymentConfig.paypalWebhookId,
        webhook_event: JSON.parse(rawBody) as unknown,
      }),
    },
  );

  if (!response.ok) {
    throw new Error('PayPal webhook verification failed: ' + (await response.text()));
  }

  const payload = (await response.json()) as { verification_status?: string };

  if (payload.verification_status !== 'SUCCESS') {
    throw new Error('Invalid PayPal webhook signature.');
  }
}