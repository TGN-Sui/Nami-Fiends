import { useMemo } from 'react';

import { shouldUseDevFixtures } from './app-config.js';
import type { NamiMember } from './domain/types.js';
import { members as seedMembers } from './fixtures/seed-data.js';
import type { ProtocolLoadState } from './protocol-query.js';

export type DirectoryDataSource = 'live' | 'fixture';

export type MemberDirectoryItem = {
  member: NamiMember;
  source: DirectoryDataSource;
};

function shouldUseFixtureDirectory(
  liveItems: unknown[],
  loadState: ProtocolLoadState,
  liveQueryEnabled: boolean
): boolean {
  if (liveItems.length > 0) {
    return false;
  }

  if (!shouldUseDevFixtures()) {
    return false;
  }

  if (liveQueryEnabled && loadState === 'ready') {
    return false;
  }

  return loadState !== 'loading';
}

function mapFixtureMember(member: NamiMember): MemberDirectoryItem {
  return {
    member,
    source: 'fixture',
  };
}

export function resolveMemberDirectory(input: {
  liveMembers: NamiMember[];
  loadState: ProtocolLoadState;
  liveQueryEnabled: boolean;
  fixtureMembers?: NamiMember[];
}): MemberDirectoryItem[] {
  if (input.loadState === 'loading') {
    return [];
  }

  if (input.liveMembers.length > 0) {
    return input.liveMembers.map((member) => ({
      member,
      source: 'live',
    }));
  }

  if (!shouldUseFixtureDirectory(input.liveMembers, input.loadState, input.liveQueryEnabled)) {
    return [];
  }

  const fixtureMembers = input.fixtureMembers ?? seedMembers;

  return fixtureMembers.map(mapFixtureMember);
}

export function memberDirectoryUsesFixtures(items: MemberDirectoryItem[]): boolean {
  return items.some((item) => item.source === 'fixture');
}

export function membersFromDirectory(items: MemberDirectoryItem[]): NamiMember[] {
  return items.map((item) => item.member);
}

/**
 * Member spotlight has no indexer discovery endpoint yet.
 * Fixtures remain available until a live member directory query ships.
 */
export function useMemberDirectory(): {
  items: MemberDirectoryItem[];
  members: NamiMember[];
  loadState: ProtocolLoadState;
  usesFixtures: boolean;
} {
  const loadState: ProtocolLoadState = 'ready';
  const liveQueryEnabled = false;

  const items = useMemo(
    () =>
      resolveMemberDirectory({
        liveMembers: [],
        loadState,
        liveQueryEnabled,
      }),
    [loadState, liveQueryEnabled]
  );

  return {
    items,
    members: membersFromDirectory(items),
    loadState,
    usesFixtures: memberDirectoryUsesFixtures(items),
  };
}