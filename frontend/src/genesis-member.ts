import { readAppConfig, shouldUseDevFixtures, isTestLaunchMode } from './app-config.js';
import { resolveNamiAdminRole } from './nami-capabilities.js';
import { readMemberSession } from './member-session-store.js';
import { readDemoOwner } from './protocol-env.js';
import { getZkLoginSession } from './zklogin.js';
import type { NamiMember } from './uiMockData.js';

const SELF_MEMBER_ID = 'm1';

function readConnectedOwner(): string | null {
  return getZkLoginSession()?.address ?? readDemoOwner();
}

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
  const owner = readConnectedOwner();
  const isBoss = resolveNamiAdminRole(owner) === 'official-owner';

  return {
    ...member,
    tier: 'NPC',
    signal: 'Green',
    name: session?.displayName?.trim() || member.name,
    badge: session?.flavorBadgeId?.trim() || member.badge,
    isNamiBoss: isBoss ? true : undefined,
    isNamiTeam: isBoss ? undefined : member.isNamiTeam,
  };
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