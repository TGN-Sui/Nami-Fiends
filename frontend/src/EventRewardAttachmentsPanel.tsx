import { useState, type ReactElement } from 'react';

import {
  eventRewardConditionSummary,
  eventRewardDetailsHiddenFromViewer,
  eventRewardPublicSummary,
  eventRewardRequiresGamerLockIn,
  eventRewardSealedStatusLabel,
  type EventRewardAttachment,
} from './event-reward-attachments.js';
import { sealEventRewardAttachmentForOfficialOwner } from './event-reward-official-seal.js';
import { canAttachEventRewards, type StoredEvent } from './events-store.js';
import { isOfficialOwner } from './nami-capabilities.js';
import {
  buildEventRewardEscrowPlaintext,
  eventRewardLockInBody,
  eventRewardSealedHeadline,
} from './reward-lock-in.js';
import {
  readEventRewardEscrowEvidenceId,
  saveEventRewardEscrowEvidenceId,
} from './reward-escrow-store.js';
import {
  sealEvidencePacket,
  sealPrivacyErrorMessage,
  SealPrivacyApiError,
} from './seal-privacy-api.js';
import { useProtocolOwner } from './wallet.js';

function EventRewardListItem(props: {
  event: StoredEvent;
  attachment: EventRewardAttachment;
  viewerIsOfficialOwner: boolean;
  viewerCanManageEventRewards: boolean;
  owner: string | null;
  officialSealWorkingId: string | null;
  onOfficialSealStart: (attachmentId: string) => void;
  onOfficialSealComplete: (updated: StoredEvent | null) => void;
  onOfficialSealError: (message: string) => void;
  onOfficialSealFinally: () => void;
}): ReactElement {
  const [showConditionDetails, setShowConditionDetails] = useState(false);
  const [lockInWorking, setLockInWorking] = useState(false);
  const [lockInError, setLockInError] = useState<string | null>(null);
  const [memberEscrowEvidenceId, setMemberEscrowEvidenceId] = useState<string | null>(() => {
    if (!props.owner) {
      return null;
    }

    return readEventRewardEscrowEvidenceId(props.event.id, props.attachment.id, props.owner);
  });

  const detailsHidden = eventRewardDetailsHiddenFromViewer(props.attachment, {
    viewerIsOfficialOwner: props.viewerIsOfficialOwner,
    viewerCanManageEventRewards: props.viewerCanManageEventRewards,
  });
  const needsLockIn = props.owner
    ? eventRewardRequiresGamerLockIn(props.attachment, memberEscrowEvidenceId)
    : false;

  async function handleLockIn(): Promise<void> {
    const ownerAddress = props.owner;

    if (!ownerAddress) {
      return;
    }

    setLockInWorking(true);
    setLockInError(null);

    try {
      const sealed = await sealEvidencePacket({
        owner: ownerAddress,
        policy: 'reward_escrow',
        plaintext: buildEventRewardEscrowPlaintext({
          eventId: props.event.id,
          attachment: props.attachment,
          owner: ownerAddress,
        }),
        relatedId: props.event.id,
      });

      saveEventRewardEscrowEvidenceId(
        props.event.id,
        props.attachment.id,
        ownerAddress,
        sealed.id
      );
      setMemberEscrowEvidenceId(sealed.id);
    } catch (error: unknown) {
      setLockInError(
        error instanceof SealPrivacyApiError
          ? sealPrivacyErrorMessage(error.code)
          : error instanceof Error
            ? error.message
            : 'Could not lock in this sealed reward.'
      );
    } finally {
      setLockInWorking(false);
    }
  }

  if (detailsHidden) {
    return (
      <li className="protocol-timeline-item event-reward-sealed-item">
        <div className="event-reward-sealed-header">
          <span className="mini-badge">{eventRewardSealedStatusLabel()}</span>
          <strong>{eventRewardSealedHeadline()}</strong>
        </div>
        <p className="protocol-hint">Reward details are private until the unlock condition is met.</p>

        <button
          aria-expanded={showConditionDetails}
          className="secondary-action event-reward-condition-toggle"
          onClick={() => setShowConditionDetails((value) => !value)}
          type="button"
        >
          {showConditionDetails ? 'Hide condition details' : 'Show condition details'}
        </button>

        {showConditionDetails ? (
          <p className="protocol-hint event-reward-condition-details">
            {eventRewardConditionSummary(props.attachment, props.event.title)}
          </p>
        ) : null}

        {needsLockIn ? (
          <div className="event-reward-sealed-actions">
            <p className="protocol-hint">{eventRewardLockInBody()}</p>
            <button disabled={lockInWorking} onClick={() => void handleLockIn()} type="button">
              {lockInWorking ? 'Locking in…' : 'Lock in my claim'}
            </button>
          </div>
        ) : memberEscrowEvidenceId ? (
          <p className="protocol-hint">Your claim is locked in.</p>
        ) : null}

        {lockInError ? <p className="protocol-hint">{lockInError}</p> : null}
      </li>
    );
  }

  return (
    <li className="protocol-timeline-item">
      <strong>{props.attachment.label}</strong>
      <p>
        {props.attachment.kind}
        {props.attachment.sealRequired ? ' · sealed until condition met' : ''}
      </p>
      <p className="protocol-hint">{eventRewardPublicSummary(props.attachment)}</p>
      {props.attachment.sealedEvidenceId ? (
        <p className="protocol-hint">
          Official seal: <code>{props.attachment.sealedEvidenceId}</code>
        </p>
      ) : props.attachment.sealRequired ? (
        <>
          <p className="protocol-hint">Waiting for Nami owner to seal this cosmetic/badge reward.</p>
          {props.viewerIsOfficialOwner ? (
            <button
              disabled={props.officialSealWorkingId === props.attachment.id}
              onClick={() => {
                if (!props.owner) {
                  return;
                }

                props.onOfficialSealStart(props.attachment.id);

                void sealEventRewardAttachmentForOfficialOwner({
                  event: props.event,
                  attachment: props.attachment,
                  officialOwner: props.owner,
                })
                  .then((updated) => {
                    props.onOfficialSealComplete(updated);
                  })
                  .catch((error: unknown) => {
                    props.onOfficialSealError(
                      error instanceof Error ? error.message : 'Could not seal this event reward.'
                    );
                  })
                  .finally(() => {
                    props.onOfficialSealFinally();
                  });
              }}
              type="button"
            >
              {props.officialSealWorkingId === props.attachment.id
                ? 'Sealing…'
                : 'Seal reward (Nami owner)'}
            </button>
          ) : null}
        </>
      ) : null}
    </li>
  );
}

