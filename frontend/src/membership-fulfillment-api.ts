import { readIndexerUrl } from './protocol-env.js';

export type MembershipFulfillment = {
  id: string;
  owner: string;
  tier: 'Pro' | 'Elite';
  paymentId: string;
  expiresAtMs: number;
  status: 'pending_onchain' | 'completed' | 'skipped';
  txDigest: string | null;
  createdAtMs: number;
  updatedAtMs: number;
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
    throw new Error(payload.message ?? payload.error ?? 'Fulfillment request failed.');
  }

  return payload;
}

export function isMembershipFulfillmentApiAvailable(): boolean {
  return apiBaseUrl() !== null;
}

export async function fetchPendingMembershipFulfillments(): Promise<MembershipFulfillment[]> {
  const payload = await fulfillmentFetch<{ fulfillments: MembershipFulfillment[] }>(
    '/api/memberships/fulfillment/pending'
  );

  return payload?.fulfillments ?? [];
}

export async function fetchPendingFulfillmentForOwner(
  owner: string
): Promise<MembershipFulfillment | null> {
  const payload = await fulfillmentFetch<{ fulfillment: MembershipFulfillment }>(
    '/api/memberships/fulfillment/owner/' + encodeURIComponent(owner)
  );

  return payload?.fulfillment ?? null;
}

export async function completeMembershipFulfillment(
  fulfillmentId: string,
  txDigest: string
): Promise<MembershipFulfillment | null> {
  const payload = await fulfillmentFetch<{ fulfillment: MembershipFulfillment }>(
    '/api/memberships/fulfillment/' + encodeURIComponent(fulfillmentId) + '/complete',
    {
      method: 'POST',
      body: JSON.stringify({ txDigest }),
    }
  );

  return payload?.fulfillment ?? null;
}