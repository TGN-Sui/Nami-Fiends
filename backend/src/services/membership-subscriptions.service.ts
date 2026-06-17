import type { MembershipPaymentIntent } from './membership-payments.service.js';
import { readJsonFile, writeJsonFile } from '../storage.js';

export type SubscriptionTier = 'Adventurer' | 'Pro' | 'Elite';

export type SubscriptionBillingCycle = 'monthly' | 'annual';

export type SubscriptionStatus =
  | 'active'
  | 'pending-upgrade'
  | 'pending-downgrade'
  | 'pending-cancel'
  | 'cancelled';

export type AdventurerAccessSource = 'paid' | 'x-claim' | null;

export type MembershipSubscription = {
  owner: string;
  activeTier: SubscriptionTier;
  billingCycle: SubscriptionBillingCycle;
  status: SubscriptionStatus;
  pendingTier: SubscriptionTier | null;
  adventurerSource: AdventurerAccessSource;
  renewsAtMs: number;
  lastPaymentId: string | null;
  updatedAtMs: number;
};

type SubscriptionStore = {
  subscriptions: MembershipSubscription[];
};

const SUBSCRIPTIONS_PATH = 'data/projections/membership-subscriptions.json';

const TIER_RANK: Record<SubscriptionTier, number> = {
  Adventurer: 1,
  Pro: 2,
  Elite: 3,
};

function emptyStore(): SubscriptionStore {
  return { subscriptions: [] };
}

async function readStore(): Promise<SubscriptionStore> {
  return readJsonFile<SubscriptionStore>(SUBSCRIPTIONS_PATH, emptyStore());
}

async function writeStore(store: SubscriptionStore): Promise<void> {
  await writeJsonFile(SUBSCRIPTIONS_PATH, store);
}

function normalizeOwner(owner: string): string {
  return owner.trim().toLowerCase();
}

export function normalizeSubscriptionTier(value: string): SubscriptionTier | null {
  const normalized = value.trim().toLowerCase();

  if (normalized === 'adventurer') {
    return 'Adventurer';
  }

  if (normalized === 'pro') {
    return 'Pro';
  }

  if (normalized === 'elite') {
    return 'Elite';
  }

  return null;
}

function defaultSubscription(owner: string): MembershipSubscription {
  const now = Date.now();

  return {
    owner: normalizeOwner(owner),
    activeTier: 'Adventurer',
    billingCycle: 'monthly',
    status: 'active',
    pendingTier: null,
    adventurerSource: 'paid',
    renewsAtMs: now + 30 * 24 * 60 * 60 * 1000,
    lastPaymentId: null,
    updatedAtMs: now,
  };
}

function renewalWindowMs(billingCycle: SubscriptionBillingCycle): number {
  const days = billingCycle === 'annual' ? 365 : 30;
  return days * 24 * 60 * 60 * 1000;
}

function applyRenewalRules(subscription: MembershipSubscription): MembershipSubscription {
  if (subscription.renewsAtMs > Date.now()) {
    return subscription;
  }

  if (subscription.status === 'pending-downgrade' && subscription.pendingTier) {
    return {
      ...subscription,
      activeTier: subscription.pendingTier,
      status: 'active',
      pendingTier: null,
      renewsAtMs: Date.now() + renewalWindowMs(subscription.billingCycle),
      updatedAtMs: Date.now(),
    };
  }

  if (subscription.status === 'pending-cancel') {
    if (subscription.pendingTier && TIER_RANK[subscription.pendingTier] < TIER_RANK[subscription.activeTier]) {
      return {
        ...subscription,
        activeTier: subscription.pendingTier,
        status: 'active',
        pendingTier: null,
        renewsAtMs: Date.now() + renewalWindowMs(subscription.billingCycle),
        updatedAtMs: Date.now(),
      };
    }

    return {
      ...subscription,
      activeTier: 'Adventurer',
      status: 'cancelled',
      pendingTier: null,
      adventurerSource: subscription.adventurerSource === 'x-claim' ? 'x-claim' : null,
      renewsAtMs: Date.now(),
      updatedAtMs: Date.now(),
    };
  }

  return {
    ...subscription,
    activeTier: 'Adventurer',
    status: 'cancelled',
    pendingTier: null,
    adventurerSource: subscription.adventurerSource === 'x-claim' ? 'x-claim' : null,
    renewsAtMs: Date.now(),
    updatedAtMs: Date.now(),
  };
}

