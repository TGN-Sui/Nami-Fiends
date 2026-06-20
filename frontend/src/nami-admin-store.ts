import { useSyncExternalStore } from 'react';

import {
  canBanMembers,
  canManageModerators,
  canReviewNodenameClaims,
  readOfficialModerators,
  resolveNamiAdminRole,
  writeOfficialModerators,
  type NamiAdminRole,
} from './nami-capabilities.js';
import {
  approveSubmittedTicket,
  enqueueSubmittedTicket,
  rejectSubmittedTicket,
} from './owner-submitted-tickets-store.js';
import { readOfficialOwner } from './protocol-env.js';

export type { NamiAdminRole };
const PENDING_CLAIMS_KEY = 'nami.admin.pendingClaims';
const BAN_LIST_KEY = 'nami.admin.banList';
const USER_CLAIM_STATUS_KEY = 'nami.user.claimStatus';

export type ClaimMethod = 'zklogin' | 'wallet' | 'demo';

export type PendingNodenameClaim = {
  id: string;
  email: string;
  displayName: string;
  nodename: string;
  archetype: number;
  archetypeLabel: string;
  flavorBadgeId: string;
  submitterAddress: string | null;
  method: ClaimMethod;
  status: 'pending' | 'approved' | 'rejected';
  submittedAtMs: number;
  reviewedAtMs?: number;
  reviewedBy?: string;
};

export type BannedMemberEntry = {
  id: string;
  targetKey: string;
  targetLabel: string;
  reason: string;
  bannedAtMs: number;
  bannedBy: string;
  kind: 'user' | 'moderator';
};

export type UserClaimStatus = {
  claimId: string | null;
  status: 'none' | 'pending' | 'approved' | 'rejected';
  nodename: string;
  updatedAtMs: number;
};

type NamiAdminStoreSnapshot = {
  pendingClaims: PendingNodenameClaim[];
  openPendingCount: number;
  banList: BannedMemberEntry[];
  moderators: string[];
  userClaimStatus: UserClaimStatus;
};

let cachedAdminSnapshot: NamiAdminStoreSnapshot | null = null;

const EMPTY_ADMIN_SNAPSHOT: NamiAdminStoreSnapshot = {
  pendingClaims: [],
  openPendingCount: 0,
  banList: [],
  moderators: [],
  userClaimStatus: {
    claimId: null,
    status: 'none',
    nodename: '',
    updatedAtMs: 0,
  },
};

function buildAdminSnapshot(): NamiAdminStoreSnapshot {
  return {
    pendingClaims: readPendingNodenameClaims(),
    openPendingCount: readOpenPendingClaims().length,
    banList: readBanList(),
    moderators: readOfficialModerators(),
    userClaimStatus: readUserClaimStatus(),
  };
}

function getAdminSnapshot(): NamiAdminStoreSnapshot {
  if (!cachedAdminSnapshot) {
    cachedAdminSnapshot = buildAdminSnapshot();
  }

  return cachedAdminSnapshot;
}

function invalidateAdminSnapshot(): void {
  cachedAdminSnapshot = null;
}

function dispatchAdminChange(): void {
  invalidateAdminSnapshot();
  window.dispatchEvent(new CustomEvent('nami-admin-changed'));
}

