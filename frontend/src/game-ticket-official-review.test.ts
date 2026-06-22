import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OFFICIAL_OWNER = '0xofficialowner';

vi.mock('./nami-capabilities.js', () => ({
  canReviewNodenameClaims: (owner: string | null) => owner?.toLowerCase() === OFFICIAL_OWNER,
  isOfficialOwner: (owner: string | null) => owner?.toLowerCase() === OFFICIAL_OWNER,
}));

import { applyGameTicketOfficialReview } from './game-ticket-official-review.js';
import {
  buildOfficialGameSubmissionTicket,
  upsertGameSubmissionTicket,
} from './game-submission-ticket-store.js';
import {
  createOwnerProvisionedChannel,
  ownerProvisionedChannelById,
  resetOwnerProvisionedChannelsStoreForTests,
} from './owner-provisioned-channels-store.js';

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

describe('applyGameTicketOfficialReview', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetOwnerProvisionedChannelsStoreForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects review attempts from non-official owners', () => {
    const ticket = buildOfficialGameSubmissionTicket({
      id: 'game-ticket-guard',
      ticketKind: 'new-game',
      gameTitle: 'Guarded Game',
      studioName: 'Studio',
      contactName: 'Owner',
      email: 'owner@example.com',
      genres: ['Indie'],
      platforms: ['PC'],
      websiteUrl: '',
      steamStoreUrl: '',
      epicStoreUrl: '',
      xboxStoreUrl: '',
      playstationStoreUrl: '',
      otherStoreUrl: '',
      trailerUrl: '',
      officialSocialPlatform: 'x',
      officialSocialHandle: 'guardedgame',
      officialSocialVerified: true,
      walletAddress: null,
      provisionalChannelId: 'pending-game-guarded',
      trustScore: 40,
      trustScoreTier: 'basic',
      status: 'submitted',
      questionnaireEligible: false,
      questionnaireStarted: false,
      submittedAtMs: Date.now(),
    });

    upsertGameSubmissionTicket(ticket);

    const result = applyGameTicketOfficialReview(
      ticket.id,
      'approved',
      '0xnotowner0000000000000000000000000002'
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain('official owner');
  });

  it('marks owner-provisioned channels claimed when channel-claim tickets are approved', () => {
    const created = createOwnerProvisionedChannel(
      {
        gameTitle: 'Claim Me',
        handle: 'claimme',
        genre: 'Indie',
        platforms: ['PC'],
      },
      OFFICIAL_OWNER
    );

    const channelId = created.channel!.channelId;

    const ticket = buildOfficialGameSubmissionTicket({
      id: 'channel-claim-1',
      ticketKind: 'channel-claim',
      gameTitle: 'Claim Me',
      studioName: 'Real Studio',
      contactName: 'River',
      email: 'river@example.com',
      genres: ['Indie'],
      platforms: ['PC'],
      websiteUrl: '',
      steamStoreUrl: '',
      epicStoreUrl: '',
      xboxStoreUrl: '',
      playstationStoreUrl: '',
      otherStoreUrl: '',
      trailerUrl: '',
      officialSocialPlatform: 'x',
      officialSocialHandle: 'claimme',
      officialSocialVerified: true,
      walletAddress: '0xclaimant000000000000000000000000001',
      provisionalChannelId: channelId,
      targetChannelId: channelId,
      claimProofNotes: 'I control the Steam listing and studio domain.',
      trustScore: 72,
      trustScoreTier: 'premium',
      status: 'submitted',
      questionnaireEligible: false,
      questionnaireStarted: false,
      submittedAtMs: Date.now(),
    });

    upsertGameSubmissionTicket(ticket);

    const result = applyGameTicketOfficialReview(ticket.id, 'approved', OFFICIAL_OWNER);

    expect(result.ok).toBe(true);
    expect(ownerProvisionedChannelById(channelId)?.status).toBe('claimed');
  });
});