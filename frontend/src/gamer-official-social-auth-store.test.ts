import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  authorizeGamerOfficialTwitchAccount,
  authorizeGamerOfficialXAccount,
  clearGamerScopedOfficialSocialAuth,
  readGamerScopedOfficialSocialAuthState,
} from './official-social-auth-store.js';

vi.mock('./app-config.js', () => ({
  shouldUseDevFixtures: () => true,
}));

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

describe('gamer official social auth store', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    clearGamerScopedOfficialSocialAuth();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('authorizes X and Twitch independently for gamer onboarding', () => {
    const xResult = authorizeGamerOfficialXAccount('RiverQuest');
    const twitchResult = authorizeGamerOfficialTwitchAccount('RiverQuestChannel');

    expect(xResult.ok).toBe(true);
    expect(twitchResult.ok).toBe(true);
    expect(readGamerScopedOfficialSocialAuthState().x.handle).toBe('RiverQuest');
    expect(readGamerScopedOfficialSocialAuthState().twitch.handle).toBe('riverquestchannel');
  });
});