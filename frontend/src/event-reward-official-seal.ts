import type { EventRewardAttachment } from './event-reward-attachments.js';
import { buildEventRewardEscrowPlaintext } from './reward-lock-in.js';
import { sealEvidencePacket } from './seal-privacy-api.js';
import { updateStoredEvent, type StoredEvent } from './events-store.js';

export async function sealEventRewardAttachmentForOfficialOwner(input: {
  event: StoredEvent;
  attachment: EventRewardAttachment;
  officialOwner: string;
}): Promise<StoredEvent | null> {
  const sealed = await sealEvidencePacket({
    owner: input.officialOwner,
    policy: 'reward_escrow',
    plaintext: buildEventRewardEscrowPlaintext({
      eventId: input.event.id,
      attachment: input.attachment,
      owner: input.officialOwner,
    }),
    relatedId: input.event.id,
  });

  const nextRewards = (input.event.rewards ?? []).map((reward) =>
    reward.id === input.attachment.id
      ? { ...reward, sealedEvidenceId: sealed.id }
      : reward
  );

  return updateStoredEvent(input.event.id, { rewards: nextRewards });
}