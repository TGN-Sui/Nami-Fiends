import { useSyncExternalStore } from 'react';

import { channels } from './uiMockData.js';

const BADGES_KEY = 'nami.channel-game-badges';

let cachedBadgeGrants: MemberChannelBadgeGrant[] | null = null;

function invalidateChannelGameBadgeCache(): void {
  cachedBadgeGrants = null;
}

export type MemberChannelBadgeGrant = {
  memberId: string;
  channelId: string;
  badgeLabel: string;
};

const defaultBadgeGrants: MemberChannelBadgeGrant[] = [
  { memberId: 'm1', channelId: 'fiends', badgeLabel: 'Founder Room' },
  { memberId: 'm6', channelId: 'fiends', badgeLabel: 'Guild Ally' },
  { memberId: 'm8', channelId: 'fiends', badgeLabel: 'Event Regular' },
  { memberId: 'm10', channelId: 'fiends', badgeLabel: 'Founder Room' },
  { memberId: 'm12', channelId: 'fiends', badgeLabel: 'Guild Ally' },
  { memberId: 'm1', channelId: 'xociety', badgeLabel: 'Extraction Lead' },
  { memberId: 'm8', channelId: 'xociety', badgeLabel: 'POP Squad' },
  { memberId: 'm1', channelId: 'panzerdogs', badgeLabel: 'Tank Captain' },
];

function isValidGrant(entry: unknown): entry is MemberChannelBadgeGrant {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  const grant = entry as Partial<MemberChannelBadgeGrant>;

  return (
    typeof grant.memberId === 'string' &&
    typeof grant.channelId === 'string' &&
    typeof grant.badgeLabel === 'string' &&
    grant.badgeLabel.trim().length > 0
  );
}

function channelBadgeCatalog(channelId: string): string[] {
  const channel = channels.find((entry) => entry.id === channelId);

  if (!channel) {
    return [];
  }

  return [...channel.officialBadges, ...channel.customBadges];
}

export function readMemberChannelBadgeGrants(): MemberChannelBadgeGrant[] {
  if (cachedBadgeGrants) {
    return cachedBadgeGrants;
  }

  try {
    const stored = window.localStorage.getItem(BADGES_KEY);

    if (!stored) {
      cachedBadgeGrants = [...defaultBadgeGrants];
      return cachedBadgeGrants;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      cachedBadgeGrants = [...defaultBadgeGrants];
      return cachedBadgeGrants;
    }

    cachedBadgeGrants = parsed.filter(isValidGrant);
    return cachedBadgeGrants;
  } catch {
    cachedBadgeGrants = [...defaultBadgeGrants];
    return cachedBadgeGrants;
  }
}

export function saveMemberChannelBadgeGrants(grants: MemberChannelBadgeGrant[]): void {
  window.localStorage.setItem(BADGES_KEY, JSON.stringify(grants));
  invalidateChannelGameBadgeCache();
  window.dispatchEvent(new CustomEvent('nami-channel-game-badges-changed'));
}

export function hasChannelGameBadge(memberId: string, channelId: string): boolean {
  return readMemberChannelBadgeGrants().some(
    (grant) => grant.memberId === memberId && grant.channelId === channelId,
  );
}

export function readMemberChannelBadgeLabel(memberId: string, channelId: string): string | null {
  const grant = readMemberChannelBadgeGrants().find(
    (entry) => entry.memberId === memberId && entry.channelId === channelId,
  );

  return grant?.badgeLabel ?? null;
}

export function grantChannelGameBadge(
  memberId: string,
  channelId: string,
  badgeLabel: string,
): { ok: true } | { ok: false; reason: 'invalid-badge' | 'already-owned' } {
  const normalizedLabel = badgeLabel.trim();

  if (!normalizedLabel || !channelBadgeCatalog(channelId).includes(normalizedLabel)) {
    return { ok: false, reason: 'invalid-badge' };
  }

  const grants = readMemberChannelBadgeGrants();

  if (grants.some((grant) => grant.memberId === memberId && grant.channelId === channelId)) {
    return { ok: false, reason: 'already-owned' };
  }

  saveMemberChannelBadgeGrants([...grants, { memberId, channelId, badgeLabel: normalizedLabel }]);
  return { ok: true };
}

function subscribeToStore(listener: () => void): () => void {
  function onChange(): void {
    invalidateChannelGameBadgeCache();
    listener();
  }

  window.addEventListener('nami-channel-game-badges-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-channel-game-badges-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useChannelGameBadgesStore(): MemberChannelBadgeGrant[] {
  return useSyncExternalStore(subscribeToStore, readMemberChannelBadgeGrants, readMemberChannelBadgeGrants);
}