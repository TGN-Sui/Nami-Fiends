import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getOfficialFeedAbuseAlerts,
  isMemberFeedSuspended,
  resetMemberFeedAbuseForTests,
  resolveMemberFeedAbuseForOwner,
  submitMemberFeedAbuseReport,
  VERIFIED_REPORT_THRESHOLD,
  VERIFIED_REPORT_WINDOW_MS,
} from './member-feed-abuse-store.js';

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

const verifiedReporter = (id: string, name: string) => ({
  id,
  name,
  signal: 'Green' as const,
  tier: 'Pro' as const,
  badge: 'Helper',
  surfaceType: 'member' as const,
  avatarSeed: id,
});

const npcReporter = () => ({
  id: 'npc-1',
  name: 'NPC Bot',
  signal: 'Green' as const,
  tier: 'NPC' as const,
  badge: 'NPC',
  surfaceType: 'member' as const,
  avatarSeed: 'npc',
});

describe('member-feed-abuse-store', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: createLocalStorageMock() });
    resetMemberFeedAbuseForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects reports from NPC and unverified members', () => {
    const npcResult = submitMemberFeedAbuseReport({
      feedOwnerMemberId: 'm9',
      feedOwnerName: 'Target',
      reporter: npcReporter(),
      reportType: 'explicit-adult',
    });

    expect(npcResult.ok).toBe(false);

    const unverifiedResult = submitMemberFeedAbuseReport({
      feedOwnerMemberId: 'm9',
      feedOwnerName: 'Target',
      reporter: {
        ...verifiedReporter('m8', 'Orange Member'),
        signal: 'Orange',
      },
      reportType: 'explicit-adult',
    });

    expect(unverifiedResult.ok).toBe(false);
  });

  it('notifies officials after multiple verified reports in a short window', () => {
    const now = Date.parse('2026-06-17T12:00:00.000Z');

    for (let index = 0; index < VERIFIED_REPORT_THRESHOLD; index += 1) {
      const result = submitMemberFeedAbuseReport({
        feedOwnerMemberId: 'm9',
        feedOwnerName: 'Target',
        reporter: verifiedReporter('r' + index, 'Reporter ' + index),
        reportType: 'explicit-adult',
        now: now + index * 60_000,
      });

      expect(result.ok).toBe(true);
    }

    const alerts = getOfficialFeedAbuseAlerts();

    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.feedOwnerMemberId).toBe('m9');
    expect(alerts[0]?.pendingReportCount).toBe(VERIFIED_REPORT_THRESHOLD);
  });

  it('suspends feeds when officials were notified and abuse is still reported', () => {
    const now = Date.parse('2026-06-17T12:00:00.000Z');

    for (let index = 0; index < VERIFIED_REPORT_THRESHOLD; index += 1) {
      submitMemberFeedAbuseReport({
        feedOwnerMemberId: 'm9',
        feedOwnerName: 'Target',
        reporter: verifiedReporter('r' + index, 'Reporter ' + index),
        reportType: 'drugs',
        now: now + index * 60_000,
      });
    }

    const escalation = submitMemberFeedAbuseReport({
      feedOwnerMemberId: 'm9',
      feedOwnerName: 'Target',
      reporter: verifiedReporter('r-extra', 'Reporter Extra'),
      reportType: 'violence',
      now: now + 5 * 60_000,
    });

    expect(escalation.ok).toBe(true);
    if (escalation.ok) {
      expect(escalation.suspended).toBe(true);
    }

    expect(isMemberFeedSuspended('m9')).toBe(true);
  });

  it('clears suspension after reports are resolved', () => {
    const now = Date.parse('2026-06-17T12:00:00.000Z');

    for (let index = 0; index < VERIFIED_REPORT_THRESHOLD + 1; index += 1) {
      submitMemberFeedAbuseReport({
        feedOwnerMemberId: 'm9',
        feedOwnerName: 'Target',
        reporter: verifiedReporter('r' + index, 'Reporter ' + index),
        reportType: 'spam-misuse',
        now: now + index * 60_000,
      });
    }

    expect(isMemberFeedSuspended('m9')).toBe(true);

    resolveMemberFeedAbuseForOwner('m9', now + 20 * 60_000);

    expect(isMemberFeedSuspended('m9')).toBe(false);
    expect(getOfficialFeedAbuseAlerts()).toHaveLength(0);
  });

  it('returns a stable alerts snapshot between reads', () => {
    const first = getOfficialFeedAbuseAlerts();
    const second = getOfficialFeedAbuseAlerts();

    expect(first).toBe(second);
  });

  it('only counts verified reports inside the escalation window', () => {
    const now = Date.parse('2026-06-17T12:00:00.000Z');

    submitMemberFeedAbuseReport({
      feedOwnerMemberId: 'm9',
      feedOwnerName: 'Target',
      reporter: verifiedReporter('old-1', 'Old Reporter'),
      reportType: 'hate-language',
      now: now - VERIFIED_REPORT_WINDOW_MS - 60_000,
    });

    for (let index = 0; index < VERIFIED_REPORT_THRESHOLD - 1; index += 1) {
      submitMemberFeedAbuseReport({
        feedOwnerMemberId: 'm9',
        feedOwnerName: 'Target',
        reporter: verifiedReporter('recent-' + index, 'Recent ' + index),
        reportType: 'hate-language',
        now: now + index * 60_000,
      });
    }

    expect(getOfficialFeedAbuseAlerts()).toHaveLength(0);
  });
});