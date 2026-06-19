import { useSyncExternalStore } from 'react';

import { getBoostCycleId } from './boost-cycle.js';
import { isMemberVerified } from './member-access.js';
import { MEMBERSHIP_PLANS } from './membership-plans-store.js';
import { type NamiMember } from './uiMockData.js';

const BOOSTS_KEY = 'nami.channel-boosts';

export const MAX_BOOSTS_PER_CHANNEL_PER_CYCLE = 3;

export type ChannelBoostEntry = {
  id: string;
  memberId: string;
  channelId: string;
  weekId: number;
  power: number;
  tier: NamiMember['tier'];
  appliedAtMs: number;
};

export type BoostChannelResult =
  | { ok: true; entry: ChannelBoostEntry; remainingBoosts: number; channelBoostCount: number }
  | {
      ok: false;
      reason: 'npc-tier' | 'black-signal' | 'not-verified' | 'cycle-limit' | 'channel-limit';
    };

export type ChannelBoostEligibility =
  | 'eligible'
  | 'npc-tier'
  | 'black-signal'
  | 'not-verified'
  | 'cycle-limit'
  | 'channel-limit'
  | 'maxed-channel';

let cachedBoosts: ChannelBoostEntry[] | null = null;

function invalidateChannelBoostCache(): void {
  cachedBoosts = null;
}

function isValidBoostEntry(entry: unknown): entry is ChannelBoostEntry {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  const boost = entry as Partial<ChannelBoostEntry>;

  return (
    typeof boost.id === 'string' &&
    typeof boost.memberId === 'string' &&
    typeof boost.channelId === 'string' &&
    typeof boost.weekId === 'number' &&
    typeof boost.power === 'number' &&
    typeof boost.tier === 'string' &&
    typeof boost.appliedAtMs === 'number'
  );
}

/** Weekly discovery cycle id — resets Friday 12:00 PM Central (America/Chicago). */
export function currentBoostWeekId(date = new Date()): number {
  return getBoostCycleId(date);
}

export function boostPowerForTier(tier: NamiMember['tier']): number {
  if (tier === 'Adventurer') {
    return 1;
  }

  if (tier === 'Pro') {
    return 6;
  }

  if (tier === 'Elite') {
    return 8;
  }

  return 0;
}

export function boostCycleLimit(tier: NamiMember['tier']): number {
  if (tier === 'NPC') {
    return 0;
  }

  const plan = MEMBERSHIP_PLANS.find((entry) => entry.tier === tier);

  return plan?.boostCount ?? 0;
}

export function canMemberBoost(member: NamiMember): boolean {
  if (member.signal === 'Black') {
    return false;
  }

  if (!isMemberVerified(member)) {
    return false;
  }

  return boostCycleLimit(member.tier) > 0;
}

export function readChannelBoosts(): ChannelBoostEntry[] {
  if (cachedBoosts) {
    return cachedBoosts;
  }

  try {
    const stored = window.localStorage.getItem(BOOSTS_KEY);

    if (!stored) {
      cachedBoosts = [];
      return cachedBoosts;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      cachedBoosts = [];
      return cachedBoosts;
    }

    cachedBoosts = parsed.filter(isValidBoostEntry);
    return cachedBoosts;
  } catch {
    cachedBoosts = [];
    return cachedBoosts;
  }
}

export function saveChannelBoosts(entries: ChannelBoostEntry[]): void {
  window.localStorage.setItem(BOOSTS_KEY, JSON.stringify(entries));
  invalidateChannelBoostCache();
  window.dispatchEvent(new CustomEvent('nami-channel-boosts-changed'));
}

function entriesForMemberCycle(memberId: string, weekId = currentBoostWeekId()): ChannelBoostEntry[] {
  return readChannelBoosts().filter((entry) => entry.memberId === memberId && entry.weekId === weekId);
}

function entriesForMemberChannelCycle(
  memberId: string,
  channelId: string,
  weekId = currentBoostWeekId(),
): ChannelBoostEntry[] {
  return entriesForMemberCycle(memberId, weekId).filter((entry) => entry.channelId === channelId);
}

export function getRemainingBoosts(member: NamiMember, weekId = currentBoostWeekId()): number {
  const limit = boostCycleLimit(member.tier);

  if (limit === 0) {
    return 0;
  }

  return Math.max(0, limit - entriesForMemberCycle(member.id, weekId).length);
}

