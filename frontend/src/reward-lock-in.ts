import type { EventRewardAttachment } from './event-reward-attachments.js';
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
  rewardKind: 'chat-overlay' | 'event-badge' | 'event-cosmetic' | 'gift';
  owner: string;
  eventId?: string;
  eventRewardAttachmentId?: string;
  condition: RewardEscrowCondition;
  transferable: boolean;
  lockedAtMs: number;
};

export function buildEventRewardEscrowPlaintext(input: {
  eventId: string;
  attachment: EventRewardAttachment;
  owner: string;
}): string {
  const payload: RewardEscrowPayload = {
    version: 1,
    rewardId: input.attachment.catalogRef ?? input.attachment.id,
    rewardName: input.attachment.label,
    rewardKind: input.attachment.kind === 'badge' ? 'event-badge' : 'event-cosmetic',
    owner: input.owner,
    eventId: input.eventId,
    eventRewardAttachmentId: input.attachment.id,
    condition: input.attachment.unlockCondition,
    transferable: true,
    lockedAtMs: Date.now(),
  };

  return JSON.stringify(payload, null, 2);
}

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

export function eventRewardSealedHeadline(): string {
  return 'Reward Sealed';
}

export function eventRewardLockInHeadline(_rewardName: string): string {
  return eventRewardSealedHeadline();
}

export function rewardLockInBody(): string {
  return 'Your reward stays sealed on Nami until its unlock condition is met. You can gift it to another member later if you change your mind.';
}

export function eventRewardLockInBody(): string {
  return 'Details stay private until you choose to view the unlock condition. You can lock in your claim now and gift it later if you change your mind.';
}