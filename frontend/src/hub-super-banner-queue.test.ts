import { describe, expect, it } from 'vitest';

import type { HubSuperBannerCampaign } from './hub-super-banner-api.js';
import { filterUnseenSuperBanners, shouldRunHubSuperBannerQueue } from './hub-super-banner-queue.js';

const sampleCampaign = (id: string): HubSuperBannerCampaign => ({
  id,
  channelId: 'channel-1',
  coverUrl: '',
  headline: 'Headline',
  body: 'Body',
  sentAtMs: 1,
  expiresAtMs: 9_999_999,
});

describe('hub-super-banner-queue', () => {
  it('skips queue on first hub visit', () => {
    expect(
      shouldRunHubSuperBannerQueue({
        owner: '0x1',
        avatarUrl: null,
        streamingOnline: false,
        hubFirstVisitCompleted: false,
        superBannerSeenIds: [],
        tutorialStatus: 'pending',
        tutorialVersion: 0,
        updatedAtMs: 0,
      }),
    ).toBe(false);
  });

  it('runs queue on return visits', () => {
    expect(
      shouldRunHubSuperBannerQueue({
        owner: '0x1',
        avatarUrl: null,
        streamingOnline: false,
        hubFirstVisitCompleted: true,
        superBannerSeenIds: [],
        tutorialStatus: 'pending',
        tutorialVersion: 0,
        updatedAtMs: 0,
      }),
    ).toBe(true);
  });

  it('filters seen banner ids', () => {
    const campaigns = [sampleCampaign('a'), sampleCampaign('b')];
    const unseen = filterUnseenSuperBanners(campaigns, ['a']);

    expect(unseen.map((row) => row.id)).toEqual(['b']);
  });
});