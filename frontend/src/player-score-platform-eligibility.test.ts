import { describe, expect, it } from 'vitest';

import {
  evaluatePlatformScoreEligibility,
  filterScoreEligiblePlatformIds,
  type VerifiedPlatformLinkRecord,
} from './player-score-platform-eligibility.js';

const passportCreatedAtMs = 1_700_000_000_000;

function link(overrides: Partial<VerifiedPlatformLinkRecord> = {}): VerifiedPlatformLinkRecord {
  return {
    platformId: 'steam',
    linkedAtMs: passportCreatedAtMs - 86_400_000,
    verified: true,
    ...overrides,
  };
}

describe('platform score eligibility', () => {
  it('rejects unverified local links', () => {
    const result = evaluatePlatformScoreEligibility(link({ verified: false }), {
      passportCreatedAtMs,
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/pending OAuth/i);
  });

  it('rejects fresh platform accounts created to farm score', () => {
    const result = evaluatePlatformScoreEligibility(
      link({
        linkedAtMs: passportCreatedAtMs + 86_400_000,
        accountCreatedAtMs: passportCreatedAtMs + 80_000_000,
      }),
      { passportCreatedAtMs }
    );

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/too recently/i);
  });

  it('rejects post-passport links without post-passport activity', () => {
    const result = evaluatePlatformScoreEligibility(
      link({
        linkedAtMs: passportCreatedAtMs + 86_400_000,
        accountCreatedAtMs: passportCreatedAtMs - 3_600_000_000,
        hasPostPassportActivity: false,
      }),
      { passportCreatedAtMs }
    );

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/post-passport/i);
  });

  it('accepts post-passport links when API reports post-passport activity', () => {
    const result = evaluatePlatformScoreEligibility(
      link({
        linkedAtMs: passportCreatedAtMs + 86_400_000,
        accountCreatedAtMs: passportCreatedAtMs - 3_600_000_000,
        hasPostPassportActivity: true,
      }),
      { passportCreatedAtMs }
    );

    expect(result.eligible).toBe(true);
  });

  it('filters only eligible platform ids for score math', () => {
    const eligible = filterScoreEligiblePlatformIds(
      [
        link({ platformId: 'steam', verified: true }),
        link({ platformId: 'epic', verified: false }),
        link({
          platformId: 'playstation',
          verified: true,
          linkedAtMs: passportCreatedAtMs + 1,
          hasPostPassportActivity: false,
        }),
      ],
      { passportCreatedAtMs }
    );

    expect(eligible).toEqual(['steam']);
  });
});