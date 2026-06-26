import type { NamiMember } from './domain/types.js';

export function sortGrantRosterMembers(members: NamiMember[]): NamiMember[] {
  return [...members].sort((left, right) => left.name.localeCompare(right.name));
}

/** Merge discovery roster with already-granted member ids that are no longer listed. */
export function grantRosterMembers(
  rosterMembers: NamiMember[],
  grantedMemberIds: string[]
): NamiMember[] {
  const sorted = sortGrantRosterMembers(rosterMembers);
  const knownIds = new Set(sorted.map((member) => member.id));

  const preservedGrants = grantedMemberIds
    .filter((memberId) => memberId.trim() && !knownIds.has(memberId))
    .map(
      (memberId): NamiMember => ({
        id: memberId,
        surfaceType: 'member',
        name: memberId,
        avatarSeed: memberId.slice(0, 2).toUpperCase() || 'NA',
        signal: 'Green',
        tier: 'NPC',
        badge: 'Granted',
      })
    );

  return [...sorted, ...sortGrantRosterMembers(preservedGrants)];
}