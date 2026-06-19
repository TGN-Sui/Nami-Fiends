import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  linkMemberSessionAuth,
  restoreMemberSessionByEmail,
  restoreMemberSessionByWalletAddress,
} from './member-auth-link-store.js';
import { saveMemberSession, type MemberSession } from './member-session-store.js';

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
  quizAnswers: {},
  issuedPlayerScore: 28,
  issuedPlayerScoreTier: 'basic',
  playerScoreIssuedAtMs: 1_700_000_000_000,
  signedUpAtMs: 1_700_000_000_000,
};

describe('member-auth-link-store', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('restores a member session by linked email', () => {
    saveMemberSession(sampleSession);
    linkMemberSessionAuth(sampleSession, { email: sampleSession.email });

    const restored = restoreMemberSessionByEmail('river@example.com');

    expect(restored?.displayName).toBe('River');
  });

  it('restores a member session by linked wallet address', () => {
    saveMemberSession(sampleSession);
    linkMemberSessionAuth(sampleSession, {
      email: sampleSession.email,
      walletAddress: '0xabc123',
    });

    const restored = restoreMemberSessionByWalletAddress('0xAbC123');

    expect(restored?.email).toBe('river@example.com');
  });
});