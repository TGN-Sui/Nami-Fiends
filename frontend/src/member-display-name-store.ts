import { useSyncExternalStore } from 'react';

import { getSelfMember, isMemberVerified } from './member-access.js';
import {
  readSelfProfileEdits,
  saveSelfProfileEdits,
} from './member-profile-store.js';
import { readMemberSession } from './member-session-store.js';
import { members, type NamiMember } from './uiMockData.js';

const HISTORY_KEY = 'nami.member.display-name-history';
const SELF_MEMBER_ID = 'm1';
const DAY_MS = 24 * 60 * 60 * 1000;

export const DISPLAY_NAME_CHANGE_COOLDOWN_MS = 30 * DAY_MS;

export type DisplayNameHistoryEntry = {
  name: string;
  changedAtMs: number;
};

export type DisplayNameAvailability = {
  available: boolean;
  reason: string | null;
};

export type DisplayNameChangeEligibility = {
  allowed: boolean;
  reason: string | null;
  cooldownEndsAtMs: number | null;
  daysRemaining: number | null;
};

const historySnapshotCache = new Map<string, DisplayNameHistoryEntry[]>();
const eligibilitySnapshotCache = new Map<string, DisplayNameChangeEligibility>();

function normalizeDisplayName(value: string): string {
  return value.trim().toLowerCase();
}

function clearHistorySnapshotCache(): void {
  historySnapshotCache.clear();
}

function clearEligibilitySnapshotCache(): void {
  eligibilitySnapshotCache.clear();
}

function clearDisplayNameStoreSnapshotCaches(): void {
  clearHistorySnapshotCache();
  clearEligibilitySnapshotCache();
}

function dispatchHistoryChange(): void {
  clearDisplayNameStoreSnapshotCaches();
  window.dispatchEvent(new CustomEvent('nami-member-display-name-history-changed'));
}

function eligibilitySnapshotCacheKey(memberId: string, member: NamiMember): string {
  return memberId + '\0' + member.tier + '\0' + member.signal;
}

function getDisplayNameChangeEligibilitySnapshot(
  memberId: string,
  member: NamiMember
): DisplayNameChangeEligibility {
  const cacheKey = eligibilitySnapshotCacheKey(memberId, member);
  const cachedSnapshot = eligibilitySnapshotCache.get(cacheKey);

  if (cachedSnapshot) {
    return cachedSnapshot;
  }

  const snapshot = readDisplayNameChangeEligibility(memberId, member);
  eligibilitySnapshotCache.set(cacheKey, snapshot);

  return snapshot;
}

function getMemberDisplayNameHistorySnapshot(
  memberId: string,
  fallbackName: string
): DisplayNameHistoryEntry[] {
  const cacheKey = memberId + '\0' + fallbackName;
  const cachedSnapshot = historySnapshotCache.get(cacheKey);

  if (cachedSnapshot) {
    return cachedSnapshot;
  }

  const snapshot = readMemberDisplayNameHistory(memberId, fallbackName);
  historySnapshotCache.set(cacheKey, snapshot);

  return snapshot;
}