export function getMemberChannelBoostCount(
  memberId: string,
  channelId: string,
  weekId = currentBoostWeekId(),
): number {
  return entriesForMemberChannelCycle(memberId, channelId, weekId).length;
}

export function getChannelBoostPower(channelId: string, weekId = currentBoostWeekId()): number {
  return readChannelBoosts()
    .filter((entry) => entry.channelId === channelId && entry.weekId === weekId)
    .reduce((sum, entry) => sum + entry.power, 0);
}

export function getChannelBoostEligibility(
  member: NamiMember,
  channelId: string,
  weekId = currentBoostWeekId(),
): ChannelBoostEligibility {
  if (member.signal === 'Black') {
    return 'black-signal';
  }

  if (member.tier === 'NPC') {
    return 'npc-tier';
  }

  if (!isMemberVerified(member)) {
    return 'not-verified';
  }

  if (getRemainingBoosts(member, weekId) === 0) {
    return 'cycle-limit';
  }

  const channelBoostCount = getMemberChannelBoostCount(member.id, channelId, weekId);

  if (channelBoostCount >= MAX_BOOSTS_PER_CHANNEL_PER_CYCLE) {
    return channelBoostCount > 0 ? 'maxed-channel' : 'channel-limit';
  }

  return 'eligible';
}

export function boostChannel(
  channelId: string,
  member: NamiMember,
  weekId = currentBoostWeekId(),
  appliedAtMs = Date.now(),
): BoostChannelResult {
  const eligibility = getChannelBoostEligibility(member, channelId, weekId);

  if (eligibility === 'black-signal') {
    return { ok: false, reason: 'black-signal' };
  }

  if (eligibility === 'npc-tier') {
    return { ok: false, reason: 'npc-tier' };
  }

  if (eligibility === 'not-verified') {
    return { ok: false, reason: 'not-verified' };
  }

  if (eligibility === 'cycle-limit') {
    return { ok: false, reason: 'cycle-limit' };
  }

  if (eligibility === 'channel-limit' || eligibility === 'maxed-channel') {
    return { ok: false, reason: 'channel-limit' };
  }

  const entry: ChannelBoostEntry = {
    id: 'boost-' + channelId + '-' + member.id + '-' + appliedAtMs.toString(36),
    memberId: member.id,
    channelId,
    weekId,
    power: boostPowerForTier(member.tier),
    tier: member.tier,
    appliedAtMs,
  };

  saveChannelBoosts([entry, ...readChannelBoosts()]);

  const channelBoostCount = getMemberChannelBoostCount(member.id, channelId, weekId);

  return {
    ok: true,
    entry,
    remainingBoosts: getRemainingBoosts(member, weekId),
    channelBoostCount,
  };
}

export type MemberBoostedChannelSummary = {
  channelId: string;
  boostsApplied: number;
  totalPower: number;
  lastBoostedLabel: string;
};

export function getMemberBoostedChannels(
  memberId: string,
  weekId = currentBoostWeekId(),
): MemberBoostedChannelSummary[] {
  const grouped = new Map<string, ChannelBoostEntry[]>();

  for (const entry of entriesForMemberCycle(memberId, weekId)) {
    const current = grouped.get(entry.channelId) ?? [];
    current.push(entry);
    grouped.set(entry.channelId, current);
  }

  return [...grouped.entries()]
    .map(([channelId, entries]) => {
      const latest = entries.reduce((max, entry) => (entry.appliedAtMs > max ? entry.appliedAtMs : max), 0);

      return {
        channelId,
        boostsApplied: entries.length,
        totalPower: entries.reduce((sum, entry) => sum + entry.power, 0),
        lastBoostedLabel: latest > 0 ? 'Boosted this week' : 'Boosted this cycle',
      };
    })
    .sort((left, right) => right.totalPower - left.totalPower || right.boostsApplied - left.boostsApplied);
}

function subscribeToStore(listener: () => void): () => void {
  function onChange(): void {
    invalidateChannelBoostCache();
    listener();
  }

  window.addEventListener('nami-channel-boosts-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-channel-boosts-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useChannelBoostStore(): ChannelBoostEntry[] {
  return useSyncExternalStore(subscribeToStore, readChannelBoosts, readChannelBoosts);
}