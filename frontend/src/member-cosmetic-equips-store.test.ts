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
  invalidateMemberCosmeticEquipsCache,
  MEMBER_COSMETIC_EQUIPS_STORAGE_KEY,
  readEquippedChatOverlayIdForMember,
  readMemberCosmeticEquipsUpdatedAtMs,
  resetMemberCosmeticEquipsForTests,
  setLocalEquippedChatOverlay,
} from './member-cosmetic-equips-store.js';

describe('member-cosmetic-equips-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetMemberCosmeticEquipsForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetMemberCosmeticEquipsForTests();
  });

  it('reads equipped overlay ids for any member from the local equip cache', () => {
    setLocalEquippedChatOverlay('m2', 'overlay-wave-frame');

    expect(readEquippedChatOverlayIdForMember('m2')).toBe('overlay-wave-frame');
    expect(readEquippedChatOverlayIdForMember('m9')).toBe('');
  });

  it('migrates legacy profile chat overlay equips into the equip cache', () => {
    const localStorage = window.localStorage as Storage;

    localStorage.setItem(
      'nami.self.profile',
      JSON.stringify({ chatOverlayDisplay: 'overlay-wave-frame' })
    );

    expect(readEquippedChatOverlayIdForMember('m1')).toBe('overlay-wave-frame');
    expect(localStorage.getItem(MEMBER_COSMETIC_EQUIPS_STORAGE_KEY)).toContain('overlay-wave-frame');
  });

  it('re-reads equips from localStorage after cache invalidation', () => {
    const localStorage = window.localStorage as Storage;

    localStorage.setItem(
      MEMBER_COSMETIC_EQUIPS_STORAGE_KEY,
      JSON.stringify({ equips: { m4: 'overlay-genesis-spark' }, updatedAtMs: 42 })
    );
    invalidateMemberCosmeticEquipsCache();

    expect(readEquippedChatOverlayIdForMember('m4')).toBe('overlay-genesis-spark');
    expect(readMemberCosmeticEquipsUpdatedAtMs()).toBe(42);
  });
});