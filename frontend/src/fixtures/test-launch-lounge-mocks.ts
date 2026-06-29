/**
 * TEMPORARY lounge layout QA mocks for official testnet builds.
 * Remove this module (and its wiring) after split-layout testing is done.
 */
import { shouldUseTestLaunchLoungeMocks as readLoungeMocksEnabled } from '../app-config.js';
import type { NamiMember } from '../domain/types.js';
import { members as seedMembers } from './seed-data.js';
import { createShellSelfMember } from './shell-catalog.js';

const LOUNGE_MOCKS_BOOTSTRAP_KEY = 'nami.test-launch.lounge-mocks-v3';
const STREAMING_STATUS_KEY = 'nami.member.streaming-online';

/** Curated roster — varied tiers and conduct signals for lounge layout QA. */
const MOCK_MEMBER_IDS = [
  'm2',
  'm3',
  'm4',
  'm5',
  'm6',
  'm7',
  'm8',
  'm9',
  'm10',
  'm11',
  'm12',
  'm13',
  'm14',
  'm15',
  'm16',
  'm17',
  'm18',
] as const;

const LIVE_STREAMER_IDS = ['m3', 'm8', 'm10', 'm12', 'm16', 'm18'] as const;

export function shouldUseTestLaunchLoungeMocks(): boolean {
  return readLoungeMocksEnabled();
}

export function testLaunchLoungeMockMembers(): NamiMember[] {
  const roster = seedMembers.filter((member) =>
    MOCK_MEMBER_IDS.includes(member.id as (typeof MOCK_MEMBER_IDS)[number])
  );

  return roster.length > 0 ? roster : seedMembers.filter((member) => member.id !== 'm1').slice(0, 12);
}

export function resolveMembersForCatalog(selfMember: NamiMember = createShellSelfMember()): NamiMember[] {
  if (!shouldUseTestLaunchLoungeMocks()) {
    return [selfMember];
  }

  return [selfMember, ...testLaunchLoungeMockMembers()];
}

function twitchEmbedForMember(member: NamiMember) {
  const channel = member.name.toLowerCase().replace(/[^a-z0-9]/g, '') || member.id;

  return {
    platform: 'twitch' as const,
    title: member.name + ' · layout test stream',
    handle: channel,
    previewUrl: 'https://www.twitch.tv/' + channel,
    live: true,
  };
}

function persistMemberTwitchEmbed(memberId: string, member: NamiMember): void {
  window.localStorage.setItem(
    'nami.embedded-feed.links.member.' + memberId,
    JSON.stringify([twitchEmbedForMember(member)])
  );
  window.dispatchEvent(
    new CustomEvent('nami-embedded-feed-links-changed', {
      detail: { surface: 'member', memberId },
    })
  );
}

function readStreamingStatusMap(): Record<string, boolean> {
  try {
    const stored = window.localStorage.getItem(STREAMING_STATUS_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, unknown>;
    const next: Record<string, boolean> = {};

    for (const [memberId, value] of Object.entries(parsed)) {
      if (typeof value === 'boolean') {
        next[memberId] = value;
      }
    }

    return next;
  } catch {
    return {};
  }
}

export function bootstrapTestLaunchLoungeMocks(): void {
  if (!shouldUseTestLaunchLoungeMocks()) {
    return;
  }

  try {
    if (window.localStorage.getItem(LOUNGE_MOCKS_BOOTSTRAP_KEY) === 'done') {
      return;
    }

    const mockMembers = testLaunchLoungeMockMembers();
    const streaming = { ...readStreamingStatusMap() };

    for (const member of mockMembers) {
      if (LIVE_STREAMER_IDS.includes(member.id as (typeof LIVE_STREAMER_IDS)[number])) {
        streaming[member.id] = true;
        persistMemberTwitchEmbed(member.id, member);
      }
    }

    window.localStorage.setItem(STREAMING_STATUS_KEY, JSON.stringify(streaming));
    window.localStorage.setItem(LOUNGE_MOCKS_BOOTSTRAP_KEY, 'done');
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

/** Test helper — clears bootstrap flag so mocks can be re-applied. */
export function resetTestLaunchLoungeMocksForTests(): void {
  window.localStorage.removeItem(LOUNGE_MOCKS_BOOTSTRAP_KEY);
}