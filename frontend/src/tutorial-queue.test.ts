import { describe, expect, it } from 'vitest';

import type { MemberPreferences } from './member-preferences-api.js';
import { shouldShowTutorial } from './tutorial-queue.js';
import { TUTORIAL_VERSION } from './tutorial-registry.js';

function samplePreferences(overrides: Partial<MemberPreferences> = {}): MemberPreferences {
  return {
    owner: '0x1',
    avatarUrl: null,
    streamingOnline: false,
    hubFirstVisitCompleted: false,
    superBannerSeenIds: [],
    tutorialStatus: 'pending',
    tutorialVersion: 0,
    updatedAtMs: 0,
    ...overrides,
  };
}

describe('tutorial-queue', () => {
  it('shows tutorial when status is pending', () => {
    expect(shouldShowTutorial(samplePreferences({ tutorialStatus: 'pending' }))).toBe(true);
  });

  it('shows tutorial when version is behind current', () => {
    expect(
      shouldShowTutorial(
        samplePreferences({
          tutorialStatus: 'completed',
          tutorialVersion: TUTORIAL_VERSION - 1,
        }),
      ),
    ).toBe(true);
  });

  it('skips tutorial when completed at current version', () => {
    expect(
      shouldShowTutorial(
        samplePreferences({
          tutorialStatus: 'completed',
          tutorialVersion: TUTORIAL_VERSION,
        }),
      ),
    ).toBe(false);
  });

  it('skips tutorial when skipped at current version', () => {
    expect(
      shouldShowTutorial(
        samplePreferences({
          tutorialStatus: 'skipped',
          tutorialVersion: TUTORIAL_VERSION,
        }),
      ),
    ).toBe(false);
  });
});