import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { members } from './uiMockData.js';

const testMembers = vi.hoisted(() => {
  const verifiedPro = {
    id: 'm1',
    surfaceType: 'member' as const,
    name: 'Tester',
    signal: 'Green' as const,
    tier: 'Pro' as const,
    badge: 'Hearth Basic',
    avatarSeed: 'NA',
  };

  return { verifiedPro };
});

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

const pushNamiToast = vi.fn();
const enqueueEquippedChatOverlaySync = vi.fn();

vi.mock('./nami-toast-store.js', () => ({
  pushNamiToast: (...args: unknown[]) => pushNamiToast(...args),
}));

vi.mock('./member-cosmetic-equip-retry-queue.js', () => ({
  enqueueEquippedChatOverlaySync: (...args: unknown[]) => enqueueEquippedChatOverlaySync(...args),
}));

vi.mock('./member-access.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./member-access.js')>();

  return {
    ...actual,
    getSelfMember: () => testMembers.verifiedPro,
    isMemberVerified: (member: (typeof members)[number]) =>
      member.signal === 'Green' && member.tier !== 'NPC',
  };
});

import { resetMemberCosmeticEquipsForTests } from './member-cosmetic-equips-store.js';
import {
  resetOfficialChatOverlayRewardsForTests,
  saveOfficialChatOverlayRewards,
  type OfficialChatOverlayReward,
} from './official-chat-overlay-rewards-store.js';
import {
  saveEquippedChatOverlay,
  validateEquippedChatOverlay,
} from './member-cosmetic-equip.js';

const verifiedPro = testMembers.verifiedPro;

const blackSignalMember = {
  ...verifiedPro,
  signal: 'Black' as const,
};

const verifiedReward: OfficialChatOverlayReward = {
  id: 'overlay-verified',
  name: 'Verified Glow',
  description: 'Test overlay',
  borderStyle: 'signal-glow',
  motion: 'static',
  accent: 'cyan',
  staticArtUrl: null,
  animatedArtUrl: null,
  artSliceInsets: { top: 56, right: 32, bottom: 24, left: 32 },
  displayWidths: { top: 28, right: 16, bottom: 12, left: 16 },
  condition: { type: 'verified' },
  enabled: true,
  updatedAtMs: 1,
};

const eliteReward: OfficialChatOverlayReward = {
  ...verifiedReward,
  id: 'overlay-elite',
  name: 'Elite Ring',
  borderStyle: 'pulse-ring',
  condition: { type: 'tier-min', tier: 'Elite' },
};

describe('member-cosmetic-equip', () => {
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
    saveOfficialChatOverlayRewards([verifiedReward, eliteReward]);
    resetMemberCosmeticEquipsForTests();
    pushNamiToast.mockReset();
    enqueueEquippedChatOverlaySync.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetOfficialChatOverlayRewardsForTests();
    resetMemberCosmeticEquipsForTests();
  });

  it('allows clearing an equipped overlay', () => {
    expect(validateEquippedChatOverlay('', verifiedPro)).toEqual({ ok: true });
    expect(saveEquippedChatOverlay('')).toBe(true);
    expect(pushNamiToast).not.toHaveBeenCalled();
    expect(enqueueEquippedChatOverlaySync).toHaveBeenCalledWith('m1', '', null);
  });

  it('rejects overlays that are not unlocked for the member', () => {
    expect(validateEquippedChatOverlay('overlay-elite', verifiedPro)).toEqual({
      ok: false,
      error: 'overlay_not_unlocked',
    });
    expect(saveEquippedChatOverlay('overlay-elite')).toBe(false);
    expect(pushNamiToast).toHaveBeenCalledOnce();
    expect(enqueueEquippedChatOverlaySync).not.toHaveBeenCalled();
  });

  it('rejects missing and disabled catalog entries', () => {
    saveOfficialChatOverlayRewards([
      {
        ...verifiedReward,
        id: 'overlay-disabled',
        enabled: false,
      },
    ]);

    expect(validateEquippedChatOverlay('overlay-missing', verifiedPro)).toEqual({
      ok: false,
      error: 'overlay_not_found',
    });
    expect(validateEquippedChatOverlay('overlay-disabled', verifiedPro)).toEqual({
      ok: false,
      error: 'overlay_disabled',
    });
  });

  it('blocks equips for Black Passport signal members', () => {
    expect(validateEquippedChatOverlay('overlay-verified', blackSignalMember)).toEqual({
      ok: false,
      error: 'cosmetics_locked',
    });
  });
});