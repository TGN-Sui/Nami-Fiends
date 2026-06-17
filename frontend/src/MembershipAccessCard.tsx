import type { ReactElement } from 'react';

import { openMembershipUpgradeOverlay } from './membership-upgrade-store.js';
import { membershipPlanForTier, useMembershipPlanState } from './membership-plans-store.js';

type MembershipAccessCardProps = {
  compact?: boolean;
};

export function MembershipAccessCard(props: MembershipAccessCardProps = {}): ReactElement {
  const planState = useMembershipPlanState();
  const activePlan = membershipPlanForTier(planState.activeTier);
  const ctaLabel =
    planState.activeTier === 'Elite' ? 'Change membership' : 'Upgrade membership';

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