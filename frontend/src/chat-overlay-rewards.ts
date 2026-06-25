import { isMemberVerified } from './member-access.js';
import {
  readOfficialChatOverlayRewards,
  type OfficialChatOverlayReward,
} from './official-chat-overlay-rewards-store.js';
import { readEquippedChatOverlayIdForMember } from './member-cosmetic-equips-store.js';
import type { NamiMember } from './uiMockData.js';

const TIER_RANK: Record<NamiMember['tier'], number> = {
  NPC: 0,
  Adventurer: 1,
  Pro: 2,
  Elite: 3,
};

export type ResolvedChatOverlay = {
  rewardId: string;
  name: string;
  borderStyle: OfficialChatOverlayReward['borderStyle'];
  motion: OfficialChatOverlayReward['motion'];
  className: string;
};

function meetsTierMinimum(member: NamiMember, tier: 'Adventurer' | 'Pro' | 'Elite'): boolean {
  return TIER_RANK[member.tier] >= TIER_RANK[tier];
}

export function overlayRewardUnlockedForMember(
  member: NamiMember,
  reward: OfficialChatOverlayReward
): boolean {
  if (!reward.enabled || member.signal === 'Black') {
    return false;
  }

  if (reward.condition.type === 'verified') {
    return isMemberVerified(member);
  }

  if (reward.condition.type === 'tier-min') {
    return meetsTierMinimum(member, reward.condition.tier);
  }

  return reward.condition.memberIds.includes(member.id);
}

export function unlockedChatOverlayRewardsForMember(
  member: NamiMember,
  catalog: readonly OfficialChatOverlayReward[] = readOfficialChatOverlayRewards()
): OfficialChatOverlayReward[] {
  return catalog.filter((reward) => overlayRewardUnlockedForMember(member, reward));
}

export function readEquippedChatOverlayId(memberId: string): string {
  return readEquippedChatOverlayIdForMember(memberId);
}

export function overlayRewardClassName(reward: OfficialChatOverlayReward): string {
  return [
    'has-chat-overlay-border',
    'chat-overlay-border-' + reward.borderStyle,
    reward.motion === 'premium-loop' ? 'chat-overlay-motion-premium-loop' : '',
    'chat-overlay-accent-' + reward.accent,
  ]
    .filter(Boolean)
    .join(' ');
}

export function resolveEquippedChatOverlayReward(
  member: NamiMember | undefined,
  catalog: readonly OfficialChatOverlayReward[] = readOfficialChatOverlayRewards()
): OfficialChatOverlayReward | null {
  const resolved = resolveChatOverlayForMember(member, catalog);

  if (!resolved) {
    return null;
  }

  return catalog.find((reward) => reward.id === resolved.rewardId) ?? null;
}

export function resolveChatOverlayForMember(
  member: NamiMember | undefined,
  catalog: readonly OfficialChatOverlayReward[] = readOfficialChatOverlayRewards()
): ResolvedChatOverlay | null {
  if (!member) {
    return null;
  }

  const unlocked = unlockedChatOverlayRewardsForMember(member, catalog);
  const equippedId = readEquippedChatOverlayId(member.id);
  const equipped = equippedId
    ? unlocked.find((reward) => reward.id === equippedId)
    : null;

  if (!equipped) {
    return null;
  }

  return {
    rewardId: equipped.id,
    name: equipped.name,
    borderStyle: equipped.borderStyle,
    motion: equipped.motion,
    className: overlayRewardClassName(equipped),
  };
}