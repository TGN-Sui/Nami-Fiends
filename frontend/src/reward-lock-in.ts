import type { OfficialChatOverlayReward } from './official-chat-overlay-rewards-store.js';

export type RewardEscrowCondition =
  | { type: 'event-attendance'; eventId: string }
  | { type: 'tier-min'; tier: 'Adventurer' | 'Pro' | 'Elite' }
  | { type: 'verified' }
  | { type: 'official-grant'; memberIds: string[] }
  | { type: 'manual-release' };

export type RewardEscrowPayload = {
  version: 1;
  rewardId: string;
  rewardName: string;
  rewardKind: 'chat-overlay' | 'event-badge' | 'gift';
  owner: string;
  condition: RewardEscrowCondition;
  transferable: boolean;
  lockedAtMs: number;
};

export function buildRewardEscrowPlaintext(input: {
  reward: Pick<OfficialChatOverlayReward, 'id' | 'name' | 'condition'>;
  owner: string;
  rewardKind?: RewardEscrowPayload['rewardKind'];
  transferable?: boolean;
}): string {
  const payload: RewardEscrowPayload = {
    version: 1,
    rewardId: input.reward.id,
    rewardName: input.reward.name,
    rewardKind: input.rewardKind ?? 'chat-overlay',
    owner: input.owner,
    condition: mapRewardCondition(input.reward.condition),
    transferable: input.transferable ?? true,
    lockedAtMs: Date.now(),
  };

  return JSON.stringify(payload, null, 2);
}

function mapRewardCondition(
  condition: OfficialChatOverlayReward['condition']
): RewardEscrowCondition {
  if (condition.type === 'verified') {
    return { type: 'verified' };
  }

  if (condition.type === 'tier-min') {
    return { type: 'tier-min', tier: condition.tier };
  }

  return {
    type: 'official-grant',
    memberIds: [...condition.memberIds],
  };
}

export function parseRewardEscrowPlaintext(plaintext: string): RewardEscrowPayload | null {
  try {
    const parsed = JSON.parse(plaintext) as RewardEscrowPayload;

    if (parsed?.version !== 1 || typeof parsed.rewardId !== 'string') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function rewardLockInHeadline(rewardName: string): string {
  return `Lock in ${rewardName}?`;
}

export function rewardLockInBody(): string {
  return 'Your reward stays sealed on Nami until its unlock condition is met. You can gift it to another member later if you change your mind.';
}