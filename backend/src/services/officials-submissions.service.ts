import { readJsonFile, writeJsonFile } from '../storage.js';
import { queuePassportFulfillmentsFromClaims } from './passport-fulfillment.service.js';

export type OfficialsSubmissionsProjection = {
  suggestions: unknown[];
  gameTickets: unknown[];
  partnerBanners: unknown[];
  nodenameClaims: unknown[];
  ownerProvisionedChannels: unknown[];
  updatedAtMs: number;
};

const PROJECTION_PATH = 'data/projections/officials-submissions.json';

function emptyProjection(): OfficialsSubmissionsProjection {
  return {
    suggestions: [],
    gameTickets: [],
    partnerBanners: [],
    nodenameClaims: [],
    ownerProvisionedChannels: [],
    updatedAtMs: Date.now(),
  };
}

async function readProjection(): Promise<OfficialsSubmissionsProjection> {
  const stored = await readJsonFile<OfficialsSubmissionsProjection>(PROJECTION_PATH, emptyProjection());

  return {
    suggestions: Array.isArray(stored.suggestions) ? stored.suggestions : [],
    gameTickets: Array.isArray(stored.gameTickets) ? stored.gameTickets : [],
    partnerBanners: Array.isArray(stored.partnerBanners) ? stored.partnerBanners : [],
    nodenameClaims: Array.isArray(stored.nodenameClaims) ? stored.nodenameClaims : [],
    ownerProvisionedChannels: Array.isArray(stored.ownerProvisionedChannels)
      ? stored.ownerProvisionedChannels
      : [],
    updatedAtMs: typeof stored.updatedAtMs === 'number' ? stored.updatedAtMs : Date.now(),
  };
}

async function writeProjection(projection: OfficialsSubmissionsProjection): Promise<void> {
  await writeJsonFile(PROJECTION_PATH, {
    ...projection,
    updatedAtMs: Date.now(),
  });
}

function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map(existing.map((entry) => [entry.id, entry]));

  for (const entry of incoming) {
    map.set(entry.id, entry);
  }

  return [...map.values()].sort((left, right) => {
    const leftMs = (left as { submittedAtMs?: number }).submittedAtMs ?? 0;
    const rightMs = (right as { submittedAtMs?: number }).submittedAtMs ?? 0;
    return rightMs - leftMs;
  });
}

type NodenameClaimRecord = {
  id: string;
  status?: string;
  email?: string;
  displayName?: string;
  preferredName?: string;
  nodename?: string;
  submitterAddress?: string | null;
  archetype?: number;
};

function asNodenameClaims(value: unknown): NodenameClaimRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (entry === null || typeof entry !== 'object' || typeof (entry as { id?: unknown }).id !== 'string') {
      return [];
    }

    return [entry as NodenameClaimRecord];
  });
}

function newlyApprovedClaims(
  previous: NodenameClaimRecord[],
  next: NodenameClaimRecord[]
): NodenameClaimRecord[] {
  const previousById = new Map(previous.map((claim) => [claim.id, claim.status ?? 'pending']));

  return next.filter((claim) => {
    if (claim.status !== 'approved') {
      return false;
    }

    return previousById.get(claim.id) !== 'approved';
  });
}

function asIdRecords(value: unknown): Array<{ id: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (entry !== null && typeof entry === 'object' && typeof (entry as { id?: unknown }).id === 'string') {
      return [entry as { id: string }];
    }

    return [];
  });
}

export async function getOfficialsSubmissions(): Promise<OfficialsSubmissionsProjection> {
  return readProjection();
}

export type SyncOfficialsSubmissionsInput = {
  suggestions?: unknown[];
  gameTickets?: unknown[];
  partnerBanners?: unknown[];
  nodenameClaims?: unknown[];
  ownerProvisionedChannels?: unknown[];
};

export async function syncOfficialsSubmissions(
  input: SyncOfficialsSubmissionsInput
): Promise<OfficialsSubmissionsProjection> {
  const current = await readProjection();

  const next: OfficialsSubmissionsProjection = {
    suggestions:
      input.suggestions === undefined
        ? current.suggestions
        : mergeById(asIdRecords(current.suggestions), asIdRecords(input.suggestions)),
    gameTickets:
      input.gameTickets === undefined
        ? current.gameTickets
        : mergeById(asIdRecords(current.gameTickets), asIdRecords(input.gameTickets)),
    partnerBanners:
      input.partnerBanners === undefined
        ? current.partnerBanners
        : mergeById(asIdRecords(current.partnerBanners), asIdRecords(input.partnerBanners)),
    nodenameClaims:
      input.nodenameClaims === undefined
        ? current.nodenameClaims
        : mergeById(asIdRecords(current.nodenameClaims), asIdRecords(input.nodenameClaims)),
    ownerProvisionedChannels:
      input.ownerProvisionedChannels === undefined
        ? current.ownerProvisionedChannels
        : mergeById(
            asIdRecords(current.ownerProvisionedChannels),
            asIdRecords(input.ownerProvisionedChannels)
          ),
    updatedAtMs: Date.now(),
  };

  await writeProjection(next);

  const approvedClaims = newlyApprovedClaims(
    asNodenameClaims(current.nodenameClaims),
    asNodenameClaims(next.nodenameClaims)
  );

  if (approvedClaims.length > 0) {
    void queuePassportFulfillmentsFromClaims(
      approvedClaims.flatMap((claim) => {
        const email = typeof claim.email === 'string' ? claim.email : '';
        const nodename = typeof claim.nodename === 'string' ? claim.nodename : '';

        if (!email || !nodename) {
          return [];
        }

        return [
          {
            claimId: claim.id,
            email,
            nodename,
            preferredName:
              typeof claim.preferredName === 'string'
                ? claim.preferredName
                : typeof claim.displayName === 'string'
                  ? claim.displayName
                  : nodename,
            submitterAddress:
              typeof claim.submitterAddress === 'string' ? claim.submitterAddress : null,
            archetype: typeof claim.archetype === 'number' ? claim.archetype : 0,
          },
        ];
      })
    ).catch((error) => {
      console.error('[nami-officials] passport fulfillment queue failed', error);
    });
  }

  return next;
}