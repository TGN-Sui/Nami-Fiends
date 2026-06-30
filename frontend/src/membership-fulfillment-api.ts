import { readIndexerUrl, readWalletAuthRequired } from './protocol-env.js';
import {
  canSignWalletAuthWithZkLogin,
  createCatalogSyncAuthPayload,
  createEquipSyncAuthPayload,
  createWalletAuthPayload,
  signWalletAuthWithZkLogin,
  type WalletAuthPayload,
} from './wallet-auth.js';

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

async function resolveOfficialOwnerAuth(owner: string): Promise<WalletAuthPayload | null> {
  if (!readWalletAuthRequired()) {
    return null;
  }

  if (canSignWalletAuthWithZkLogin(owner)) {
    return signWalletAuthWithZkLogin(owner);
  }

  return createCatalogSyncAuthPayload(owner);
}

async function resolveFulfillmentOperatorAuth(owner: string): Promise<WalletAuthPayload | null> {
  if (!readWalletAuthRequired()) {
    return null;
  }

  if (canSignWalletAuthWithZkLogin(owner)) {
    return signWalletAuthWithZkLogin(owner);
  }

  const officialAuth = await createWalletAuthPayload(owner);

  if (officialAuth) {
    return officialAuth;
  }

  return createEquipSyncAuthPayload(owner);
}

export function isMembershipFulfillmentApiAvailable(): boolean {
  return apiBaseUrl() !== null;
}

export async function fetchPendingMembershipFulfillments(
  operatorOwner: string
): Promise<MembershipFulfillment[]> {
  const auth = await resolveOfficialOwnerAuth(operatorOwner);
  const payload = await fulfillmentFetch<{ fulfillments: MembershipFulfillment[] }>(
    '/api/memberships/fulfillment/pending',
    {
      method: 'POST',
      body: JSON.stringify({ owner: operatorOwner, auth }),
    }
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
  txDigest: string,
  operatorOwner: string
): Promise<MembershipFulfillment | null> {
  const auth = await resolveFulfillmentOperatorAuth(operatorOwner);
  const payload = await fulfillmentFetch<{ fulfillment: MembershipFulfillment }>(
    '/api/memberships/fulfillment/' + encodeURIComponent(fulfillmentId) + '/complete',
    {
      method: 'POST',
      body: JSON.stringify({ owner: operatorOwner, auth, txDigest }),
    }
  );

  return payload?.fulfillment ?? null;
}