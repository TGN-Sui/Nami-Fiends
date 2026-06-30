import { config } from '../config.js';
import { readJsonFile, writeJsonFile } from '../storage.js';
import { queuePassportFulfillmentsFromClaims } from './passport-fulfillment.service.js';

export type OfficialsSubmissionsProjection = {
  suggestions: unknown[];
  gameTickets: unknown[];
  partnerBanners: unknown[];
  nodenameClaims: unknown[];
  ownerProvisionedChannels: unknown[];
  registeredMemberAccounts: unknown[];
  updatedAtMs: number;
};

const PROJECTION_PATH = `${config.dataDir}/projections/officials-submissions.json`;

function emptyProjection(): OfficialsSubmissionsProjection {
  return {
    suggestions: [],
    gameTickets: [],
    partnerBanners: [],
    nodenameClaims: [],
    ownerProvisionedChannels: [],
    registeredMemberAccounts: [],
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
    registeredMemberAccounts: Array.isArray(stored.registeredMemberAccounts)
      ? stored.registeredMemberAccounts
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

type RegisteredMemberAccountRecord = {
  email: string;
  displayName: string;
  archetype: number;
  archetypeLabel: string;
  flavorBadgeId: string;
  quizAnswers: Record<string, string>;
  issuedPlayerScore: number;
  issuedPlayerScoreTier: 'basic' | 'verified' | 'premium';
  playerScoreIssuedAtMs: number;
  signedUpAtMs: number;
  submitterAddress?: string;
  avatarUrl?: string;
};

const MAX_CLIENT_ISSUED_PLAYER_SCORE = 100;

function normalizeRegisteredMemberAccount(value: unknown): RegisteredMemberAccountRecord | null {
  if (value === null || typeof value !== 'object') {
    return null;
  }

  const entry = value as Partial<RegisteredMemberAccountRecord>;

  if (typeof entry.email !== 'string' || typeof entry.displayName !== 'string') {
    return null;
  }

  const email = entry.email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }

  return {
    email,
    displayName: entry.displayName.trim(),
    archetype: typeof entry.archetype === 'number' ? entry.archetype : 2,
    archetypeLabel:
      typeof entry.archetypeLabel === 'string' ? entry.archetypeLabel : 'Cozy Voyager',
    flavorBadgeId:
      typeof entry.flavorBadgeId === 'string' ? entry.flavorBadgeId : 'Hearth Basic',
    quizAnswers:
      entry.quizAnswers !== null &&
      typeof entry.quizAnswers === 'object' &&
      !Array.isArray(entry.quizAnswers)
        ? (entry.quizAnswers as Record<string, string>)
        : {},
    issuedPlayerScore: typeof entry.issuedPlayerScore === 'number' ? entry.issuedPlayerScore : 0,
    issuedPlayerScoreTier:
      entry.issuedPlayerScoreTier === 'basic' ||
      entry.issuedPlayerScoreTier === 'verified' ||
      entry.issuedPlayerScoreTier === 'premium'
        ? entry.issuedPlayerScoreTier
        : 'basic',
    playerScoreIssuedAtMs:
      typeof entry.playerScoreIssuedAtMs === 'number'
        ? entry.playerScoreIssuedAtMs
        : typeof entry.signedUpAtMs === 'number'
          ? entry.signedUpAtMs
          : Date.now(),
    signedUpAtMs: typeof entry.signedUpAtMs === 'number' ? entry.signedUpAtMs : Date.now(),
    ...(typeof entry.avatarUrl === 'string' && entry.avatarUrl.trim() !== ''
      ? { avatarUrl: entry.avatarUrl.trim() }
      : {}),
  };
}

function mergeRegisteredMemberAccounts(
  existing: RegisteredMemberAccountRecord[],
  incoming: RegisteredMemberAccountRecord[]
): RegisteredMemberAccountRecord[] {
  const map = new Map(existing.map((entry) => [entry.email, entry]));

  for (const entry of incoming) {
    map.set(entry.email, entry);
  }

  return [...map.values()].sort((left, right) => right.signedUpAtMs - left.signedUpAtMs);
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
  registeredMemberAccounts?: unknown[];
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
    registeredMemberAccounts:
      input.registeredMemberAccounts === undefined
        ? current.registeredMemberAccounts
        : mergeRegisteredMemberAccounts(
            current.registeredMemberAccounts.flatMap((entry) => {
              const normalized = normalizeRegisteredMemberAccount(entry);
              return normalized ? [normalized] : [];
            }),
            input.registeredMemberAccounts.flatMap((entry) => {
              const normalized = normalizeRegisteredMemberAccount(entry);
              return normalized ? [normalized] : [];
            })
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

function sanitizeClientMemberAccountSync(
  incoming: RegisteredMemberAccountRecord,
  existing: RegisteredMemberAccountRecord | null,
  owner: string,
): RegisteredMemberAccountRecord {
  const submitterAddress = owner.trim().toLowerCase();

  if (existing?.submitterAddress && existing.submitterAddress !== submitterAddress) {
    throw new Error('member_registry_owner_mismatch');
  }

  if (existing) {
    return {
      ...existing,
      displayName: incoming.displayName,
      archetype: incoming.archetype,
      archetypeLabel: incoming.archetypeLabel,
      flavorBadgeId: incoming.flavorBadgeId,
      quizAnswers: incoming.quizAnswers,
      submitterAddress: existing.submitterAddress ?? submitterAddress,
      ...(incoming.avatarUrl ? { avatarUrl: incoming.avatarUrl } : {}),
    };
  }

  return {
    ...incoming,
    issuedPlayerScore: Math.min(
      Math.max(0, incoming.issuedPlayerScore),
      MAX_CLIENT_ISSUED_PLAYER_SCORE,
    ),
    issuedPlayerScoreTier:
      incoming.issuedPlayerScoreTier === 'premium' ? 'verified' : incoming.issuedPlayerScoreTier,
    submitterAddress,
  };
}

export async function syncRegisteredMemberAccount(
  account: unknown,
  owner: string,
): Promise<OfficialsSubmissionsProjection> {
  if (!owner.startsWith('0x')) {
    throw new Error('invalid_owner');
  }

  const normalized = normalizeRegisteredMemberAccount(account);

  if (!normalized) {
    throw new Error('invalid_member_account');
  }

  const projection = await getOfficialsSubmissions();
  const existing =
    projection.registeredMemberAccounts.find(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        (entry as RegisteredMemberAccountRecord).email === normalized.email,
    ) as RegisteredMemberAccountRecord | undefined;

  const sanitized = sanitizeClientMemberAccountSync(normalized, existing ?? null, owner);

  return syncOfficialsSubmissions({ registeredMemberAccounts: [sanitized] });
}