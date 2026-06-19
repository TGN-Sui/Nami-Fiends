import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSelfMember } from './member-access.js';
import { members } from './uiMockData.js';

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

import { zonedLocalTimeToUtcMs, BOOST_RESET_TIME_ZONE } from './boost-cycle.js';
import {
  boostChannel,
  boostCycleLimit,
  boostPowerForTier,
  currentBoostWeekId,
  getChannelBoostEligibility,
  getChannelBoostPower,
  getMemberBoostedChannels,
  getMemberChannelBoostCount,
  getRemainingBoosts,
  MAX_BOOSTS_PER_CHANNEL_PER_CYCLE,
  readChannelBoosts,
} from './channel-boost-store.js';

describe('channel-boost-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps tier boost power and cycle limits from membership rules', () => {
    expect(boostPowerForTier('Adventurer')).toBe(1);
    expect(boostPowerForTier('Pro')).toBe(6);
    expect(boostPowerForTier('Elite')).toBe(8);
    expect(boostCycleLimit('Adventurer')).toBe(1);
    expect(boostCycleLimit('Pro')).toBe(6);
    expect(boostCycleLimit('Elite')).toBe(8);
    expect(boostCycleLimit('NPC')).toBe(0);
  });

  it('returns a stable cached snapshot for useSyncExternalStore', () => {
    const firstRead = readChannelBoosts();
    const secondRead = readChannelBoosts();

    expect(secondRead).toBe(firstRead);
  });

  it('allows verified members to boost a channel and aggregate power', () => {
    const selfMember = getSelfMember();
    const now = new Date(zonedLocalTimeToUtcMs(2026, 6, 19, 15, 0, 0, BOOST_RESET_TIME_ZONE));
    const weekId = currentBoostWeekId(now);

    const result = boostChannel('fiends', selfMember, weekId, now.getTime());

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.entry.power).toBe(boostPowerForTier(selfMember.tier));
    expect(getMemberChannelBoostCount(selfMember.id, 'fiends', weekId)).toBe(1);
    expect(getChannelBoostPower('fiends', weekId)).toBe(result.entry.power);
    expect(getMemberBoostedChannels(selfMember.id, weekId)).toHaveLength(1);
  });

  it('blocks npc, black, and exhausted cycle budgets', () => {
    const now = new Date(zonedLocalTimeToUtcMs(2026, 6, 19, 15, 0, 0, BOOST_RESET_TIME_ZONE));
    const weekId = currentBoostWeekId(now);
    const npcMember = members.find((member) => member.tier === 'NPC') ?? members[0]!;
    const blackMember = members.find((member) => member.signal === 'Black') ?? members[0]!;

    expect(boostChannel('fiends', npcMember, weekId).ok).toBe(false);
    expect(boostChannel('fiends', blackMember, weekId).ok).toBe(false);

    const adventurer = { ...members[0]!, id: 'boost-test-adventurer', tier: 'Adventurer' as const, signal: 'Green' as const };

    expect(boostChannel('fiends', adventurer, weekId).ok).toBe(true);
    expect(getRemainingBoosts(adventurer, weekId)).toBe(0);
    expect(boostChannel('fiends', adventurer, weekId).ok).toBe(false);
    expect(getChannelBoostEligibility(adventurer, 'fiends', weekId)).toBe('cycle-limit');
  });

  it('resets boost budgets after the Friday noon Central weekly boundary', () => {
    const adventurer = { ...members[0]!, id: 'boost-cycle-reset', tier: 'Adventurer' as const, signal: 'Green' as const };
    const beforeReset = new Date(zonedLocalTimeToUtcMs(2026, 6, 19, 11, 0, 0, BOOST_RESET_TIME_ZONE));
    const afterReset = new Date(zonedLocalTimeToUtcMs(2026, 6, 19, 13, 0, 0, BOOST_RESET_TIME_ZONE));
    const weekBefore = currentBoostWeekId(beforeReset);
    const weekAfter = currentBoostWeekId(afterReset);

    expect(weekBefore).not.toBe(weekAfter);
    expect(boostChannel('fiends', adventurer, weekBefore, beforeReset.getTime()).ok).toBe(true);
    expect(getRemainingBoosts(adventurer, weekBefore)).toBe(0);
    expect(getRemainingBoosts(adventurer, weekAfter)).toBe(1);
  });

  it('enforces per-channel boost limits within a cycle', () => {
    const now = new Date(zonedLocalTimeToUtcMs(2026, 6, 19, 15, 0, 0, BOOST_RESET_TIME_ZONE));
    const weekId = currentBoostWeekId(now);
    const proMember = { ...members[0]!, id: 'boost-test-pro', tier: 'Pro' as const, signal: 'Green' as const };

    for (let index = 0; index < MAX_BOOSTS_PER_CHANNEL_PER_CYCLE; index += 1) {
      const result = boostChannel('fiends', proMember, weekId, now.getTime() + index);

      expect(result.ok).toBe(true);
    }

    expect(getMemberChannelBoostCount(proMember.id, 'fiends', weekId)).toBe(MAX_BOOSTS_PER_CHANNEL_PER_CYCLE);
    expect(getChannelBoostEligibility(proMember, 'fiends', weekId)).toBe('maxed-channel');
    expect(boostChannel('fiends', proMember, weekId).ok).toBe(false);
  });
});