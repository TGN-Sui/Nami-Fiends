import { useCallback, useEffect, useState, type ReactElement } from 'react';

import {
  fetchPendingChannelTransfers,
  isChannelTransferApiAvailable,
  respondToChannelTransfer,
  type ChannelOwnershipTransfer,
} from './channel-transfer-api.js';
import { completeChannelTransferHandover } from './channel-transfer-handover.js';
import { readWalletAuthOwner } from './wallet-auth.js';
import { useProtocolOwner } from './wallet.js';

export function ChannelTransferClaimModal(): ReactElement | null {
  const { owner } = useProtocolOwner();
  const [transfer, setTransfer] = useState<ChannelOwnershipTransfer | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadPending = useCallback(async () => {
    if (!isChannelTransferApiAvailable()) {
      return;
    }

    const owner = readWalletAuthOwner();

    if (!owner?.startsWith('0x')) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const transferId = params.get('transfer') ?? undefined;

    try {
      const transfers = await fetchPendingChannelTransfers(
        transferId ? { transferId } : undefined
      );
      const next = transfers[0] ?? null;

      if (next && next.id !== dismissedId) {
        setTransfer(next);
      }
    } catch {
      // Recipient-only endpoint — ignore when unauthenticated or no match.
    }
  }, [dismissedId]);

  useEffect(() => {
    void loadPending();
  }, [loadPending, owner]);

  const respond = useCallback(
    async (decision: 'accept' | 'decline') => {
      if (!transfer) {
        return;
      }

      setBusy(true);
      setError(null);

      try {
        const result = await respondToChannelTransfer({
          transferId: transfer.id,
          decision,
        });

        if (decision === 'accept') {
          const owner = readWalletAuthOwner();

          if (owner) {
            await completeChannelTransferHandover(result, owner);
          }
        }

        setDismissedId(transfer.id);
        setTransfer(null);

        const url = new URL(window.location.href);
        url.searchParams.delete('transfer');
        window.history.replaceState({}, '', url.toString());
      } catch (respondError) {
        setError(
          respondError instanceof Error ? respondError.message : 'Could not respond to transfer.'
        );
      } finally {
        setBusy(false);
      }
    },
    [transfer]
  );

  if (!transfer) {
    return null;
  }

  return (
    <div className="channel-transfer-claim-overlay" role="dialog">
      <article className="channel-transfer-claim-modal panel">
        <h2>Accept channel ownership?</h2>
        <p>
          You were privately invited to own <strong>{transfer.gameTitle}</strong> (@
          {transfer.channelHandle}). This invite is visible only to you.
        </p>
        <div className="channel-transfer-claim-actions">
          <button
            className="nami-surface-button is-primary-surface-button"
            disabled={busy}
            onClick={() => void respond('accept')}
            type="button"
          >
            Accept ownership
          </button>
          <button
            className="nami-surface-button"
            disabled={busy}
            onClick={() => void respond('decline')}
            type="button"
          >
            Decline
          </button>
        </div>
        {error ? <p className="onboarding-field-error">{error}</p> : null}
      </article>
    </div>
  );
}