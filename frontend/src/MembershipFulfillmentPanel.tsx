import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { loadMembershipProtocolView } from '@nami/sdk';
import { useEffect, useState, type ReactElement } from 'react';

import { buildMembershipAdminUpgradeTransaction } from './membership-admin-tx.js';
import {
  completeMembershipFulfillment,
  fetchPendingMembershipFulfillments,
  isMembershipFulfillmentApiAvailable,
  type MembershipFulfillment,
} from './membership-fulfillment-api.js';
import { createConfiguredNamiClient, getConfiguredPackageId, hasConfiguredPackageId } from './nami.js';
import { readAdminCapId } from './protocol-env.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { useProtocolOwner } from './wallet.js';

function shortenAddress(value: string): string {
  if (value.length <= 14) {
    return value;
  }

  return value.slice(0, 10) + '…' + value.slice(-6);
}

export function MembershipFulfillmentPanel(): ReactElement | null {
  const { owner } = useProtocolOwner();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [fulfillments, setFulfillments] = useState<MembershipFulfillment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adminCapId = readAdminCapId();
  const canOperate =
    isOfficialOwner(owner) &&
    hasConfiguredPackageId() &&
    Boolean(adminCapId) &&
    isMembershipFulfillmentApiAvailable();

  useEffect(() => {
    if (!canOperate) {
      return;
    }

    void fetchPendingMembershipFulfillments()
      .then(setFulfillments)
      .catch(() => setFulfillments([]));
  }, [canOperate]);

  if (!canOperate) {
    return null;
  }

  async function applyOnChain(fulfillment: MembershipFulfillment): Promise<void> {
    if (!owner?.startsWith('0x') || !adminCapId) {
      return;
    }

    const chain = createConfiguredNamiClient();

    if (!chain) {
      setError('Configure VITE_NAMI_PACKAGE_ID before on-chain fulfillment.');
      return;
    }

    setActiveId(fulfillment.id);
    setLoading(true);
    setNotice(null);
    setError(null);

    try {
      const membershipView = await loadMembershipProtocolView(chain, fulfillment.owner);
      const passportId = membershipView.passport?.objectId;

      if (!passportId) {
        throw new Error('No owned passport found for ' + shortenAddress(fulfillment.owner) + '.');
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

      setNotice(
        'On-chain ' +
          fulfillment.tier +
          ' upgrade applied for subscriber ' +
          shortenAddress(fulfillment.owner) +
          '.'
      );
      setFulfillments((rows) => rows.filter((row) => row.id !== fulfillment.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'On-chain fulfillment failed.');
    } finally {
      setLoading(false);
      setActiveId(null);
    }
  }

  return (
    <article className="panel membership-fulfillment-panel">
      <div className="profile-panel-heading">
        <h2>Membership fulfillment queue</h2>
        <p>
          Paid Pro and Elite checkouts queue on-chain passport upgrades. The official owner wallet
          signs with AdminCap to apply queued upgrades to any subscriber passport on-chain.
        </p>
      </div>

      {fulfillments.length === 0 ? (
        <p className="protocol-hint">No pending on-chain membership fulfillments.</p>
      ) : (
        <ul className="membership-fulfillment-list">
          {fulfillments.map((fulfillment) => (
            <li className="membership-fulfillment-row" key={fulfillment.id}>
              <div>
                <strong>{fulfillment.tier}</strong>
                <span>{shortenAddress(fulfillment.owner)}</span>
                <span>Payment {fulfillment.paymentId.slice(0, 8)}…</span>
              </div>
              <button
                className="nami-surface-button is-primary-surface-button"
                disabled={loading}
                onClick={() => void applyOnChain(fulfillment)}
                type="button"
              >
                {activeId === fulfillment.id ? 'Signing…' : 'Apply on-chain'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {notice ? <p className="membership-plan-notice">{notice}</p> : null}
      {error ? <p className="membership-plan-notice is-error">{error}</p> : null}
    </article>
  );
}