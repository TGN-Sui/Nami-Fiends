import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isPreApprovedGameOwner,
  saveGameOwnerSession,
  type GameOwnerSession,
} from './game-owner-session-store.js';

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

function createSession(status: GameOwnerSession['approvalStatus']): GameOwnerSession {
  return {
    ticketId: 'game-ticket-demo',
    provisionalChannelId: 'pending-game-vortex',
    gameTitle: 'Vortex Arena',
    studioName: 'North Arcade',
    contactName: 'River Chen',
    email: 'studio@northarcade.example',
    phone: '',
    tagline: 'Pre-approved game channel',
    genre: 'Shooter',
    platforms: ['PC'],
    officialSocialPlatform: 'x',
    officialSocialHandle: 'vortexarena',
    officialSocialVerified: true,
    walletAddress: null,
    trustScore: 72,
    trustScoreTier: 'premium',
    approvalStatus: status,
    questionnaireStarted: false,
    questionnaireComplete: false,
    submittedAtMs: Date.now(),
  };
}

describe('game-owner-session-store', () => {
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

  it('treats only preapproved sessions as pre-approved owners', () => {
    saveGameOwnerSession(createSession('submitted'));
    expect(isPreApprovedGameOwner()).toBe(false);

    saveGameOwnerSession(createSession('preapproved'));
    expect(isPreApprovedGameOwner()).toBe(true);
  });
});