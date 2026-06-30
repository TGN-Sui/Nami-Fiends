import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFile } from '../storage.js';
import {
  provisionSuinsSubname,
  type SuinsProvisionStatus,
} from './suins-provision.service.js';

export type PassportFulfillmentStatus =
  | 'pending_suins'
  | 'pending_onchain'
  | 'completed'
  | 'failed';

export type PassportFulfillment = {
  id: string;
  claimId: string;
  email: string;
  preferredName: string;
  nodename: string;
  suinsSubname: string;
  suinsStatus: SuinsProvisionStatus;
  suinsTxDigest: string | null;
  submitterAddress: string | null;
  archetype: number;
  status: PassportFulfillmentStatus;
  onchainTxDigest: string | null;
  createdAtMs: number;
  updatedAtMs: number;
};

type FulfillmentStore = {
  fulfillments: PassportFulfillment[];
};

const FULFILLMENT_PATH = 'data/projections/passport-fulfillments.json';

function emptyStore(): FulfillmentStore {
  return { fulfillments: [] };
}

async function readStore(): Promise<FulfillmentStore> {
  return readJsonFile<FulfillmentStore>(FULFILLMENT_PATH, emptyStore());
}

async function writeStore(store: FulfillmentStore): Promise<void> {
  await writeJsonFile(FULFILLMENT_PATH, store);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function fulfillmentStatusFromSuins(
  suinsStatus: SuinsProvisionStatus
): PassportFulfillmentStatus {
  if (suinsStatus === 'failed') {
    return 'failed';
  }

  if (suinsStatus === 'pending_operator') {
    return 'pending_suins';
  }

  return 'pending_onchain';
}

export type QueuePassportFulfillmentInput = {
  claimId: string;
  email: string;
  preferredName: string;
  nodename: string;
  submitterAddress: string | null;
  archetype: number;
};

export async function queuePassportFulfillmentFromClaim(
  input: QueuePassportFulfillmentInput
): Promise<PassportFulfillment> {
  const store = await readStore();
  const email = normalizeEmail(input.email);
  const existing = store.fulfillments.find(
    (row) => row.claimId === input.claimId && row.status !== 'completed'
  );

  if (existing) {
    return existing;
  }

  const suins = await provisionSuinsSubname({
    nodename: input.nodename,
    recipientAddress: input.submitterAddress,
  });
  const now = Date.now();

  const fulfillment: PassportFulfillment = {
    id: randomUUID(),
    claimId: input.claimId,
    email,
    preferredName: input.preferredName.trim() || input.nodename,
    nodename: input.nodename.trim().toLowerCase(),
    suinsSubname: suins.subname,
    suinsStatus: suins.status,
    suinsTxDigest: suins.txDigest,
    submitterAddress: input.submitterAddress,
    archetype: input.archetype,
    status: fulfillmentStatusFromSuins(suins.status),
    onchainTxDigest: null,
    createdAtMs: now,
    updatedAtMs: now,
  };

  store.fulfillments.unshift(fulfillment);
  await writeStore(store);
  return fulfillment;
}

export async function queuePassportFulfillmentsFromClaims(
  claims: QueuePassportFulfillmentInput[]
): Promise<PassportFulfillment[]> {
  const results: PassportFulfillment[] = [];

  for (const claim of claims) {
    results.push(await queuePassportFulfillmentFromClaim(claim));
  }

  return results;
}

export async function listPendingPassportFulfillments(): Promise<PassportFulfillment[]> {
  const store = await readStore();

  return store.fulfillments.filter(
    (row) => row.status === 'pending_suins' || row.status === 'pending_onchain'
  );
}

export async function getPassportFulfillmentForClaim(
  claimId: string
): Promise<PassportFulfillment | null> {
  const store = await readStore();

  return store.fulfillments.find((row) => row.claimId === claimId) ?? null;
}

export async function getPassportFulfillmentById(
  fulfillmentId: string
): Promise<PassportFulfillment | null> {
  const store = await readStore();

  return store.fulfillments.find((row) => row.id === fulfillmentId) ?? null;
}

export async function getPendingPassportFulfillmentForEmail(
  email: string
): Promise<PassportFulfillment | null> {
  const normalized = normalizeEmail(email);
  const store = await readStore();

  return (
    store.fulfillments.find(
      (row) =>
        row.email === normalized &&
        (row.status === 'pending_suins' || row.status === 'pending_onchain')
    ) ?? null
  );
}

export async function retrySuinsProvision(fulfillmentId: string): Promise<PassportFulfillment | null> {
  const store = await readStore();
  const index = store.fulfillments.findIndex((row) => row.id === fulfillmentId);

  if (index < 0) {
    return null;
  }

  const current = store.fulfillments[index]!;
  const suins = await provisionSuinsSubname({
    nodename: current.nodename,
    recipientAddress: current.submitterAddress,
  });
  const now = Date.now();

  store.fulfillments[index] = {
    ...current,
    suinsSubname: suins.subname,
    suinsStatus: suins.status,
    suinsTxDigest: suins.txDigest,
    status: fulfillmentStatusFromSuins(suins.status),
    updatedAtMs: now,
  };

  await writeStore(store);
  return store.fulfillments[index]!;
}

export async function completePassportFulfillment(
  fulfillmentId: string,
  txDigest: string
): Promise<PassportFulfillment | null> {
  const store = await readStore();
  const index = store.fulfillments.findIndex((row) => row.id === fulfillmentId);

  if (index < 0) {
    return null;
  }

  const now = Date.now();

  store.fulfillments[index] = {
    ...store.fulfillments[index]!,
    status: 'completed',
    onchainTxDigest: txDigest,
    updatedAtMs: now,
  };

  await writeStore(store);
  return store.fulfillments[index]!;
}