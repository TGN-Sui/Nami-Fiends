import { describe, expect, it } from 'vitest';

import { computeGameTrustScore, GAME_PREAPPROVAL_THRESHOLD } from './game-trust-score.js';

describe('game trust score', () => {
  it('marks pre-approval eligible at 60% or higher', () => {
    const breakdown = computeGameTrustScore({
      gameTitle: 'Vortex Arena',
      studioName: 'North Arcade',
      contactName: 'River Chen',
      email: 'studio@northarcade.example',
      phone: '+1 555 0100',
      websiteUrl: 'https://northarcade.example',
      storePageUrl: 'https://store.steampowered.com/app/123456',
      trailerUrl: 'https://youtube.com/watch?v=demo',
      officialSocialPlatform: 'x',
      officialSocialHandle: '@vortexarena',
      officialSocialVerified: true,
      walletLinked: true,
      walletSource: 'zklogin',
    });

    expect(breakdown.total).toBeGreaterThanOrEqual(GAME_PREAPPROVAL_THRESHOLD);
    expect(breakdown.preapprovalEligible).toBe(true);
  });

  it('stays below pre-approval without official proofs', () => {
    const breakdown = computeGameTrustScore({
      gameTitle: 'Vortex Arena',
      studioName: 'North Arcade',
      contactName: 'River Chen',
      email: 'studio@northarcade.example',
      phone: '+1 555 0100',
      websiteUrl: '',
      storePageUrl: '',
      trailerUrl: '',
      officialSocialPlatform: null,
      officialSocialHandle: '',
      officialSocialVerified: false,
      walletLinked: false,
      walletSource: null,
    });

    expect(breakdown.total).toBeLessThan(GAME_PREAPPROVAL_THRESHOLD);
    expect(breakdown.preapprovalEligible).toBe(false);
  });
});