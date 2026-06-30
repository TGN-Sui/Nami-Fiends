import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MemberPreferences } from './member-preferences-api.js';

const syncMemberPreferencesToBackend = vi.hoisted(() =>
  vi.fn(async () => ({
    owner: '0x1',
    avatarUrl: null,
    streamingOnline: false,
    hubFirstVisitCompleted: true,
    superBannerSeenIds: [],
    tutorialStatus: 'pending' as const,
    tutorialVersion: 0,
    updatedAtMs: 0,
  })),
);

vi.mock('./member-preferences-api.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./member-preferences-api.js')>();

  return {
    ...actual,
    isMemberPreferencesApiAvailable: () => true,
    syncMemberPreferencesToBackend,
  };
});

import {
  consumeTutorialReplaySkipBanners,
  markTutorialReplayFromSettings,
  replayTutorialFromSettings,
  shouldShowTutorial,
} from './tutorial-queue.js';
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('consumes replay skip-banners flag once', () => {
    markTutorialReplayFromSettings();

    expect(consumeTutorialReplaySkipBanners()).toBe(true);
    expect(consumeTutorialReplaySkipBanners()).toBe(false);
  });

  it('resets tutorial prefs and marks skip-banners before navigating to hub', async () => {
    const onNavigateHub = vi.fn();

    await replayTutorialFromSettings('0x1', onNavigateHub);

    expect(syncMemberPreferencesToBackend).toHaveBeenCalledWith({
      owner: '0x1',
      tutorialStatus: 'pending',
      tutorialVersion: 0,
    });
    expect(consumeTutorialReplaySkipBanners()).toBe(true);
    expect(onNavigateHub).toHaveBeenCalledTimes(1);
  });

  it('throws when tutorial prefs reset fails', async () => {
    syncMemberPreferencesToBackend.mockRejectedValueOnce(new Error('wallet_auth_invalid'));

    await expect(replayTutorialFromSettings('0x1')).rejects.toThrow('tutorial_reset_failed');
  });
});