export async function getMembershipSubscription(owner: string): Promise<MembershipSubscription | null> {
  const store = await readStore();
  const normalized = normalizeOwner(owner);
  const subscription = store.subscriptions.find((row) => row.owner === normalized) ?? null;

  if (!subscription) {
    return null;
  }

  const renewed = applyRenewalRules(subscription);

  if (renewed.updatedAtMs !== subscription.updatedAtMs) {
    const index = store.subscriptions.findIndex((row) => row.owner === normalized);

    if (index >= 0) {
      store.subscriptions[index] = renewed;
      await writeStore(store);
    }
  }

  return renewed;
}

export async function activateMembershipFromPaymentIntent(
  intent: MembershipPaymentIntent
): Promise<MembershipSubscription> {
  const tier = normalizeSubscriptionTier(intent.tier);

  if (!tier) {
    throw new Error('Unknown membership tier on payment intent: ' + intent.tier);
  }

  const owner = normalizeOwner(intent.owner);
  const store = await readStore();
  const index = store.subscriptions.findIndex((row) => row.owner === owner);
  const existing = index >= 0 ? store.subscriptions[index]! : defaultSubscription(intent.owner);
  const now = Date.now();

  const next: MembershipSubscription = {
    ...existing,
    owner,
    activeTier: tier,
    billingCycle: intent.billingCycle,
    status: 'active',
    pendingTier: null,
    adventurerSource: tier === 'Adventurer' ? 'paid' : existing.adventurerSource,
    renewsAtMs: now + renewalWindowMs(intent.billingCycle),
    lastPaymentId: intent.id,
    updatedAtMs: now,
  };

  if (index >= 0) {
    store.subscriptions[index] = next;
  } else {
    store.subscriptions.unshift(next);
  }

  await writeStore(store);
  return next;
}

export type SyncMembershipSubscriptionInput = {
  owner: string;
  activeTier?: string;
  billingCycle?: SubscriptionBillingCycle;
  status?: SubscriptionStatus;
  pendingTier?: string | null;
  adventurerSource?: AdventurerAccessSource;
  renewsAtMs?: number;
};

export async function syncMembershipSubscription(
  input: SyncMembershipSubscriptionInput
): Promise<MembershipSubscription> {
  if (!input.owner.startsWith('0x')) {
    throw new Error('invalid_owner');
  }

  const owner = normalizeOwner(input.owner);
  const store = await readStore();
  const index = store.subscriptions.findIndex((row) => row.owner === owner);
  const existing = index >= 0 ? store.subscriptions[index]! : defaultSubscription(input.owner);
  const now = Date.now();

  const activeTier = input.activeTier
    ? normalizeSubscriptionTier(input.activeTier) ?? existing.activeTier
    : existing.activeTier;

  const pendingTier =
    input.pendingTier === null || input.pendingTier === undefined
      ? input.pendingTier === null
        ? null
        : existing.pendingTier
      : normalizeSubscriptionTier(input.pendingTier);

  const next: MembershipSubscription = {
    ...existing,
    owner,
    activeTier,
    billingCycle: input.billingCycle ?? existing.billingCycle,
    status: input.status ?? existing.status,
    pendingTier: pendingTier ?? null,
    adventurerSource:
      input.adventurerSource === undefined ? existing.adventurerSource : input.adventurerSource,
    renewsAtMs: typeof input.renewsAtMs === 'number' ? input.renewsAtMs : existing.renewsAtMs,
    updatedAtMs: now,
  };

  if (index >= 0) {
    store.subscriptions[index] = next;
  } else {
    store.subscriptions.unshift(next);
  }

  await writeStore(store);
  return applyRenewalRules(next);
}