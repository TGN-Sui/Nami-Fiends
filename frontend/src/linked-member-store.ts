import { useSyncExternalStore } from 'react';

import type { NamiLinkedProfile } from './nami-linked-profile-api.js';

const STORAGE_KEY = 'nami.linked-member.profile';

export type LinkedMemberSnapshot = {
  owner: string;
  linkedProfile: NamiLinkedProfile;
  hydratedAtMs: number;
};

let syncOwner: string | null = null;
let memorySnapshot: LinkedMemberSnapshot | null = null;

function normalizeOwner(owner: string): string {
  return owner.trim().toLowerCase();
}

function dispatchLinkedMemberChange(): void {
  window.dispatchEvent(new CustomEvent('nami-linked-member-changed'));
}

export function setLinkedMemberSyncOwner(owner: string | null): void {
  const normalized = owner?.startsWith('0x') ? normalizeOwner(owner) : null;

  if (syncOwner === normalized) {
    return;
  }

  syncOwner = normalized;

  if (!normalized || memorySnapshot?.owner !== normalized) {
    memorySnapshot = readStoredLinkedMemberSnapshot(normalized);
    dispatchLinkedMemberChange();
  }
}

function readStoredLinkedMemberSnapshot(
  expectedOwner: string | null = syncOwner
): LinkedMemberSnapshot | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<LinkedMemberSnapshot>;
    const owner = typeof parsed.owner === 'string' ? normalizeOwner(parsed.owner) : '';
    const linkedProfile = parsed.linkedProfile;

    if (!owner.startsWith('0x') || linkedProfile === null || typeof linkedProfile !== 'object') {
      return null;
    }

    if (expectedOwner && owner !== normalizeOwner(expectedOwner)) {
      return null;
    }

    return {
      owner,
      linkedProfile: linkedProfile as NamiLinkedProfile,
      hydratedAtMs: typeof parsed.hydratedAtMs === 'number' ? parsed.hydratedAtMs : Date.now(),
    };
  } catch {
    return null;
  }
}

function writeStoredLinkedMemberSnapshot(snapshot: LinkedMemberSnapshot | null): void {
  if (!snapshot) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function saveLinkedMemberSnapshot(snapshot: LinkedMemberSnapshot): void {
  const normalizedOwner = normalizeOwner(snapshot.owner);

  if (syncOwner && normalizedOwner !== syncOwner) {
    return;
  }

  memorySnapshot = {
    ...snapshot,
    owner: normalizedOwner,
  };

  writeStoredLinkedMemberSnapshot(memorySnapshot);
  dispatchLinkedMemberChange();
}

export function clearLinkedMemberSnapshot(): void {
  memorySnapshot = null;
  writeStoredLinkedMemberSnapshot(null);
  dispatchLinkedMemberChange();
}

export function readLinkedMemberSnapshot(): LinkedMemberSnapshot | null {
  if (memorySnapshot && (!syncOwner || memorySnapshot.owner === syncOwner)) {
    return memorySnapshot;
  }

  memorySnapshot = readStoredLinkedMemberSnapshot(syncOwner);
  return memorySnapshot;
}

export function readLinkedMemberProfile(): NamiLinkedProfile | null {
  return readLinkedMemberSnapshot()?.linkedProfile ?? null;
}

export function hasVerifiedLinkedPassport(): boolean {
  return readLinkedMemberProfile()?.proof.status === 'verified';
}

export function readLinkedMemberNodename(): string | null {
  const nodename = readLinkedMemberProfile()?.anchor.nodename?.trim();

  return nodename ? nodename : null;
}

export function readLinkedMemberDisplayName(): string | null {
  const profile = readLinkedMemberProfile();

  if (!profile) {
    return null;
  }

  const preferred = profile.offchain.preferredName?.trim();
  const display = profile.offchain.displayName?.trim();

  return preferred || display || profile.anchor.nodename?.trim() || null;
}

function subscribeLinkedMember(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();

  window.addEventListener('nami-linked-member-changed', handler);

  return () => {
    window.removeEventListener('nami-linked-member-changed', handler);
  };
}

export function useLinkedMemberProfile(): NamiLinkedProfile | null {
  return useSyncExternalStore(subscribeLinkedMember, readLinkedMemberProfile, () => null);
}

export function resetLinkedMemberStoreForTests(): void {
  syncOwner = null;
  memorySnapshot = null;
  window.localStorage.removeItem(STORAGE_KEY);
}