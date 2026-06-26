import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import {
  readOfficialChatOverlayRewards,
  resetOfficialChatOverlayRewardsForTests,
  saveOfficialChatOverlayRewards,
  upsertOfficialChatOverlayReward,
} from './official-chat-overlay-rewards-store.js';

describe('official-chat-overlay-rewards-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetOfficialChatOverlayRewardsForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetOfficialChatOverlayRewardsForTests();
  });

  it('seeds default overlay rewards with fixed border styles', () => {
    const rewards = readOfficialChatOverlayRewards();

    expect(rewards.length).toBeGreaterThanOrEqual(4);
    expect(rewards.some((reward) => reward.motion === 'premium-loop')).toBe(true);
    expect(new Set(rewards.map((reward) => reward.borderStyle)).size).toBeGreaterThan(1);
  });

  it('falls back to default presets when an empty catalog is saved', () => {
    saveOfficialChatOverlayRewards([]);

    const rewards = readOfficialChatOverlayRewards();

    expect(rewards.length).toBe(4);
    expect(rewards.some((reward) => reward.id === 'overlay-signal-glow')).toBe(true);
  });

  it('upserts and persists official reward studio entries', () => {
    const saved = upsertOfficialChatOverlayReward({
      id: 'overlay-test-custom',
      name: 'Raid Winner Halo',
      description: 'Granted after official raid events.',
      borderStyle: 'pulse-ring',
      motion: 'static',
      accent: 'gold',
      condition: { type: 'official-grant', memberIds: ['m1'] },
      enabled: true,
      updatedAtMs: 1,
    });

    expect(saved.name).toBe('Raid Winner Halo');

    const reread = readOfficialChatOverlayRewards().find((reward) => reward.id === saved.id);

    expect(reread?.condition).toEqual({ type: 'official-grant', memberIds: ['m1'] });

    saveOfficialChatOverlayRewards(
      readOfficialChatOverlayRewards().map((reward) =>
        reward.id === saved.id ? { ...reward, enabled: false } : reward
      )
    );

    expect(
      readOfficialChatOverlayRewards().find((reward) => reward.id === saved.id)?.enabled
    ).toBe(false);
  });
});