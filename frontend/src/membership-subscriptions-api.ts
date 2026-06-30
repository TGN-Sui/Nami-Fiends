import { readIndexerUrl } from './protocol-env.js';
import { createWalletAuthPayload } from './wallet-auth.js';

import type {
  AdventurerAccessSource,
  MembershipBillingCycle,
  MembershipPlanState,
  MembershipPlanStatus,
  PaidMembershipTier,
} from './membership-plans-store.js';

export type MembershipSubscription = {
  owner: string;
  activeTier: PaidMembershipTier;
  billingCycle: MembershipBillingCycle;
  status: MembershipPlanStatus;
  pendingTier: PaidMembershipTier | null;
  adventurerSource: AdventurerAccessSource;
  renewsAtMs: number;
  lastPaymentId: string | null;
  updatedAtMs: number;
};

function apiBaseUrl(): string | null {
  return readIndexerUrl();
}

async function subscriptionFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
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
    throw new Error(payload.message ?? payload.error ?? 'Subscription request failed.');
  }

  return payload;
}

export function isMembershipSubscriptionApiAvailable(): boolean {
  return apiBaseUrl() !== null;
}

export async function fetchMembershipSubscription(
  owner: string
): Promise<MembershipSubscription | null> {
  const payload = await subscriptionFetch<{ subscription: MembershipSubscription }>(
    '/api/memberships/subscriptions/owner/' + encodeURIComponent(owner)
  );

  return payload?.subscription ?? null;
}

export async function syncMembershipSubscriptionToBackend(
  state: MembershipPlanState,
  owner: string
): Promise<MembershipSubscription | null> {
  const auth = await createWalletAuthPayload(owner);

  const payload = await subscriptionFetch<{ subscription: MembershipSubscription }>(
    '/api/memberships/subscriptions/sync',
    {
      method: 'POST',
      body: JSON.stringify({
        owner,
        auth,
        activeTier: state.activeTier,
        billingCycle: state.billingCycle,
        status: state.status,
        pendingTier: state.pendingTier,
        adventurerSource: state.adventurerSource,
        renewsAtMs: state.renewsAtMs,
      }),
    }
  );

  return payload?.subscription ?? null;
}

export function subscriptionToPlanState(
  subscription: MembershipSubscription
): MembershipPlanState {
  return {
    activeTier: subscription.activeTier,
    billingCycle: subscription.billingCycle,
    status: subscription.status,
    pendingTier: subscription.pendingTier,
    pendingCheckoutRail: null,
    pendingCryptoAsset: null,
    pendingPaymentId: subscription.lastPaymentId,
    adventurerSource: subscription.adventurerSource,
    renewsAtMs: subscription.renewsAtMs,
    updatedAtMs: subscription.updatedAtMs,
  };
}