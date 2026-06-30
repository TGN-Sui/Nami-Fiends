import { randomUUID } from 'node:crypto';

import type { MembershipPaymentIntent } from './membership-payments.service.js';
import { normalizeSubscriptionTier } from './membership-subscriptions.service.js';
import { readJsonFile, writeJsonFile } from '../storage.js';

export type FulfillmentTier = 'Pro' | 'Elite';

export type MembershipFulfillmentStatus = 'pending_onchain' | 'completed' | 'skipped';

export type MembershipFulfillment = {
  id: string;
  owner: string;
  tier: FulfillmentTier;
  paymentId: string;
  expiresAtMs: number;
  status: MembershipFulfillmentStatus;
  txDigest: string | null;
  createdAtMs: number;
  updatedAtMs: number;
};

type FulfillmentStore = {
  fulfillments: MembershipFulfillment[];
};

const FULFILLMENT_PATH = 'data/projections/membership-fulfillments.json';

function emptyStore(): FulfillmentStore {
  return { fulfillments: [] };
}

async function readStore(): Promise<FulfillmentStore> {
  return readJsonFile<FulfillmentStore>(FULFILLMENT_PATH, emptyStore());
}

async function writeStore(store: FulfillmentStore): Promise<void> {
  await writeJsonFile(FULFILLMENT_PATH, store);
}

function normalizeOwner(owner: string): string {
  return owner.trim().toLowerCase();
}

function renewalWindowMs(billingCycle: 'monthly' | 'annual'): number {
  const days = billingCycle === 'annual' ? 365 : 30;
  return days * 24 * 60 * 60 * 1000;
}

export async function queueMembershipFulfillmentFromPayment(
  intent: MembershipPaymentIntent,
  renewsAtMs: number
): Promise<MembershipFulfillment | null> {
  const tier = normalizeSubscriptionTier(intent.tier);

  if (tier !== 'Pro' && tier !== 'Elite') {
    return null;
  }

  const owner = normalizeOwner(intent.owner);
  const store = await readStore();
  const existing = store.fulfillments.find(
    (row) =>
      row.owner === owner &&
      row.paymentId === intent.id &&
      row.status === 'pending_onchain'
  );

  if (existing) {
    return existing;
  }

  const now = Date.now();
  const fulfillment: MembershipFulfillment = {
    id: randomUUID(),
    owner,
    tier,
    paymentId: intent.id,
    expiresAtMs: renewsAtMs || now + renewalWindowMs(intent.billingCycle),
    status: 'pending_onchain',
    txDigest: null,
    createdAtMs: now,
    updatedAtMs: now,
  };

  store.fulfillments.unshift(fulfillment);
  await writeStore(store);
  return fulfillment;
}

export async function listPendingMembershipFulfillments(): Promise<MembershipFulfillment[]> {
  const store = await readStore();

  return store.fulfillments.filter((row) => row.status === 'pending_onchain');
}

export async function getMembershipFulfillmentById(
  fulfillmentId: string
): Promise<MembershipFulfillment | null> {
  const store = await readStore();

  return store.fulfillments.find((row) => row.id === fulfillmentId) ?? null;
}

export async function getPendingFulfillmentForOwner(
  owner: string
): Promise<MembershipFulfillment | null> {
  const normalized = normalizeOwner(owner);
  const store = await readStore();

  return (
    store.fulfillments.find(
      (row) => row.owner === normalized && row.status === 'pending_onchain'
    ) ?? null
  );
}

export async function completeMembershipFulfillment(
  fulfillmentId: string,
  txDigest: string
): Promise<MembershipFulfillment | null> {
  const store = await readStore();
  const index = store.fulfillments.findIndex((row) => row.id === fulfillmentId);

  if (index < 0) {
    return null;
  }

  const now = Date.now();

  store.fulfillments[index] = {
    ...store.fulfillments[index]!,
    status: 'completed',
    txDigest,
    updatedAtMs: now,
  };

  await writeStore(store);
  return store.fulfillments[index]!;
}