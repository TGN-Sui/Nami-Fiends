import { describe, expect, it, vi } from 'vitest';

vi.mock('./app-config.js', () => ({
  shouldUseDevFixtures: () => false,
  isTestLaunchMode: () => true,
}));

import { buildOfficialGameSubmissionTicket, isChannelHiddenFromPublic } from './game-submission-ticket-store.js';

describe('isChannelHiddenFromPublic', () => {
  it('allows showcase fixture game channels to open public profiles', () => {
    expect(isChannelHiddenFromPublic('vortex')).toBe(false);
    expect(isChannelHiddenFromPublic('pebble')).toBe(false);
  });
});

describe('buildOfficialGameSubmissionTicket', () => {
  it('never includes phone in officials-facing tickets', () => {
    const ticket = buildOfficialGameSubmissionTicket({
      id: 'game-ticket-1',
      ticketKind: 'new-game',
      gameTitle: 'Vortex Arena',
      studioName: 'North Arcade',
      contactName: 'River Chen',
      email: 'studio@northarcade.example',
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
      officialSocialHandle: 'vortexarena',
      officialSocialVerified: true,
      walletAddress: null,
      provisionalChannelId: 'pending-game-vortex',
      trustScore: 72,
      trustScoreTier: 'premium',
      status: 'submitted',
      questionnaireEligible: true,
      questionnaireStarted: false,
      submittedAtMs: Date.now(),
    });

    expect(ticket.phone).toBe('');
  });
});