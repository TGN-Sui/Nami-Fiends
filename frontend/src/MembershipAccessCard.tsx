import { useEffect, useState, type ReactElement } from 'react';

import {
  fetchPendingFulfillmentForOwner,
  isMembershipFulfillmentApiAvailable,
} from './membership-fulfillment-api.js';
import { openMembershipUpgradeOverlay } from './membership-upgrade-store.js';
import { membershipPlanForTier, useMembershipPlanState } from './membership-plans-store.js';
import { useProtocolOwner } from './wallet.js';

type MembershipAccessCardProps = {
  compact?: boolean;
};

export function MembershipAccessCard(props: MembershipAccessCardProps = {}): ReactElement {
  const planState = useMembershipPlanState();
  const { owner } = useProtocolOwner();
  const activePlan = membershipPlanForTier(planState.activeTier);
  const [onChainPending, setOnChainPending] = useState(false);
  const ctaLabel =
    planState.activeTier === 'Elite' ? 'Change membership' : 'Upgrade membership';

  useEffect(() => {
    if (!owner?.startsWith('0x') || !isMembershipFulfillmentApiAvailable()) {
      setOnChainPending(false);
      return;
    }

    void fetchPendingFulfillmentForOwner(owner)
      .then((fulfillment) => setOnChainPending(fulfillment !== null))
      .catch(() => setOnChainPending(false));
  }, [owner, planState.activeTier, planState.updatedAtMs]);

  if (props.compact) {
    return (
      <article className="panel membership-access-card is-compact-membership-access">
        <div className="membership-access-copy">
          <span className="mini-badge">Membership</span>
          <strong>{activePlan.label}</strong>
          <p>Expand boosts, squads, followed channels, and cosmetics.</p>
        </div>

        <button
          className="primary-action membership-access-upgrade-btn"
          onClick={() => openMembershipUpgradeOverlay()}
          type="button"
        >
          {ctaLabel}
        </button>
      </article>
    );
  }

  return (
    <article className="panel membership-access-card">
      <div className="profile-panel-heading">
        <h2>Membership</h2>
        <p>
          You are on <strong>{activePlan.label}</strong>. Adventurer is $3 USDC/mo or free with
          verified X.com. All tiers accept card, PayPal, SUI, or USDC on Sui.
        </p>
      </div>

      <div className="membership-access-meta">
        <span>{activePlan.tagline}</span>
        <span>{activePlan.highlights.length} benefits included</span>
        {onChainPending ? (
          <span className="membership-onchain-pending-badge">
            Paid tier active in app. On-chain passport upgrade is queued.
          </span>
        ) : null}
      </div>

      <button
        className="primary-action membership-access-upgrade-btn"
        onClick={() => openMembershipUpgradeOverlay()}
        type="button"
      >
        {ctaLabel}
      </button>
    </article>
  );
}