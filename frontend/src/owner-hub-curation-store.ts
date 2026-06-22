import { useSyncExternalStore } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';

const STORAGE_KEY = 'nami.owner.hubCuration';

export const COMMUNITY_GROWTH_DISPLAY_LIMIT = 14;
export const MEMBER_SPOTLIGHT_DISPLAY_LIMIT = 18;

export type OwnerHubCurationState = {
  communityGrowthChannelIds: string[];
  memberSpotlightMemberIds: string[];
  updatedAtMs: number;
};

const EMPTY_STATE: OwnerHubCurationState = {
  communityGrowthChannelIds: [],
  memberSpotlightMemberIds: [],
  updatedAtMs: 0,
};

let cachedState: OwnerHubCurationState | null = null;

function normalizeState(value: Partial<OwnerHubCurationState> | null): OwnerHubCurationState {
  if (!value) {
    return { ...EMPTY_STATE };
  }

  return {
    communityGrowthChannelIds: Array.isArray(value.communityGrowthChannelIds)
      ? value.communityGrowthChannelIds.filter((entry): entry is string => typeof entry === 'string')
      : [],
    memberSpotlightMemberIds: Array.isArray(value.memberSpotlightMemberIds)
      ? value.memberSpotlightMemberIds.filter((entry): entry is string => typeof entry === 'string')
      : [],
    updatedAtMs: typeof value.updatedAtMs === 'number' ? value.updatedAtMs : Date.now(),
  };
}

function dispatchChange(): void {
  cachedState = null;
  window.dispatchEvent(new CustomEvent('nami-owner-hub-curation-changed'));
}

function writeState(state: OwnerHubCurationState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  cachedState = state;
  dispatchChange();
}

export function readOwnerHubCuration(): OwnerHubCurationState {
  if (cachedState) {
    return cachedState;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      cachedState = normalizeState(null);
      return cachedState;
    }

    cachedState = normalizeState(JSON.parse(stored) as Partial<OwnerHubCurationState>);
    return cachedState;
  } catch {
    cachedState = normalizeState(null);
    return cachedState;
  }
}

function canCurate(actorOwner: string | null): boolean {
  return isOfficialOwner(actorOwner);
}

function moveId(ids: string[], id: string, direction: 'up' | 'down'): string[] {
  const index = ids.indexOf(id);

  if (index < 0) {
    return ids;
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= ids.length) {
    return ids;
  }

  const next = [...ids];
  const current = next[index]!;
  next[index] = next[targetIndex]!;
  next[targetIndex] = current;

  return next;
}

function saveCuratedIds(
  actorOwner: string | null,
  patch: Partial<Pick<OwnerHubCurationState, 'communityGrowthChannelIds' | 'memberSpotlightMemberIds'>>
): OwnerHubCurationState | null {
  if (!canCurate(actorOwner)) {
    return null;
  }

  const current = readOwnerHubCuration();
  const next = normalizeState({
    ...current,
    ...patch,
    updatedAtMs: Date.now(),
  });

  writeState(next);
  return next;
}

export function addCommunityGrowthChannel(
  channelId: string,
  actorOwner: string | null
): OwnerHubCurationState | null {
  const normalizedId = channelId.trim();

  if (!normalizedId) {
    return null;
  }

  const current = readOwnerHubCuration();

  if (current.communityGrowthChannelIds.includes(normalizedId)) {
    return current;
  }

  if (current.communityGrowthChannelIds.length >= COMMUNITY_GROWTH_DISPLAY_LIMIT) {
    return null;
  }

  return saveCuratedIds(actorOwner, {
    communityGrowthChannelIds: [...current.communityGrowthChannelIds, normalizedId],
  });
}

export function removeCommunityGrowthChannel(
  channelId: string,
  actorOwner: string | null
): OwnerHubCurationState | null {
  const current = readOwnerHubCuration();

  return saveCuratedIds(actorOwner, {
    communityGrowthChannelIds: current.communityGrowthChannelIds.filter((entry) => entry !== channelId),
  });
}

export function moveCommunityGrowthChannel(
  channelId: string,
  direction: 'up' | 'down',
  actorOwner: string | null
): OwnerHubCurationState | null {
  const current = readOwnerHubCuration();

  return saveCuratedIds(actorOwner, {
    communityGrowthChannelIds: moveId(current.communityGrowthChannelIds, channelId, direction),
  });
}

export function resetCommunityGrowthCuration(actorOwner: string | null): OwnerHubCurationState | null {
  return saveCuratedIds(actorOwner, { communityGrowthChannelIds: [] });
}

export function addMemberSpotlightMember(
  memberId: string,
  actorOwner: string | null
): OwnerHubCurationState | null {
  const normalizedId = memberId.trim();

  if (!normalizedId) {
    return null;
  }

  const current = readOwnerHubCuration();

  if (current.memberSpotlightMemberIds.includes(normalizedId)) {
    return current;
  }

  if (current.memberSpotlightMemberIds.length >= MEMBER_SPOTLIGHT_DISPLAY_LIMIT) {
    return null;
  }

  return saveCuratedIds(actorOwner, {
    memberSpotlightMemberIds: [...current.memberSpotlightMemberIds, normalizedId],
  });
}

export function removeMemberSpotlightMember(
  memberId: string,
  actorOwner: string | null
): OwnerHubCurationState | null {
  const current = readOwnerHubCuration();

  return saveCuratedIds(actorOwner, {
    memberSpotlightMemberIds: current.memberSpotlightMemberIds.filter((entry) => entry !== memberId),
  });
}

export function moveMemberSpotlightMember(
  memberId: string,
  direction: 'up' | 'down',
  actorOwner: string | null
): OwnerHubCurationState | null {
  const current = readOwnerHubCuration();

  return saveCuratedIds(actorOwner, {
    memberSpotlightMemberIds: moveId(current.memberSpotlightMemberIds, memberId, direction),
  });
}

export function resetMemberSpotlightCuration(actorOwner: string | null): OwnerHubCurationState | null {
  return saveCuratedIds(actorOwner, { memberSpotlightMemberIds: [] });
}

function subscribe(listener: () => void): () => void {
  function onChange(): void {
    cachedState = null;
    listener();
  }

  window.addEventListener('nami-owner-hub-curation-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-owner-hub-curation-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useOwnerHubCuration(): OwnerHubCurationState {
  return useSyncExternalStore(subscribe, readOwnerHubCuration, readOwnerHubCuration);
}

export function resetOwnerHubCurationForTests(): void {
  cachedState = null;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}