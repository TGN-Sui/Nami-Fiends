import { describe, expect, it } from 'vitest';

import { buildOfficialGameSubmissionTicket } from './game-submission-ticket-store.js';

describe('buildOfficialGameSubmissionTicket', () => {
  it('never includes phone in officials-facing tickets', () => {
    const ticket = buildOfficialGameSubmissionTicket({
      id: 'game-ticket-1',
      gameTitle: 'Vortex Arena',
      studioName: 'North Arcade',
      contactName: 'River Chen',
      email: 'studio@northarcade.example',
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
      status: 'submitted',
      questionnaireEligible: true,
      questionnaireStarted: false,
      submittedAtMs: Date.now(),
    });

    expect(ticket.phone).toBe('');
  });
});