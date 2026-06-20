import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  readGameApprovalEmailForTicket,
  sendGameApprovalEmail,
} from './game-approval-email-store.js';
import type { GameSubmissionTicket } from './game-submission-ticket-store.js';

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

const sampleTicket: GameSubmissionTicket = {
  id: 'game-ticket-demo',
  gameTitle: 'Vortex Arena',
  studioName: 'North Arcade',
  contactName: 'River Chen',
  email: 'studio@northarcade.example',
  phone: '',
  genres: ['Indie'],
  websiteUrl: '',
  steamStoreUrl: '',
  epicStoreUrl: '',
  xboxStoreUrl: '',
  playstationStoreUrl: '',
  otherStoreUrl: '',
  trailerUrl: '',
  officialSocialPlatform: 'x',
  officialSocialHandle: 'vortexarena',
  officialSocialVerified: true,
  walletAddress: null,
  provisionalChannelId: 'pending-game-vortex',
  trustScore: 72,
  trustScoreTier: 'premium',
  status: 'approved',
  questionnaireEligible: true,
  questionnaireStarted: false,
  submittedAtMs: Date.now(),
};

describe('game-approval-email-store', () => {
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

  it('sends an approval email to the studio address on file', () => {
    const result = sendGameApprovalEmail(sampleTicket);

    expect(result.ok).toBe(true);
    expect(readGameApprovalEmailForTicket(sampleTicket.id)?.email).toBe(
      'studio@northarcade.example',
    );
  });
});