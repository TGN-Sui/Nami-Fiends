import { readAppConfig, shouldUseDevFixtures, isTestLaunchMode } from './app-config.js';
import { resolveNamiAdminRole } from './nami-capabilities.js';
import { readLinkedMemberDisplayName } from './linked-member-store.js';
import { resolveMemberDisplayName } from './member-display-name-store.js';
import { readMemberSession } from './member-session-store.js';
import { readResolvedProtocolOwner } from './protocol-owner-resolve.js';
import type { NamiMember } from './uiMockData.js';

const SELF_MEMBER_ID = 'm1';

const GENESIS_DATA_PURGE_KEY = 'nami.test-launch.genesis-data-v1';

const DEMO_MESSAGE_STORE_KEYS = [
  'nami.user.message-threads',
  'nami.user.channel-messages',
  'nami.user.global-chat-messages',
  'nami.user.guild-chat-messages',
] as const;

/** Real signed-in users start at level 1 NPC with no seeded fixture progression. */
export function shouldUseGenesisSelfMember(config = readAppConfig()): boolean {
  return !shouldUseDevFixtures(config);
}

export function applyGenesisSelfOverrides(member: NamiMember): NamiMember {
  if (member.id !== SELF_MEMBER_ID) {
    return member;
  }

  const session = readMemberSession();
  const owner = readResolvedProtocolOwner();
  const isBoss = resolveNamiAdminRole(owner) === 'official-owner';

  const linkedDisplayName = readLinkedMemberDisplayName();
  const resolvedName = resolveMemberDisplayName(SELF_MEMBER_ID, member.name);

  const next: NamiMember = {
    ...member,
    tier: 'NPC',
    signal: 'Green',
    name: linkedDisplayName ?? resolvedName,
    badge: session?.flavorBadgeId?.trim() || member.badge,
  };

  if (isBoss) {
    next.isNamiBoss = true;
    delete next.isNamiTeam;
  } else {
    delete next.isNamiBoss;
    delete next.isNamiTeam;
  }

  return next;
}

/** One-time purge of dev-seeded chat logs when entering official test launch. */
export function ensureGenesisLocalDataOnTestLaunch(): void {
  if (!isTestLaunchMode()) {
    return;
  }

  try {
    if (window.localStorage.getItem(GENESIS_DATA_PURGE_KEY) === 'done') {
      return;
    }

    for (const key of DEMO_MESSAGE_STORE_KEYS) {
      window.localStorage.removeItem(key);
    }

    window.localStorage.setItem(GENESIS_DATA_PURGE_KEY, 'done');
  } catch {
    // Ignore storage failures in restricted environments.
  }
}