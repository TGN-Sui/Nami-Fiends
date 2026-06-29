/** Reward kinds hosts may attach when creating an event (Nami / game / guild owners). */
export type EventRewardKind =
  | 'description'
  | 'link'
  | 'move-object'
  | 'nft'
  | 'cosmetic'
  | 'badge';

export type EventRewardUnlockCondition =
  | { type: 'event-attendance'; eventId: string }
  | { type: 'manual-release' };

export type EventRewardAttachment = {
  id: string;
  kind: EventRewardKind;
  label: string;
  description?: string;
  linkUrl?: string;
  objectId?: string;
  /** Cosmetic catalog id or badge code when kind is cosmetic/badge. */
  catalogRef?: string;
  /** Only cosmetic/badge event rewards are sealed by Nami owner until condition is met. */
  sealRequired: boolean;
  unlockCondition: EventRewardUnlockCondition;
  /** Set after Nami official owner seals this attachment on the receiving server. */
  sealedEvidenceId?: string | null;
};

export const NAMI_OWNER_SEALABLE_EVENT_REWARD_KINDS: ReadonlySet<EventRewardKind> = new Set([
  'cosmetic',
  'badge',
]);

export function eventRewardKindRequiresNamiSeal(kind: EventRewardKind): boolean {
  return NAMI_OWNER_SEALABLE_EVENT_REWARD_KINDS.has(kind);
}

export function normalizeEventRewardAttachment(
  input: Partial<EventRewardAttachment> & Pick<EventRewardAttachment, 'kind' | 'label'>,
  eventId: string
): EventRewardAttachment {
  const sealRequired = eventRewardKindRequiresNamiSeal(input.kind);

  const attachment: EventRewardAttachment = {
    id: input.id?.trim() || `event-reward-${eventId}-${Date.now()}`,
    kind: input.kind,
    label: input.label.trim(),
    sealRequired,
    unlockCondition: input.unlockCondition ?? { type: 'event-attendance', eventId },
    sealedEvidenceId: input.sealedEvidenceId ?? null,
  };

  const description = input.description?.trim();
  const linkUrl = input.linkUrl?.trim();
  const objectId = input.objectId?.trim();
  const catalogRef = input.catalogRef?.trim();

  if (description) {
    attachment.description = description;
  }

  if (linkUrl) {
    attachment.linkUrl = linkUrl;
  }

  if (objectId) {
    attachment.objectId = objectId;
  }

  if (catalogRef) {
    attachment.catalogRef = catalogRef;
  }

  return attachment;
}

export function eventRewardIsOfficiallySealed(attachment: EventRewardAttachment): boolean {
  return attachment.sealRequired && Boolean(attachment.sealedEvidenceId);
}

/** Hide cosmetic/badge specifics from gamers once the Nami owner has sealed the attachment. */
export function eventRewardDetailsHiddenFromViewer(
  attachment: EventRewardAttachment,
  options: {
    viewerIsOfficialOwner: boolean;
    viewerCanManageEventRewards: boolean;
  }
): boolean {
  if (!eventRewardIsOfficiallySealed(attachment)) {
    return false;
  }

  if (options.viewerIsOfficialOwner || options.viewerCanManageEventRewards) {
    return false;
  }

  return true;
}

export function eventRewardSealedStatusLabel(): string {
  return 'Reward Sealed';
}

export function eventRewardConditionSummary(
  attachment: EventRewardAttachment,
  eventTitle?: string
): string {
  if (attachment.unlockCondition.type === 'manual-release') {
    return 'Unlocks when the host manually releases this reward.';
  }

  if (eventTitle) {
    return `Unlocks when you meet attendance for "${eventTitle}".`;
  }

  return 'Unlocks when you meet the event attendance requirement.';
}

export function eventRewardRequiresGamerLockIn(
  attachment: EventRewardAttachment,
  memberEscrowEvidenceId: string | null
): boolean {
  if (!attachment.sealRequired) {
    return false;
  }

  if (!attachment.sealedEvidenceId) {
    return false;
  }

  return !memberEscrowEvidenceId;
}

export function eventRewardPublicSummary(attachment: EventRewardAttachment): string {
  if (attachment.kind === 'link' && attachment.linkUrl) {
    return attachment.linkUrl;
  }

  if ((attachment.kind === 'move-object' || attachment.kind === 'nft') && attachment.objectId) {
    return attachment.objectId;
  }

  return attachment.description ?? attachment.label;
}