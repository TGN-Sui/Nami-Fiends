import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  authorizeGameOfficialTwitchAccount,
  authorizeGameOfficialXAccount,
  clearGameOfficialSocialAuth,
  readGameOfficialSocialAuthState,
} from './game-official-social-auth-store.js';

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

describe('game-official-social-auth-store', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    clearGameOfficialSocialAuth();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('authorizes an official X account through the mock authorizer', () => {
    const result = authorizeGameOfficialXAccount('vortexarena');

    expect(result.ok).toBe(true);
    expect(readGameOfficialSocialAuthState().platform).toBe('x');
    expect(readGameOfficialSocialAuthState().handle).toBe('vortexarena');
    expect(readGameOfficialSocialAuthState().authorizer).toBe('x-official-oauth');
  });

  it('authorizes an official Twitch channel through the mock authorizer', () => {
    const result = authorizeGameOfficialTwitchAccount('VortexArena');

    expect(result.ok).toBe(true);
    expect(readGameOfficialSocialAuthState().platform).toBe('twitch');
    expect(readGameOfficialSocialAuthState().handle).toBe('vortexarena');
    expect(readGameOfficialSocialAuthState().authorizer).toBe('twitch-official-oauth');
  });
});