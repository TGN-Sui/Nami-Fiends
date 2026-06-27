import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  bootstrapTestLaunchLoungeMocks,
  resetTestLaunchLoungeMocksForTests,
  testLaunchLoungeMockMembers,
} from './test-launch-lounge-mocks.js';

describe('test-launch-lounge-mocks', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_NAMI_TEST_LAUNCH', 'true');
    vi.stubEnv('VITE_NAMI_LOUNGE_LAYOUT_MOCKS', 'true');
    resetTestLaunchLoungeMocksForTests();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    window.localStorage.clear();
  });

  it('exposes a varied mock roster for lounge layout QA', () => {
    const roster = testLaunchLoungeMockMembers();

    expect(roster.length).toBeGreaterThanOrEqual(12);
    expect(new Set(roster.map((member) => member.tier)).size).toBeGreaterThan(1);
    expect(new Set(roster.map((member) => member.signal)).size).toBeGreaterThan(1);
  });

  it('bootstraps live streamers and twitch embeds once', () => {
    bootstrapTestLaunchLoungeMocks();
    bootstrapTestLaunchLoungeMocks();

    const streaming = JSON.parse(window.localStorage.getItem('nami.member.streaming-online') ?? '{}') as Record<
      string,
      boolean
    >;

    expect(streaming.m8).toBe(true);
    expect(streaming.m16).toBe(true);
    expect(window.localStorage.getItem('nami.test-launch.lounge-mocks-v2')).toBe('done');
    expect(window.localStorage.getItem('nami.embedded-feed.links.member.m8')).toContain('twitch');
  });
});