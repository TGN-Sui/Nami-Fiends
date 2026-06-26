import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('./member-access.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./member-access.js')>();

  return {
    ...actual,
    isMemberVerified: (member: (typeof members)[number]) =>
      member.signal === 'Green' && member.tier !== 'NPC',
  };
});

import {
  resetMemberCosmeticEquipsForTests,
  setLocalEquippedChatOverlay,
} from './member-cosmetic-equips-store.js';
import {
  overlayRewardUnlockedForMember,
  resolveChatOverlayForMember,
  unlockedChatOverlayRewardsForMember,
} from './chat-overlay-rewards.js';
import {
  readOfficialChatOverlayRewards,
  resetOfficialChatOverlayRewardsForTests,
  type OfficialChatOverlayReward,
} from './official-chat-overlay-rewards-store.js';

const verifiedPro = {
  ...members[0]!,
  id: 'm1',
  tier: 'Pro' as const,
  signal: 'Green' as const,
};

const verifiedElite = {
  ...verifiedPro,
  id: 'overlay-test-elite',
  tier: 'Elite' as const,
};

describe('chat-overlay-rewards', () => {
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
    resetMemberCosmeticEquipsForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetOfficialChatOverlayRewardsForTests();
    resetMemberCosmeticEquipsForTests();
  });

  it('blocks unlocks for Black Passport signal members', () => {
    const catalog = readOfficialChatOverlayRewards();
    const verifiedReward = catalog.find((reward) => reward.condition.type === 'verified')!;
    const blackSignalMember = {
      ...verifiedPro,
      signal: 'Black' as const,
    };

    expect(overlayRewardUnlockedForMember(blackSignalMember, verifiedReward)).toBe(false);
  });

  it('unlocks rewards from tier, verification, and official grant conditions', () => {
    const catalog = readOfficialChatOverlayRewards();
    const verifiedReward = catalog.find((reward) => reward.condition.type === 'verified')!;
    const proReward = catalog.find(
      (reward) => reward.condition.type === 'tier-min' && reward.condition.tier === 'Pro'
    )!;
    const eliteReward = catalog.find(
      (reward) => reward.condition.type === 'tier-min' && reward.condition.tier === 'Elite'
    )!;

    expect(overlayRewardUnlockedForMember(verifiedPro, verifiedReward)).toBe(true);
    expect(overlayRewardUnlockedForMember(verifiedPro, proReward)).toBe(true);
    expect(overlayRewardUnlockedForMember(verifiedPro, eliteReward)).toBe(false);
    expect(overlayRewardUnlockedForMember(verifiedElite, eliteReward)).toBe(true);
  });

  it('resolves equipped overlay classes as chat bubble borders', () => {
    const customCatalog: OfficialChatOverlayReward[] = [
      {
        id: 'overlay-equipped',
        name: 'Equipped Spark',
        description: 'Test overlay',
        borderStyle: 'genesis-spark',
        motion: 'premium-loop',
        accent: 'mint',
        condition: { type: 'verified' },
        enabled: true,
        updatedAtMs: 1,
      },
    ];

    window.localStorage.setItem('nami.self.profile', JSON.stringify({ chatOverlayDisplay: 'overlay-equipped' }));

    const resolved = resolveChatOverlayForMember(verifiedPro, customCatalog);

    expect(resolved?.rewardId).toBe('overlay-equipped');
    expect(resolved?.className).toContain('has-chat-overlay-border');
    expect(resolved?.className).toContain('chat-overlay-border-genesis-spark');
    expect(resolved?.className).toContain('chat-overlay-motion-premium-loop');
    expect(unlockedChatOverlayRewardsForMember(verifiedPro, customCatalog)).toHaveLength(1);
  });

  it('resolves equipped overlays for other members from the shared equip cache', () => {
    const customCatalog: OfficialChatOverlayReward[] = [
      {
        id: 'overlay-equipped',
        name: 'Equipped Spark',
        description: 'Test overlay',
        borderStyle: 'genesis-spark',
        motion: 'premium-loop',
        accent: 'mint',
        condition: { type: 'verified' },
        enabled: true,
        updatedAtMs: 1,
      },
    ];

    const verifiedMember2 = {
      ...verifiedPro,
      id: 'm2',
    };

    setLocalEquippedChatOverlay('m2', 'overlay-equipped');

    const resolved = resolveChatOverlayForMember(verifiedMember2, customCatalog);

    expect(resolved?.rewardId).toBe('overlay-equipped');
    expect(resolved?.className).toContain('chat-overlay-border-genesis-spark');
  });
});