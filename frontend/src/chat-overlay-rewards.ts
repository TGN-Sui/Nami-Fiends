import { isMemberVerified } from './member-access.js';
import {
  readOfficialChatOverlayRewards,
  type OfficialChatOverlayReward,
} from './official-chat-overlay-rewards-store.js';
import { readSelfProfileEdits } from './member-profile-store.js';
import { isSelfMember } from './surface-preferences.js';
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
  slot: OfficialChatOverlayReward['slot'];
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
  if (!isSelfMember(memberId)) {
    return '';
  }

  return readSelfProfileEdits().chatOverlayDisplay.trim();
}

export function overlayRewardClassName(reward: OfficialChatOverlayReward): string {
  return [
    'chat-overlay-padding',
    'chat-overlay-slot-' + reward.slot,
    'chat-overlay-motion-' + reward.motion,
    'chat-overlay-accent-' + reward.accent,
  ].join(' ');
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
    : unlocked[0];

  if (!equipped) {
    return null;
  }

  return {
    rewardId: equipped.id,
    name: equipped.name,
    slot: equipped.slot,
    motion: equipped.motion,
    className: overlayRewardClassName(equipped),
  };
}