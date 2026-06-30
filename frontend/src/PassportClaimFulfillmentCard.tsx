import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useEffect, useState, type ReactElement } from 'react';

import { resolveOnchainAvatarRef } from './onchain-avatar-ref.js';
import { buildEnterNamiTransaction } from './onboarding-tx.js';
import { useMemberSession } from './member-session-store.js';
import { useNamiAdminStore } from './nami-admin-store.js';
import { getConfiguredPackageId, hasConfiguredPackageId } from './nami.js';
import { readNodenameRegistryId } from './protocol-env.js';
import {
  completePassportFulfillment,
  fetchPassportFulfillmentForClaim,
  fetchPendingPassportFulfillmentForEmail,
  isPassportFulfillmentApiAvailable,
  type PassportFulfillment,
} from './passport-fulfillment-api.js';
import { useProtocolOwner } from './wallet.js';

export function PassportClaimFulfillmentCard(): ReactElement | null {
  const session = useMemberSession();
  const { owner } = useProtocolOwner();
  const { userClaimStatus } = useNamiAdminStore();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [fulfillment, setFulfillment] = useState<PassportFulfillment | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const claimApproved = userClaimStatus.status === 'approved';

  useEffect(() => {
    if (!claimApproved || !isPassportFulfillmentApiAvailable()) {
      setFulfillment(null);
      return;
    }

    const claimId = userClaimStatus.claimId;
    const email = session?.email;

    void (async () => {
      if (claimId) {
        const byClaim = await fetchPassportFulfillmentForClaim(claimId);
        if (byClaim) {
          setFulfillment(byClaim);
          return;
        }
      }

      if (email) {
        setFulfillment(await fetchPendingPassportFulfillmentForEmail(email));
      }
    })().catch(() => setFulfillment(null));
  }, [claimApproved, session?.email, userClaimStatus.claimId]);

  if (!claimApproved) {
    return null;
  }

  async function handleMintPassport(): Promise<void> {
    if (!session || !owner?.startsWith('0x') || !fulfillment) {
      setError('Connect a wallet before minting your passport on-chain.');
      return;
    }

    if (!hasConfiguredPackageId()) {
      setError('Configure VITE_NAMI_PACKAGE_ID before on-chain minting.');
      return;
    }

    const nodenameRegistryId = readNodenameRegistryId();

    if (!nodenameRegistryId) {
      setError('Configure VITE_NAMI_NODENAME_REGISTRY_ID before on-chain minting.');
      return;
    }

    setLoading(true);
    setNotice(null);
    setError(null);

    try {
      const tx = buildEnterNamiTransaction(getConfiguredPackageId(), {
        nodename: fulfillment.nodename,
        archetype: fulfillment.archetype,
        avatarRef: resolveOnchainAvatarRef(),
        nodenameRegistryId,
      });
      const result = await signAndExecute({ transaction: tx });
      await completePassportFulfillment(fulfillment.id, result.digest, owner);
      setNotice('Passport mint submitted on-chain. Badge book access is unlocked.');
      setFulfillment({ ...fulfillment, status: 'completed', onchainTxDigest: result.digest });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Passport mint failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="panel passport-claim-fulfillment-card">
      <div className="profile-panel-heading">
        <h3>Passport approved</h3>
        <p>
          Your nodename <strong>@{userClaimStatus.nodename}</strong> was approved. One signature
          anchors your immutable handle, archetype, avatar snapshot, and onboarding badge.
          XP, tier, conduct, and display copy stay off-chain for a frictionless web2-style UX.
        </p>
      </div>

      {fulfillment ? (
        <div className="passport-claim-status-strip">
          <div>
            <span>Preferred name (off-chain)</span>
            <strong>{fulfillment.preferredName}</strong>
          </div>
          <div>
            <span>SuiNS subname</span>
            <strong>{fulfillment.suinsSubname}</strong>
          </div>
          <div>
            <span>Provisioning</span>
            <strong>{fulfillment.suinsStatus.replaceAll('_', ' ')}</strong>
          </div>
        </div>
      ) : null}

      {fulfillment?.status === 'completed' ? (
        <p className="protocol-hint">On-chain passport mint complete.</p>
      ) : (
        <button
          className="onboarding-primary-btn"
          disabled={loading || !owner?.startsWith('0x')}
          onClick={() => void handleMintPassport()}
          type="button"
        >
          {loading ? 'Signing mint…' : 'Mint passport on-chain'}
        </button>
      )}

      {!owner?.startsWith('0x') ? (
        <p className="protocol-hint">Connect zkLogin or a wallet to finish the on-chain mint.</p>
      ) : null}
      {notice ? <p className="protocol-hint">{notice}</p> : null}
      {error ? <p className="onboarding-field-error">{error}</p> : null}
    </article>
  );
}