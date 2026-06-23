import { readIndexerUrl } from './protocol-env.js';

export type PassportFulfillment = {
  id: string;
  claimId: string;
  email: string;
  preferredName: string;
  nodename: string;
  suinsSubname: string;
  suinsStatus: 'provisioned' | 'pending_operator' | 'skipped' | 'failed';
  suinsTxDigest: string | null;
  submitterAddress: string | null;
  archetype: number;
  status: 'pending_suins' | 'pending_onchain' | 'completed' | 'failed';
  onchainTxDigest: string | null;
  createdAtMs: number;
  updatedAtMs: number;
};

export type QueuePassportFulfillmentClaim = {
  claimId: string;
  email: string;
  preferredName: string;
  nodename: string;
  submitterAddress: string | null;
  archetype: number;
};

function apiBaseUrl(): string | null {
  return readIndexerUrl();
}

async function fulfillmentFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const base = apiBaseUrl();

  if (!base) {
    return null;
  }

  const response = await fetch(base + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 404) {
    return null;
  }

  const payload = (await response.json()) as T & { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? 'Passport fulfillment request failed.');
  }

  return payload;
}

export function isPassportFulfillmentApiAvailable(): boolean {
  return apiBaseUrl() !== null;
}

export async function fetchPendingPassportFulfillments(): Promise<PassportFulfillment[]> {
  const payload = await fulfillmentFetch<{ fulfillments: PassportFulfillment[] }>(
    '/api/passport/fulfillment/pending'
  );

  return payload?.fulfillments ?? [];
}

export async function fetchPassportFulfillmentForClaim(
  claimId: string
): Promise<PassportFulfillment | null> {
  const payload = await fulfillmentFetch<{ fulfillment: PassportFulfillment }>(
    '/api/passport/fulfillment/claim/' + encodeURIComponent(claimId)
  );

  return payload?.fulfillment ?? null;
}

export async function fetchPendingPassportFulfillmentForEmail(
  email: string
): Promise<PassportFulfillment | null> {
  const payload = await fulfillmentFetch<{ fulfillment: PassportFulfillment }>(
    '/api/passport/fulfillment/email/' + encodeURIComponent(email.trim().toLowerCase())
  );

  return payload?.fulfillment ?? null;
}

export async function queuePassportFulfillmentsForClaims(
  claims: QueuePassportFulfillmentClaim[]
): Promise<PassportFulfillment[]> {
  if (claims.length === 0) {
    return [];
  }

  const payload = await fulfillmentFetch<{ fulfillments: PassportFulfillment[] }>(
    '/api/passport/fulfillment/queue',
    {
      method: 'POST',
      body: JSON.stringify({ claims }),
    }
  );

  return payload?.fulfillments ?? [];
}

export async function retryPassportSuinsProvision(
  fulfillmentId: string
): Promise<PassportFulfillment | null> {
  const payload = await fulfillmentFetch<{ fulfillment: PassportFulfillment }>(
    '/api/passport/fulfillment/' + encodeURIComponent(fulfillmentId) + '/retry-suins',
    { method: 'POST', body: '{}' }
  );

  return payload?.fulfillment ?? null;
}

export async function completePassportFulfillment(
  fulfillmentId: string,
  txDigest: string
): Promise<PassportFulfillment | null> {
  const payload = await fulfillmentFetch<{ fulfillment: PassportFulfillment }>(
    '/api/passport/fulfillment/' + encodeURIComponent(fulfillmentId) + '/complete',
    {
      method: 'POST',
      body: JSON.stringify({ txDigest }),
    }
  );

  return payload?.fulfillment ?? null;
}