export function EventRewardAttachmentsPanel(props: {
  event: StoredEvent;
  onEventUpdated?: (event: StoredEvent) => void;
}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const rewards = props.event.rewards ?? [];
  const [officialSealError, setOfficialSealError] = useState<string | null>(null);
  const [officialSealWorkingId, setOfficialSealWorkingId] = useState<string | null>(null);
  const viewerIsOfficialOwner = isOfficialOwner(owner);
  const viewerCanManageEventRewards = canAttachEventRewards(props.event);

  if (rewards.length === 0) {
    return null;
  }

  return (
    <section className="panel event-reward-attachments-panel">
      <div className="profile-panel-heading">
        <h2>Event rewards</h2>
        <p>
          Rewards attached by the event host. Description, link, Move Object, and NFT rewards are
          public. Sealed cosmetics and badges show as &quot;Reward Sealed&quot; until conditions are
          met.
        </p>
      </div>

      <ul className="protocol-timeline-list">
        {rewards.map((attachment) => (
          <EventRewardListItem
            attachment={attachment}
            event={props.event}
            key={attachment.id}
            officialSealWorkingId={officialSealWorkingId}
            onOfficialSealComplete={(updated) => {
              if (updated) {
                props.onEventUpdated?.(updated);
              }
            }}
            onOfficialSealError={setOfficialSealError}
            onOfficialSealFinally={() => {
              setOfficialSealWorkingId(null);
            }}
            onOfficialSealStart={setOfficialSealWorkingId}
            owner={owner}
            viewerCanManageEventRewards={viewerCanManageEventRewards}
            viewerIsOfficialOwner={viewerIsOfficialOwner}
          />
        ))}
      </ul>

      {officialSealError ? <p className="protocol-hint">{officialSealError}</p> : null}
    </section>
  );
}