function readHistoryMap(): Record<string, DisplayNameHistoryEntry[]> {
  try {
    const stored = window.localStorage.getItem(HISTORY_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, DisplayNameHistoryEntry[]>;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

function writeHistoryMap(map: Record<string, DisplayNameHistoryEntry[]>): void {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(map));
  dispatchHistoryChange();
}

function hashMemberSeed(memberId: string): number {
  return memberId.split('').reduce((total, character) => total + character.charCodeAt(0), 0);
}

function seededDisplayNameHistory(memberId: string, currentName: string): DisplayNameHistoryEntry[] {
  const seed = hashMemberSeed(memberId);
  const firstName = currentName.split(/\s+/)[0] || currentName;
  const candidates = [
    currentName,
    firstName + String(seed % 90 + 10),
    firstName + '_v' + String((seed % 3) + 1),
    'Player' + String(seed % 700 + 100),
  ];

  const uniqueNames = candidates.filter(
    (name, index) => candidates.findIndex((entry) => normalizeDisplayName(entry) === normalizeDisplayName(name)) === index
  );

  const now = Date.now();

  return uniqueNames.map((name, index) => ({
    name,
    changedAtMs: now - index * 45 * 24 * 60 * 60 * 1000,
  }));
}

export function resolveMemberDisplayName(memberId: string, fallbackName: string): string {
  if (memberId === SELF_MEMBER_ID) {
    const edits = readSelfProfileEdits();
    const session = readMemberSession();

    return edits.displayName.trim() || session?.displayName.trim() || fallbackName;
  }

  return fallbackName;
}

function readRegisteredDisplayNames(excludeMemberId: string): Set<string> {
  const taken = new Set<string>();

  for (const member of members) {
    if (member.id === excludeMemberId) {
      continue;
    }

    const resolvedName = resolveMemberDisplayName(member.id, member.name);
    taken.add(normalizeDisplayName(resolvedName));
  }

  try {
    const stored = window.localStorage.getItem('nami.member.accounts');

    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, { displayName?: string; email?: string }>;
      const selfEmail = readMemberSession()?.email?.trim().toLowerCase();

      for (const [email, snapshot] of Object.entries(parsed)) {
        if (excludeMemberId === SELF_MEMBER_ID && selfEmail && email.trim().toLowerCase() === selfEmail) {
          continue;
        }

        if (typeof snapshot.displayName === 'string' && snapshot.displayName.trim()) {
          taken.add(normalizeDisplayName(snapshot.displayName));
        }
      }
    }
  } catch {
    // Ignore registry read failures.
  }

  return taken;
}

export function checkDisplayNameAvailability(
  candidate: string,
  memberId: string = SELF_MEMBER_ID
): DisplayNameAvailability {
  const trimmed = candidate.trim();

  if (trimmed.length < 2) {
    return { available: false, reason: 'Display name must be at least 2 characters.' };
  }

  if (trimmed.length > 32) {
    return { available: false, reason: 'Display name must be 32 characters or fewer.' };
  }

  const normalizedCandidate = normalizeDisplayName(trimmed);
  const currentName = resolveMemberDisplayName(
    memberId,
    members.find((member) => member.id === memberId)?.name ?? ''
  );

  if (normalizeDisplayName(currentName) === normalizedCandidate) {
    return { available: true, reason: null };
  }

  const taken = readRegisteredDisplayNames(memberId);

  if (taken.has(normalizedCandidate)) {
    return { available: false, reason: 'That display name is already in use.' };
  }

  return { available: true, reason: null };
}

function ensureCurrentNameInHistory(
  memberId: string,
  currentName: string,
  entries: DisplayNameHistoryEntry[]
): DisplayNameHistoryEntry[] {
  const normalizedCurrent = normalizeDisplayName(currentName);

  if (entries.some((entry) => normalizeDisplayName(entry.name) === normalizedCurrent)) {
    return entries;
  }

  return [{ name: currentName, changedAtMs: Date.now() }, ...entries];
}

export function readMemberDisplayNameHistory(memberId: string, fallbackName: string): DisplayNameHistoryEntry[] {
  const currentName = resolveMemberDisplayName(memberId, fallbackName);
  const stored = readHistoryMap()[memberId];

  if (stored && stored.length > 0) {
    return ensureCurrentNameInHistory(memberId, currentName, stored).sort(
      (left, right) => right.changedAtMs - left.changedAtMs
    );
  }

  return seededDisplayNameHistory(memberId, currentName).sort(
    (left, right) => right.changedAtMs - left.changedAtMs
  );
}

function readLastStoredDisplayNameChangeAtMs(memberId: string): number | null {
  const stored = readHistoryMap()[memberId];

  if (!stored || stored.length === 0) {
    return null;
  }

  return stored[0]?.changedAtMs ?? null;
}

function formatCooldownDate(timestampMs: number): string {
  return new Date(timestampMs).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function readDisplayNameChangeEligibility(
  memberId: string,
  member: NamiMember
): DisplayNameChangeEligibility {
  if (memberId !== SELF_MEMBER_ID) {
    return {
      allowed: false,
      reason: 'Only your own display name can be edited.',
      cooldownEndsAtMs: null,
      daysRemaining: null,
    };
  }

  if (!isMemberVerified(member)) {
    return {
      allowed: false,
      reason:
        'Display name changes are a verified-member privilege. Verify your passport to unlock this cosmetic.',
      cooldownEndsAtMs: null,
      daysRemaining: null,
    };
  }

  const lastChangedAtMs = readLastStoredDisplayNameChangeAtMs(memberId);

  if (lastChangedAtMs === null) {
    return {
      allowed: true,
      reason: null,
      cooldownEndsAtMs: null,
      daysRemaining: null,
    };
  }

  const cooldownEndsAtMs = lastChangedAtMs + DISPLAY_NAME_CHANGE_COOLDOWN_MS;
  const remainingMs = cooldownEndsAtMs - Date.now();

  if (remainingMs > 0) {
    const daysRemaining = Math.max(1, Math.ceil(remainingMs / DAY_MS));

    return {
      allowed: false,
      reason:
        'Qualified members can change their passport display name once every 30 days. Next change unlocks on ' +
        formatCooldownDate(cooldownEndsAtMs) +
        ' (' +
        daysRemaining +
        ' day' +
        (daysRemaining === 1 ? '' : 's') +
        ' remaining).',
      cooldownEndsAtMs,
      daysRemaining,
    };
  }

  return {
    allowed: true,
    reason: null,
    cooldownEndsAtMs: null,
    daysRemaining: null,
  };
}

function appendDisplayNameHistory(memberId: string, name: string): void {
  const map = readHistoryMap();
  const current = map[memberId] ?? [];
  const normalizedName = normalizeDisplayName(name);
  const filtered = current.filter((entry) => normalizeDisplayName(entry.name) !== normalizedName);

  map[memberId] = [{ name: name.trim(), changedAtMs: Date.now() }, ...filtered].slice(0, 12);
  writeHistoryMap(map);
}

export function saveMemberDisplayName(
  nextName: string,
  memberId: string = SELF_MEMBER_ID
): { ok: boolean; message: string } {
  if (memberId !== SELF_MEMBER_ID) {
    return { ok: false, message: 'Only your own display name can be edited.' };
  }

  const member = getSelfMember();
  const trimmedCandidate = nextName.trim();
  const currentName = resolveMemberDisplayName(memberId, member.name);
  const isUnchanged = normalizeDisplayName(currentName) === normalizeDisplayName(trimmedCandidate);
  const eligibility = readDisplayNameChangeEligibility(memberId, member);

  if (!isUnchanged && !eligibility.allowed) {
    return { ok: false, message: eligibility.reason ?? 'Display name change is not available right now.' };
  }

  const availability = checkDisplayNameAvailability(nextName, memberId);

  if (!availability.available) {
    return { ok: false, message: availability.reason ?? 'Display name is not available.' };
  }

  const trimmed = trimmedCandidate;

  if (isUnchanged) {
    return { ok: true, message: 'Display name unchanged.' };
  }

  const edits = readSelfProfileEdits();
  saveSelfProfileEdits({ ...edits, displayName: trimmed });

  appendDisplayNameHistory(memberId, trimmed);

  return { ok: true, message: 'Display name updated on your Nami Passport.' };
}

function subscribeHistory(listener: () => void): () => void {
  function onChange(): void {
    clearDisplayNameStoreSnapshotCaches();
    listener();
  }

  window.addEventListener('nami-member-display-name-history-changed', onChange);
  window.addEventListener('nami-self-profile-changed', onChange);
  window.addEventListener('nami-member-session-changed', onChange);

  return () => {
    window.removeEventListener('nami-member-display-name-history-changed', onChange);
    window.removeEventListener('nami-self-profile-changed', onChange);
    window.removeEventListener('nami-member-session-changed', onChange);
  };
}

export function useMemberDisplayNameHistory(
  memberId: string,
  fallbackName: string
): DisplayNameHistoryEntry[] {
  return useSyncExternalStore(
    subscribeHistory,
    () => getMemberDisplayNameHistorySnapshot(memberId, fallbackName),
    () => getMemberDisplayNameHistorySnapshot(memberId, fallbackName)
  );
}

export function useDisplayNameChangeEligibility(
  memberId: string,
  member: NamiMember
): DisplayNameChangeEligibility {
  return useSyncExternalStore(
    subscribeHistory,
    () => getDisplayNameChangeEligibilitySnapshot(memberId, member),
    () => getDisplayNameChangeEligibilitySnapshot(memberId, member)
  );
}

export function resetMemberDisplayNameStoreForTests(): void {
  clearDisplayNameStoreSnapshotCaches();

  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}