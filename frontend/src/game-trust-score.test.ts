import { describe, expect, it } from 'vitest';

import { computeGameTrustScore, GAME_PREAPPROVAL_THRESHOLD } from './game-trust-score.js';

describe('game trust score', () => {
  it('marks pre-approval eligible at 60% or higher', () => {
    const breakdown = computeGameTrustScore({
      gameTitle: 'Vortex Arena',
      studioName: 'North Arcade',
      contactName: 'River Chen',
      email: 'studio@northarcade.example',
      emailVerified: true,
      phone: '+1 555 0100',
      phoneVerified: true,
      websiteUrl: 'https://northarcade.example',
      genres: ['Shooter', 'Indie'],
      steamStoreUrl: 'https://store.steampowered.com/app/123456',
      epicStoreUrl: '',
      xboxStoreUrl: '',
      playstationStoreUrl: '',
      otherStoreUrl: '',
      trailerUrl: 'https://youtube.com/watch?v=demo',
      officialSocialPlatform: 'x',
      officialSocialHandle: '@vortexarena',
      officialSocialVerified: true,
      walletLinked: true,
      walletSource: 'zklogin',
    });

    expect(breakdown.total).toBeGreaterThanOrEqual(GAME_PREAPPROVAL_THRESHOLD);
    expect(breakdown.preapprovalEligible).toBe(true);
    expect(breakdown.boosters.some((booster) => booster.id === 'genres')).toBe(true);
    expect(breakdown.boosters.some((booster) => booster.id === 'steamStoreUrl')).toBe(true);
  });

  it('does not award email or phone trust without verification', () => {
    const breakdown = computeGameTrustScore({
      gameTitle: 'Vortex Arena',
      studioName: 'North Arcade',
      contactName: 'River Chen',
      email: 'studio@northarcade.example',
      emailVerified: false,
      phone: '+1 555 0100',
      phoneVerified: false,
      websiteUrl: '',
      genres: [],
      steamStoreUrl: '',
      epicStoreUrl: '',
      xboxStoreUrl: '',
      playstationStoreUrl: '',
      otherStoreUrl: '',
      trailerUrl: '',
      officialSocialPlatform: null,
      officialSocialHandle: '',
      officialSocialVerified: false,
      walletLinked: false,
      walletSource: null,
    });

    expect(breakdown.boosters.some((booster) => booster.id === 'business-email')).toBe(false);
    expect(breakdown.boosters.some((booster) => booster.id === 'phone')).toBe(false);
  });

  it('stays below pre-approval without official proofs', () => {
    const breakdown = computeGameTrustScore({
      gameTitle: 'Vortex Arena',
      studioName: 'North Arcade',
      contactName: 'River Chen',
      email: 'studio@northarcade.example',
      emailVerified: true,
      phone: '+1 555 0100',
      phoneVerified: true,
      websiteUrl: '',
      genres: [],
      steamStoreUrl: '',
      epicStoreUrl: '',
      xboxStoreUrl: '',
      playstationStoreUrl: '',
      otherStoreUrl: '',
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

  it('caps store link trust score at 15 points', () => {
    const breakdown = computeGameTrustScore({
      gameTitle: 'Vortex Arena',
      studioName: 'North Arcade',
      contactName: 'River Chen',
      email: '',
      emailVerified: false,
      phone: '',
      phoneVerified: false,
      websiteUrl: '',
      genres: [],
      steamStoreUrl: 'https://store.steampowered.com/app/1',
      epicStoreUrl: 'https://store.epicgames.com/game/1',
      xboxStoreUrl: 'https://www.xbox.com/games/store/1',
      playstationStoreUrl: 'https://store.playstation.com/product/1',
      otherStoreUrl: 'https://itch.io/game/1',
      trailerUrl: '',
      officialSocialPlatform: null,
      officialSocialHandle: '',
      officialSocialVerified: false,
      walletLinked: false,
      walletSource: null,
    });

    const storePoints = breakdown.boosters
      .filter((booster) => booster.category === 'gameProof' && booster.id.endsWith('StoreUrl'))
      .reduce((sum, booster) => sum + booster.points, 0);

    expect(storePoints).toBe(15);
  });
});