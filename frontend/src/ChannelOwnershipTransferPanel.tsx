import { useCallback, useEffect, useState, type ReactElement } from 'react';

import {
  cancelChannelOwnershipTransfer,
  createChannelOwnershipTransfer,
  isChannelTransferApiAvailable,
  type ChannelOwnershipTransfer,
  type ChannelTransferTargetKind,
} from './channel-transfer-api.js';
import { hydrateOfficialsSubmissionsFromServer } from './officials-submissions-sync.js';
import {
  deleteOwnerProvisionedChannel,
  ownerProvisionedChannelById,
} from './owner-provisioned-channels-store.js';
import { useProtocolOwner } from './wallet.js';
import type { NamiChannel } from './uiMockData.js';

export function ChannelOwnershipTransferPanel(props: { channel: NamiChannel }): ReactElement {
  const { owner } = useProtocolOwner();
  const provisioned = ownerProvisionedChannelById(props.channel.id);
  const [targetKind, setTargetKind] = useState<ChannelTransferTargetKind>('email');
  const [targetEmail, setTargetEmail] = useState('');
  const [targetWallet, setTargetWallet] = useState('');
  const [targetXHandle, setTargetXHandle] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingTransferId, setPendingTransferId] = useState(
    provisioned?.pendingTransferId ?? ''
  );

  useEffect(() => {
    setPendingTransferId(provisioned?.pendingTransferId ?? '');
  }, [provisioned?.pendingTransferId, provisioned?.status]);

  const canTransfer = Boolean(
    provisioned &&
      provisioned.status !== 'claimed' &&
      provisioned.status !== 'transfer-pending' &&
      owner &&
      provisioned.createdByOwner.toLowerCase() === owner.toLowerCase()
  );

  const handleRelinquish = useCallback(async () => {
    if (!isChannelTransferApiAvailable()) {
      setError('Channel transfer API is offline. Set VITE_NAMI_INDEXER_URL.');
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const transferInput: Parameters<typeof createChannelOwnershipTransfer>[0] = {
        channelId: props.channel.id,
        targetKind,
      };

      if (targetKind === 'email') {
        transferInput.targetEmail = targetEmail;
      } else if (targetKind === 'wallet') {
        transferInput.targetWallet = targetWallet;
      } else {
        transferInput.targetXHandle = targetXHandle;
      }

      const transfer = await createChannelOwnershipTransfer(transferInput);

      await hydrateOfficialsSubmissionsFromServer();
      setPendingTransferId(transfer.id);
      setNotice(
        targetKind === 'email'
          ? 'Transfer invite queued. The recipient will receive an email after Resend is configured on Render.'
          : 'Private transfer created. The recipient will see it after signing in.'
      );
    } catch (transferError) {
      setError(
        transferError instanceof Error ? transferError.message : 'Could not create transfer.'
      );
    } finally {
      setBusy(false);
    }
  }, [props.channel.id, targetEmail, targetKind, targetWallet, targetXHandle]);

  const handleCancelTransfer = useCallback(async () => {
    if (!pendingTransferId) {
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await cancelChannelOwnershipTransfer(pendingTransferId);
      await hydrateOfficialsSubmissionsFromServer();
      setPendingTransferId('');
      setNotice('Ownership transfer cancelled.');
    } catch (transferError) {
      setError(
        transferError instanceof Error ? transferError.message : 'Could not cancel transfer.'
      );
    } finally {
      setBusy(false);
    }
  }, [pendingTransferId]);

  const handleDeleteChannel = useCallback(() => {
    const result = deleteOwnerProvisionedChannel(props.channel.id, owner);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    void hydrateOfficialsSubmissionsFromServer();
    setNotice(result.message);
  }, [owner, props.channel.id]);

  if (!provisioned) {
    return (
      <article className="panel channel-ownership-transfer-panel">
        <p className="protocol-hint">This channel is not owner-provisioned.</p>
      </article>
    );
  }

  return (
    <article className="panel channel-ownership-transfer-panel">
      <div className="profile-panel-heading">
        <h3>Transfer ownership</h3>
        <p>
          Privately relinquish this channel to one recipient. Only they can accept — the public
          claim button is hidden while a transfer is pending.
        </p>
      </div>

      {provisioned.status === 'transfer-pending' || pendingTransferId ? (
        <div className="channel-transfer-pending-state">
          <p className="protocol-hint">
            Transfer pending for <strong>{provisioned.gameTitle}</strong>. Only the designated
            recipient can accept after signing in.
          </p>
          {owner?.toLowerCase() === provisioned.createdByOwner.toLowerCase() ? (
            <button
              className="nami-surface-button"
              disabled={busy}
              onClick={() => void handleCancelTransfer()}
              type="button"
            >
              Cancel transfer
            </button>
          ) : null}
        </div>
      ) : canTransfer ? (
        <div className="channel-transfer-form">
          <label className="onboarding-field">
            <span>Recipient type</span>
            <select
              onChange={(event) => setTargetKind(event.target.value as ChannelTransferTargetKind)}
              value={targetKind}
            >
              <option value="email">Email</option>
              <option value="wallet">Wallet address</option>
              <option value="x">X account</option>
            </select>
          </label>

          {targetKind === 'email' ? (
            <label className="onboarding-field">
              <span>Recipient email</span>
              <input
                onChange={(event) => setTargetEmail(event.target.value)}
                placeholder="studio@example.com"
                type="email"
                value={targetEmail}
              />
            </label>
          ) : null}

          {targetKind === 'wallet' ? (
            <label className="onboarding-field">
              <span>Recipient wallet (0x…)</span>
              <input
                onChange={(event) => setTargetWallet(event.target.value)}
                placeholder="0x..."
                type="text"
                value={targetWallet}
              />
            </label>
          ) : null}

          {targetKind === 'x' ? (
            <label className="onboarding-field">
              <span>Recipient X handle</span>
              <input
                onChange={(event) => setTargetXHandle(event.target.value)}
                placeholder="studiohandle"
                type="text"
                value={targetXHandle}
              />
            </label>
          ) : null}

          <button
            className="nami-surface-button is-primary-surface-button"
            disabled={busy}
            onClick={() => void handleRelinquish()}
            type="button"
          >
            Relinquish ownership
          </button>
        </div>
      ) : (
        <p className="protocol-hint">
          {provisioned.status === 'claimed'
            ? 'This channel has already been claimed.'
            : 'Only the current owner can start a private transfer.'}
        </p>
      )}

      {owner &&
      (owner.toLowerCase() === provisioned.createdByOwner.toLowerCase() ||
        owner.toLowerCase() === provisioned.claimedByWallet?.toLowerCase()) ? (
        <div className="channel-transfer-danger-zone">
          <button
            className="nami-surface-button is-danger-surface-button"
            disabled={busy || provisioned.status === 'transfer-pending'}
            onClick={handleDeleteChannel}
            type="button"
          >
            Delete channel for all testers
          </button>
        </div>
      ) : null}

      {error ? <p className="onboarding-field-error">{error}</p> : null}
      {notice ? <p className="protocol-hint nami-owner-action-notice">{notice}</p> : null}
    </article>
  );
}