function readJsonArray<T>(key: string): T[] {
  try {
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(key: string, value: T[]): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function addOfficialModerator(address: string, actorOwner: string | null): boolean {
  if (!canManageModerators(actorOwner)) {
    return false;
  }

  const normalized = address.trim().toLowerCase();

  if (!normalized.startsWith('0x')) {
    return false;
  }

  const moderators = readOfficialModerators();

  if (moderators.some((entry) => entry.toLowerCase() === normalized)) {
    return false;
  }

  return writeOfficialModerators([...moderators, address.trim()], actorOwner);
}

export function removeOfficialModerator(address: string, actorOwner: string | null): boolean {
  if (!canManageModerators(actorOwner)) {
    return false;
  }

  const normalized = address.trim().toLowerCase();
  const moderators = readOfficialModerators().filter(
    (entry) => entry.toLowerCase() !== normalized
  );

  return writeOfficialModerators(moderators, actorOwner);
}

export { canBanMembers, canManageModerators, canReviewNodenameClaims as canReviewClaims, resolveNamiAdminRole };

export function readPendingNodenameClaims(): PendingNodenameClaim[] {
  return readJsonArray<PendingNodenameClaim>(PENDING_CLAIMS_KEY);
}

export function readOpenPendingClaims(): PendingNodenameClaim[] {
  return readPendingNodenameClaims().filter((claim) => claim.status === 'pending');
}

function savePendingClaims(claims: PendingNodenameClaim[]): void {
  const next = claims.slice(0, 200);
  writeJsonArray(PENDING_CLAIMS_KEY, next);
  dispatchAdminChange();
  void import('./officials-submissions-sync.js').then(({ syncNodenameClaimsToServer }) => {
    syncNodenameClaimsToServer(next);
  });
}

export function readUserClaimStatus(): UserClaimStatus {
  try {
    const stored = window.localStorage.getItem(USER_CLAIM_STATUS_KEY);

    if (!stored) {
      return {
        claimId: null,
        status: 'none',
        nodename: '',
        updatedAtMs: Date.now(),
      };
    }

    const parsed = JSON.parse(stored) as Partial<UserClaimStatus>;

    return {
      claimId: typeof parsed.claimId === 'string' ? parsed.claimId : null,
      status:
        parsed.status === 'pending' ||
        parsed.status === 'approved' ||
        parsed.status === 'rejected'
          ? parsed.status
          : 'none',
      nodename: typeof parsed.nodename === 'string' ? parsed.nodename : '',
      updatedAtMs: typeof parsed.updatedAtMs === 'number' ? parsed.updatedAtMs : Date.now(),
    };
  } catch {
    return {
      claimId: null,
      status: 'none',
      nodename: '',
      updatedAtMs: Date.now(),
    };
  }
}

function saveUserClaimStatus(status: UserClaimStatus): void {
  window.localStorage.setItem(USER_CLAIM_STATUS_KEY, JSON.stringify(status));
  dispatchAdminChange();
}

export function submitNodenameClaim(input: {
  email: string;
  displayName: string;
  nodename: string;
  archetype: number;
  archetypeLabel: string;
  flavorBadgeId: string;
  submitterAddress: string | null;
  method: ClaimMethod;
}): PendingNodenameClaim {
  const claim: PendingNodenameClaim = {
    id: 'claim-' + Date.now().toString(36),
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName.trim(),
    nodename: input.nodename.trim().toLowerCase(),
    archetype: input.archetype,
    archetypeLabel: input.archetypeLabel,
    flavorBadgeId: input.flavorBadgeId,
    submitterAddress: input.submitterAddress,
    method: input.method,
    status: 'pending',
    submittedAtMs: Date.now(),
  };

  const claims = readPendingNodenameClaims();
  savePendingClaims([claim, ...claims]);

  enqueueSubmittedTicket({
    id: claim.id,
    kind: 'nodename-claim',
    title: '@' + claim.nodename,
    description: claim.displayName + ' · ' + claim.email,
    channelId: null,
    coverUrl: null,
    duration: null,
    submitterLabel: claim.displayName,
    submitterDetail: claim.archetypeLabel + ' · ' + claim.method,
    referenceId: claim.id,
    submittedAtMs: claim.submittedAtMs,
  });

  saveUserClaimStatus({
    claimId: claim.id,
    status: 'pending',
    nodename: claim.nodename,
    updatedAtMs: Date.now(),
  });

  return claim;
}

export function approvePendingClaims(
  claimIds: string[],
  reviewerOwner: string | null
): number {
  if (!canReviewNodenameClaims(reviewerOwner) || claimIds.length === 0) {
    return 0;
  }

  const idSet = new Set(claimIds);
  const now = Date.now();
  let approvedCount = 0;

  const claims = readPendingNodenameClaims().map((claim) => {
    if (!idSet.has(claim.id) || claim.status !== 'pending') {
      return claim;
    }

    approvedCount += 1;

    return {
      ...claim,
      status: 'approved' as const,
      reviewedAtMs: now,
      reviewedBy: reviewerOwner ?? 'official-owner',
    };
  });

  savePendingClaims(claims);

  claimIds.forEach((claimId) => {
    if (idSet.has(claimId)) {
      approveSubmittedTicket(claimId, reviewerOwner);
    }
  });

  const userStatus = readUserClaimStatus();

  if (userStatus.claimId && idSet.has(userStatus.claimId)) {
    saveUserClaimStatus({
      ...userStatus,
      status: 'approved',
      updatedAtMs: now,
    });
  }

  return approvedCount;
}

export function approveAllPendingClaims(reviewerOwner: string | null): number {
  const pendingIds = readOpenPendingClaims().map((claim) => claim.id);

  return approvePendingClaims(pendingIds, reviewerOwner);
}

export function rejectPendingClaims(
  claimIds: string[],
  reviewerOwner: string | null
): number {
  if (!canReviewNodenameClaims(reviewerOwner) || claimIds.length === 0) {
    return 0;
  }

  const idSet = new Set(claimIds);
  const now = Date.now();
  let rejectedCount = 0;

  const claims = readPendingNodenameClaims().map((claim) => {
    if (!idSet.has(claim.id) || claim.status !== 'pending') {
      return claim;
    }

    rejectedCount += 1;

    return {
      ...claim,
      status: 'rejected' as const,
      reviewedAtMs: now,
      reviewedBy: reviewerOwner ?? 'official-owner',
    };
  });

  savePendingClaims(claims);

  claimIds.forEach((claimId) => {
    if (idSet.has(claimId)) {
      rejectSubmittedTicket(claimId, reviewerOwner);
    }
  });

  const userStatus = readUserClaimStatus();

  if (userStatus.claimId && idSet.has(userStatus.claimId)) {
    saveUserClaimStatus({
      ...userStatus,
      status: 'rejected',
      updatedAtMs: now,
    });
  }

  return rejectedCount;
}

export function rejectAllPendingClaims(reviewerOwner: string | null): number {
  const pendingIds = readOpenPendingClaims().map((claim) => claim.id);

  return rejectPendingClaims(pendingIds, reviewerOwner);
}

export function readBanList(): BannedMemberEntry[] {
  return readJsonArray<BannedMemberEntry>(BAN_LIST_KEY);
}

export function isTargetBanned(targetKey: string): boolean {
  const normalized = targetKey.trim().toLowerCase();

  return readBanList().some((entry) => entry.targetKey.toLowerCase() === normalized);
}

export function banMemberTarget(
  input: {
    targetKey: string;
    targetLabel: string;
    reason: string;
    kind: 'user' | 'moderator';
  },
  actorOwner: string | null
): boolean {
  if (!canBanMembers(actorOwner)) {
    return false;
  }

  const normalized = input.targetKey.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  const bans = readBanList().filter((entry) => entry.targetKey.toLowerCase() !== normalized);

  bans.unshift({
    id: 'ban-' + Date.now().toString(36),
    targetKey: input.targetKey.trim(),
    targetLabel: input.targetLabel.trim() || input.targetKey.trim(),
    reason: input.reason.trim() || 'Manual enforcement',
    bannedAtMs: Date.now(),
    bannedBy: actorOwner ?? 'official-owner',
    kind: input.kind,
  });

  writeJsonArray(BAN_LIST_KEY, bans);
  dispatchAdminChange();
  return true;
}

export function unbanMemberTarget(targetKey: string, actorOwner: string | null): boolean {
  if (!canBanMembers(actorOwner)) {
    return false;
  }

  const normalized = targetKey.trim().toLowerCase();
  const bans = readBanList().filter((entry) => entry.targetKey.toLowerCase() !== normalized);

  writeJsonArray(BAN_LIST_KEY, bans);
  dispatchAdminChange();
  return true;
}

function subscribeAdmin(onStoreChange: () => void): () => void {
  function handleChange(): void {
    invalidateAdminSnapshot();
    onStoreChange();
  }

  window.addEventListener('nami-admin-changed', handleChange);

  return () => {
    window.removeEventListener('nami-admin-changed', handleChange);
  };
}

export function useNamiAdminStore(): NamiAdminStoreSnapshot {
  return useSyncExternalStore(subscribeAdmin, getAdminSnapshot, () => EMPTY_ADMIN_SNAPSHOT);
}