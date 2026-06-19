import { describe, expect, it } from 'vitest';

import { computePlayerScore, computePlayerScoreFromDraft, playerScoreTierLabel } from './player-score.js';

describe('player score', () => {
  it('issues a basic tier score from onboarding draft only', () => {
    const breakdown = computePlayerScoreFromDraft({
      displayName: 'River',
      email: 'river@example.com',
      quizAnswers: {
        play_style: 'coop',
        social: 'friends',
        platform: 'pc',
      },
    });

    expect(breakdown.total).toBeGreaterThanOrEqual(20);
    expect(breakdown.total).toBeLessThan(41);
    expect(breakdown.tier).toBe('basic');
    expect(breakdown.categories[0]?.points).toBeGreaterThan(0);
  });

  it('reaches verified tier when wallet and platforms are linked', () => {
    const breakdown = computePlayerScore({
      displayName: 'River',
      email: 'river@example.com',
      quizAnswers: {
        play_style: 'coop',
        social: 'friends',
        platform: 'pc',
      },
      linkedPlatforms: ['steam', 'epic'],
      xVerified: true,
      walletLinked: true,
      walletSource: 'wallet',
      claimApproved: true,
      hasOnChainPassport: true,
      moderationClear: true,
      guildStandingVerified: true,
    });

    expect(breakdown.total).toBeGreaterThanOrEqual(41);
    expect(['verified', 'premium']).toContain(breakdown.tier);
    expect(playerScoreTierLabel(breakdown.tier)).not.toBe('Basic');
  });

  it('caps each category at its maximum weight', () => {
    const breakdown = computePlayerScore({
      displayName: 'River',
      email: 'river@example.com',
      quizAnswers: {
        play_style: 'coop',
        social: 'friends',
        platform: 'pc',
      },
      linkedPlatforms: ['steam', 'epic', 'xbox', 'playstation', 'riot', 'nintendo', 'itch', 'discord'],
      xVerified: true,
      walletLinked: true,
      walletSource: 'wallet',
      claimApproved: true,
      hasOnChainPassport: true,
      moderationClear: true,
      guildStandingVerified: true,
    });

    expect(breakdown.categories[0]?.points).toBeLessThanOrEqual(40);
    expect(breakdown.categories[1]?.points).toBeLessThanOrEqual(30);
    expect(breakdown.categories[2]?.points).toBeLessThanOrEqual(20);
    expect(breakdown.categories[3]?.points).toBeLessThanOrEqual(10);
    expect(breakdown.total).toBeLessThanOrEqual(100);
  });
});