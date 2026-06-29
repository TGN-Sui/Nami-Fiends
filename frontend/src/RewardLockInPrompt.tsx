import { useState, type ReactElement } from 'react';

import type { OfficialChatOverlayReward } from './official-chat-overlay-rewards-store.js';
import {
  buildRewardEscrowPlaintext,
  rewardLockInBody,
  rewardLockInHeadline,
} from './reward-lock-in.js';
import {
  sealEvidencePacket,
  sealPrivacyErrorMessage,
  SealPrivacyApiError,
} from './seal-privacy-api.js';
import { useProtocolOwner } from './wallet.js';

export function RewardLockInPrompt(props: {
  reward: OfficialChatOverlayReward;
  relatedId?: string | null;
  onLocked?: (evidenceId: string) => void;
  onDismiss?: () => void;
}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const [working, setWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);

  if (!owner) {
    return null;
  }

  async function handleLockIn(): Promise<void> {
    setWorking(true);
    setErrorMessage(null);

    try {
      const sealed = await sealEvidencePacket({
        owner,
        policy: 'reward_escrow',
        plaintext: buildRewardEscrowPlaintext({
          reward: props.reward,
          owner,
        }),
        relatedId: props.relatedId ?? props.reward.id,
      });

      setEvidenceId(sealed.id);
      props.onLocked?.(sealed.id);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof SealPrivacyApiError
          ? sealPrivacyErrorMessage(error.code)
          : error instanceof Error
            ? error.message
            : 'Could not lock in this reward.'
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <article className="panel reward-lock-in-prompt">
      <div className="profile-panel-heading">
        <h3>{rewardLockInHeadline(props.reward.name)}</h3>
        <p>{rewardLockInBody()}</p>
      </div>

      {evidenceId ? (
        <p className="protocol-hint">
          Locked. Save this sealed id for your reward record: <code>{evidenceId}</code>
        </p>
      ) : (
        <div className="reward-lock-in-actions">
          <button disabled={working} onClick={() => void handleLockIn()} type="button">
            {working ? 'Locking in…' : 'Yes, lock in my reward'}
          </button>
          <button disabled={working} onClick={() => props.onDismiss?.()} type="button">
            Not now
          </button>
        </div>
      )}

      {errorMessage ? <p className="protocol-hint">{errorMessage}</p> : null}
    </article>
  );
}