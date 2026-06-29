import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  authenticateMemberCredentials,
  clearMemberSession,
  compactMemberSessionForRegistry,
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

describe('compactMemberSessionForRegistry', () => {
  it('drops inline avatar uploads from the registry payload', () => {
    const compacted = compactMemberSessionForRegistry({
      ...sampleSession,
      avatarUrl: 'data:image/png;base64,' + 'a'.repeat(10_000),
    });

    expect(compacted.avatarUrl).toBeUndefined();
  });
});

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

    const restored = authenticateMemberCredentials('river@example.com');

    expect(restored?.displayName).toBe('River');
    expect(readMemberSession()?.email).toBe('river@example.com');
  });

  it('authenticates by email even when signup display name differs from passport name', () => {
    saveMemberSession(sampleSession);
    window.localStorage.setItem(
      'nami.self.profile',
      JSON.stringify({ displayName: 'Renamed Passport' }),
    );
    clearMemberSession();

    const restored = authenticateMemberCredentials('river@example.com');

    expect(restored?.displayName).toBe('River');
    expect(readMemberSession()?.email).toBe('river@example.com');
  });

  it('rejects credentials that do not match a saved account', () => {
    saveMemberSession(sampleSession);
    clearMemberSession();

    expect(authenticateMemberCredentials('other@example.com')).toBeNull();
    expect(readMemberSession()).toBeNull();
  });

  it('requires the signup password when one is on file', async () => {
    const { saveMemberPasswordCredential } = await import('./member-credential-store.js');

    saveMemberSession(sampleSession);
    saveMemberPasswordCredential(sampleSession.email, 'secure-pass');
    clearMemberSession();

    expect(authenticateMemberCredentials(sampleSession.email)).toBeNull();
    expect(authenticateMemberCredentials(sampleSession.email, 'wrong-pass')).toBeNull();
    expect(authenticateMemberCredentials(sampleSession.email, 'secure-pass')?.email).toBe(
      sampleSession.email
    );
  });
});