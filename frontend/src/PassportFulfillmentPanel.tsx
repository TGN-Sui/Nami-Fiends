import { useEffect, useState, type ReactElement } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';
import {
  fetchPendingPassportFulfillments,
  isPassportFulfillmentApiAvailable,
  retryPassportSuinsProvision,
  type PassportFulfillment,
} from './passport-fulfillment-api.js';
import { useProtocolOwner } from './wallet.js';

function shortenAddress(value: string): string {
  if (value.length <= 14) {
    return value;
  }

  return value.slice(0, 10) + '…' + value.slice(-6);
}

export function PassportFulfillmentPanel(): ReactElement | null {
  const { owner } = useProtocolOwner();
  const [fulfillments, setFulfillments] = useState<PassportFulfillment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canOperate = isOfficialOwner(owner) && isPassportFulfillmentApiAvailable();

  useEffect(() => {
    if (!canOperate) {
      return;
    }

    void fetchPendingPassportFulfillments(owner!)
      .then(setFulfillments)
      .catch(() => setFulfillments([]));
  }, [canOperate, owner]);

  if (!canOperate) {
    return null;
  }

  async function handleRetrySuins(fulfillment: PassportFulfillment): Promise<void> {
    setActiveId(fulfillment.id);
    setNotice(null);
    setError(null);

    try {
      const updated = await retryPassportSuinsProvision(fulfillment.id, owner!);

      if (!updated) {
        setError('Could not retry SuiNS provisioning.');
        return;
      }

      setFulfillments((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
      setNotice('SuiNS provisioning retried for ' + updated.preferredName + '.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'SuiNS retry failed.');
    } finally {
      setActiveId(null);
    }
  }

  return (
    <article className="panel passport-fulfillment-panel">
      <div className="profile-panel-heading">
        <h2>Passport fulfillment queue</h2>
        <p>
          Approved nodename claims queue here automatically. SuiNS subnames mint on approval when
          operator credentials are configured; members finish with a single enter_nami signature.
        </p>
      </div>

      {fulfillments.length === 0 ? (
        <p className="protocol-hint">No pending passport fulfillments.</p>
      ) : (
        <ul className="membership-fulfillment-list">
          {fulfillments.map((fulfillment) => (
            <li className="membership-fulfillment-row" key={fulfillment.id}>
              <div>
                <strong>{fulfillment.preferredName}</strong>
                <span>@{fulfillment.nodename}</span>
                <span>{fulfillment.suinsSubname}</span>
                <span>
                  SuiNS {fulfillment.suinsStatus.replaceAll('_', ' ')} · {fulfillment.status}
                </span>
                {fulfillment.submitterAddress ? (
                  <span>{shortenAddress(fulfillment.submitterAddress)}</span>
                ) : (
                  <span>No wallet linked yet</span>
                )}
              </div>
              {fulfillment.status === 'pending_suins' ? (
                <button
                  className="nami-surface-button is-primary-surface-button"
                  disabled={activeId === fulfillment.id}
                  onClick={() => void handleRetrySuins(fulfillment)}
                  type="button"
                >
                  {activeId === fulfillment.id ? 'Retrying…' : 'Retry SuiNS'}
                </button>
              ) : (
                <span className="mini-badge">Awaiting member mint</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {notice ? <p className="membership-plan-notice">{notice}</p> : null}
      {error ? <p className="membership-plan-notice is-error">{error}</p> : null}
    </article>
  );
}