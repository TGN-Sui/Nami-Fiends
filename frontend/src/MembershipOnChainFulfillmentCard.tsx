import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { loadMembershipProtocolView } from '@nami/sdk';
import { useEffect, useState, type ReactElement } from 'react';

import { buildMembershipAdminUpgradeTransaction } from './membership-admin-tx.js';
import {
  completeMembershipFulfillment,
  fetchPendingFulfillmentForOwner,
  isMembershipFulfillmentApiAvailable,
  type MembershipFulfillment,
} from './membership-fulfillment-api.js';
import { createConfiguredNamiClient, getConfiguredPackageId, hasConfiguredPackageId } from './nami.js';
import { readAdminCapId } from './protocol-env.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { useProtocolOwner } from './wallet.js';

export function MembershipOnChainFulfillmentCard(): ReactElement | null {
  const { owner } = useProtocolOwner();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [fulfillment, setFulfillment] = useState<MembershipFulfillment | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adminCapId = readAdminCapId();
  const canSelfFulfill =
    isOfficialOwner(owner) &&
    hasConfiguredPackageId() &&
    Boolean(adminCapId) &&
    isMembershipFulfillmentApiAvailable();

  useEffect(() => {
    if (!owner?.startsWith('0x') || !isMembershipFulfillmentApiAvailable()) {
      setFulfillment(null);
      return;
    }

    void fetchPendingFulfillmentForOwner(owner)
      .then(setFulfillment)
      .catch(() => setFulfillment(null));
  }, [owner]);

  if (!fulfillment) {
    return null;
  }

  async function applyOnChain(): Promise<void> {
    if (!owner?.startsWith('0x') || !adminCapId || !fulfillment) {
      return;
    }

    const chain = createConfiguredNamiClient();

    if (!chain) {
      setError('Configure VITE_NAMI_PACKAGE_ID before on-chain fulfillment.');
      return;
    }

    setLoading(true);
    setNotice(null);
    setError(null);

    try {
      const membershipView = await loadMembershipProtocolView(chain, owner);
      const passportId = membershipView.passport?.objectId;

      if (!passportId) {
        throw new Error('No owned passport found for this wallet.');
      }

      const tx = buildMembershipAdminUpgradeTransaction({
        packageId: getConfiguredPackageId(),
        adminCapId,
        passportId,
        tier: fulfillment.tier,
        expiresAtMs: fulfillment.expiresAtMs,
      });

      const result = await signAndExecute({ transaction: tx });
      await completeMembershipFulfillment(fulfillment.id, result.digest);

      setNotice('On-chain ' + fulfillment.tier + ' upgrade applied to your passport.');
      setFulfillment(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'On-chain fulfillment failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="panel membership-onchain-fulfillment-card">
      <div className="membership-access-copy">
        <span className="mini-badge">On-chain sync</span>
        <strong>{fulfillment.tier} passport upgrade queued</strong>
        <p>
          Your paid tier is active in the app.{' '}
          {canSelfFulfill
            ? 'This wallet can complete the on-chain passport upgrade now.'
            : 'An operator with AdminCap must apply the on-chain passport upgrade for this wallet.'}
        </p>
      </div>

      {canSelfFulfill ? (
        <button
          className="primary-action membership-access-upgrade-btn"
          disabled={loading}
          onClick={() => void applyOnChain()}
          type="button"
        >
          {loading ? 'Signing upgrade…' : 'Apply on-chain ' + fulfillment.tier}
        </button>
      ) : null}

      {notice ? <p className="membership-plan-notice">{notice}</p> : null}
      {error ? <p className="membership-plan-notice is-error">{error}</p> : null}
    </article>
  );
}