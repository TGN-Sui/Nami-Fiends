import type { NamiMember } from './domain/types.js';
import { listRegisteredMemberAccounts, readMemberSession } from './member-session-store.js';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function memberIdForAccountEmail(email: string): string {
  let hash = 0;

  for (const char of normalizeEmail(email)) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }

  return 'member-' + Math.abs(hash).toString(36);
}

export function namiMemberFromRegisteredAccount(
  account: ReturnType<typeof listRegisteredMemberAccounts>[number],
  isSelf: boolean,
): NamiMember {
  const displayName = account.displayName.trim() || 'Traveler';
  const avatarSeed = displayName.slice(0, 2).toUpperCase() || 'NA';

  const member: NamiMember = {
    id: isSelf ? 'm1' : memberIdForAccountEmail(account.email),
    surfaceType: 'member',
    name: displayName,
    avatarSeed,
    signal: 'Green',
    tier: 'NPC',
    badge: account.flavorBadgeId?.trim() || 'Unset',
  };

  const avatarUrl = account.avatarUrl?.trim();

  if (avatarUrl) {
    return {
      ...member,
      avatarImageUrl: avatarUrl,
    };
  }

  return member;
}

export function listLocalDiscoveryMembers(): NamiMember[] {
  const accounts = listRegisteredMemberAccounts();
  const selfEmail = readMemberSession()?.email;
  const normalizedSelfEmail = selfEmail ? normalizeEmail(selfEmail) : null;
  const seenIds = new Set<string>();

  return accounts.flatMap((account) => {
    const isSelf =
      normalizedSelfEmail !== null && normalizeEmail(account.email) === normalizedSelfEmail;
    const member = namiMemberFromRegisteredAccount(account, isSelf);

    if (seenIds.has(member.id)) {
      return [];
    }

    seenIds.add(member.id);
    return [member];
  });
}