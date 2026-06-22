import { getSelfMember } from './member-access.js';
import type { NamiMember } from './domain/types.js';
import { listLocalDiscoveryMembers } from './local-member-directory.js';
import { members } from './uiMockData.js';

export function discoverableGuildSpaceMembers(): NamiMember[] {
  const pool = new Map<string, NamiMember>();

  pool.set(getSelfMember().id, getSelfMember());

  for (const member of listLocalDiscoveryMembers()) {
    pool.set(member.id, member);
  }

  for (const member of members) {
    if (!pool.has(member.id)) {
      pool.set(member.id, member);
    }
  }

  return [...pool.values()];
}

export function findDiscoverableGuildSpaceMember(memberId: string): NamiMember | undefined {
  return discoverableGuildSpaceMembers().find((member) => member.id === memberId);
}