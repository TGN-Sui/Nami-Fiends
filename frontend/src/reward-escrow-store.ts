const EVENT_REWARD_KEY_PREFIX = 'nami.reward.escrow.event.';

function eventRewardStorageKey(eventId: string, rewardAttachmentId: string, owner: string): string {
  return `${EVENT_REWARD_KEY_PREFIX}${eventId}:${rewardAttachmentId}:${owner.toLowerCase()}`;
}

export function readEventRewardEscrowEvidenceId(
  eventId: string,
  rewardAttachmentId: string,
  owner: string
): string | null {
  try {
    return window.localStorage.getItem(eventRewardStorageKey(eventId, rewardAttachmentId, owner));
  } catch {
    return null;
  }
}

export function saveEventRewardEscrowEvidenceId(
  eventId: string,
  rewardAttachmentId: string,
  owner: string,
  evidenceId: string
): void {
  try {
    window.localStorage.setItem(
      eventRewardStorageKey(eventId, rewardAttachmentId, owner),
      evidenceId
    );
    window.dispatchEvent(
      new CustomEvent('nami-reward-escrow-changed', {
        detail: { eventId, rewardAttachmentId, owner, evidenceId },
      })
    );
  } catch {
    // Ignore quota or privacy mode errors.
  }
}