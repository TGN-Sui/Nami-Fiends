import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  authenticateMemberCredentials,
  clearMemberSession,
  readMemberSession,
  saveMemberSession,
  type MemberSession,
} from './member-session-store.js';

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

const sampleSession: MemberSession = {
  displayName: 'River',
  email: 'river@example.com',
  archetype: 2,
  archetypeLabel: 'Cozy Voyager',
  flavorBadgeId: 'Hearth Basic',
  quizAnswers: {
    play_style: 'coop',
    social: 'friends',
    platform: 'pc',
  },
  issuedPlayerScore: 28,
  issuedPlayerScoreTier: 'basic',
  playerScoreIssuedAtMs: 1_700_000_000_000,
  signedUpAtMs: 1_700_000_000_000,
};

describe('authenticateMemberCredentials', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    clearMemberSession();
    window.localStorage.removeItem('nami.member.accounts');
    vi.unstubAllGlobals();
  });

  it('restores a signed-out account from the local registry', () => {
    saveMemberSession(sampleSession);
    clearMemberSession();

    expect(readMemberSession()).toBeNull();

    const restored = authenticateMemberCredentials('river@example.com', 'River');

    expect(restored?.displayName).toBe('River');
    expect(readMemberSession()?.email).toBe('river@example.com');
  });

  it('rejects credentials that do not match a saved account', () => {
    saveMemberSession(sampleSession);
    clearMemberSession();

    expect(authenticateMemberCredentials('river@example.com', 'Wrong Name')).toBeNull();
    expect(authenticateMemberCredentials('other@example.com', 'River')).toBeNull();
    expect(readMemberSession()).toBeNull();
  });
});