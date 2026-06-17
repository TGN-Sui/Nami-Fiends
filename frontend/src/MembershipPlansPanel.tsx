import { useMemo, useState, type ReactElement } from 'react';

import {
  MEMBERSHIP_PLANS,
  confirmMembershipUpgrade,
  formatMembershipPrice,
  membershipPlanForTier,
  requestMembershipCancel,
  requestMembershipDowngrade,
  requestMembershipUpgrade,
  undoMembershipChange,
  useMembershipPlanState,
  type MembershipBillingCycle,
  type PaidMembershipTier,
} from './membership-plans-store.js';

const TIER_RANK: Record<PaidMembershipTier, number> = {
  Adventurer: 1,
  Pro: 2,
  Elite: 3,
};

export function MembershipPlansPanel(): ReactElement {
  const planState = useMembershipPlanState();
  const [billingCycle, setBillingCycle] = useState<MembershipBillingCycle>(planState.billingCycle);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animatingTier, setAnimatingTier] = useState<PaidMembershipTier | null>(null);
  const [confirmingUpgrade, setConfirmingUpgrade] = useState(false);

  const activePlan = membershipPlanForTier(planState.activeTier);
  const pendingPlan = planState.pendingTier ? membershipPlanForTier(planState.pendingTier) : null;

  const statusLabel = useMemo(() => {
    if (planState.status === 'pending-upgrade') {
      return 'Upgrade pending payment';
    }

    if (planState.status === 'pending-downgrade') {
      return 'Downgrade scheduled';
    }

    if (planState.status === 'pending-cancel') {
      return 'Cancellation scheduled';
    }

    if (planState.status === 'cancelled') {
      return 'Cancelled';
    }

    return 'Active';
  }, [planState.status]);

  function clearMessages(): void {
    setNotice(null);
    setError(null);
  }

  function runWithPulse(tier: PaidMembershipTier, action: () => { ok: boolean; message?: string; reason?: string }): void {
    clearMessages();
    setAnimatingTier(tier);

    const result = action();

    window.setTimeout(() => {
      setAnimatingTier(null);

      if (result.ok) {
        setNotice(result.message ?? 'Membership updated.');
        setConfirmingUpgrade(false);
      } else {
        setError(result.reason ?? 'Could not update membership.');
      }
    }, 420);
  }

  function handleSelectPlan(tier: PaidMembershipTier): void {
    if (tier === planState.activeTier && planState.status === 'active') {
      return;
    }

    if (tier === 'Adventurer') {
      if (TIER_RANK[planState.activeTier] > TIER_RANK.Adventurer) {
        runWithPulse(tier, () => requestMembershipDowngrade('Adventurer'));
      }

      return;
    }

    if (TIER_RANK[tier] > TIER_RANK[planState.activeTier]) {
      runWithPulse(tier, () => requestMembershipUpgrade(tier, billingCycle));
      setConfirmingUpgrade(true);
      return;
    }

    if (TIER_RANK[tier] < TIER_RANK[planState.activeTier]) {
      runWithPulse(tier, () => requestMembershipDowngrade(tier));
    }
  }

  return (
    <section className="membership-plans-panel">
      <article className="panel membership-plans-hero">
        <div className="membership-plans-hero-copy">
          <span className="mini-badge">Membership Plans</span>
          <h2>Upgrade your Nami access</h2>
          <p>
            Paid tiers expand boosts, squads, cosmetics, and followed channels. Verification and
            conduct still gate trust — membership adds features, not status.
          </p>
        </div>

        <div className={'membership-plans-status-card is-status-' + planState.status}>
          <span>Current plan</span>
          <strong>{activePlan.label}</strong>
          <p>
            {statusLabel}
            {pendingPlan ? ' → ' + pendingPlan.label : ''}
          </p>
          <small>Renews {new Date(planState.renewsAtMs).toLocaleDateString()}</small>
        </div>
      </article>

      <div className="membership-billing-toggle" role="group" aria-label="Billing cycle">
        <button
          aria-pressed={billingCycle === 'monthly'}
          className={'membership-billing-option' + (billingCycle === 'monthly' ? ' is-active-billing' : '')}
          onClick={() => setBillingCycle('monthly')}
          type="button"
        >
          Monthly
        </button>
        <button
          aria-pressed={billingCycle === 'annual'}
          className={'membership-billing-option' + (billingCycle === 'annual' ? ' is-active-billing' : '')}
          onClick={() => setBillingCycle('annual')}
          type="button"
        >
          Annual <em>save ~25%</em>
        </button>
      </div>

      <div className="membership-plan-grid">
        {MEMBERSHIP_PLANS.map((plan) => {
          const isActive =
            plan.tier === planState.activeTier &&
            planState.status !== 'pending-upgrade' &&
            planState.status !== 'pending-downgrade' &&
            planState.status !== 'pending-cancel';
          const isPending = planState.pendingTier === plan.tier && planState.status !== 'active';
          const isAnimating = animatingTier === plan.tier;

          return (
            <button
              aria-pressed={isActive}
              className={
                'membership-plan-card' +
                (isActive ? ' is-active-membership-plan' : '') +
                (isPending ? ' is-pending-membership-plan' : '') +
                (isAnimating ? ' is-animating-membership-plan' : '') +
                (plan.tier === 'Elite' ? ' is-elite-membership-plan' : '') +
                (plan.tier === 'Pro' ? ' is-pro-membership-plan' : '')
              }
              key={plan.id}
              onClick={() => handleSelectPlan(plan.tier)}
              type="button"
            >
              <span className="membership-plan-tier-glow" aria-hidden="true" />
              <span className="membership-plan-head">
                <strong>{plan.label}</strong>
                <span className="membership-plan-price">
                  {formatMembershipPrice(plan, billingCycle)}
                </span>
              </span>
              <span className="membership-plan-tagline">{plan.tagline}</span>
              <ul className="membership-plan-highlights">
                {plan.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
              <span className="membership-plan-cta">
                {isActive
                  ? 'Current plan'
                  : isPending
                    ? 'Scheduled'
                    : TIER_RANK[plan.tier] > TIER_RANK[planState.activeTier]
                      ? 'Upgrade'
                      : plan.tier === 'Adventurer'
                        ? 'Downgrade at renewal'
                        : 'Downgrade'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="membership-plans-actions">
        {confirmingUpgrade && planState.status === 'pending-upgrade' ? (
          <button
            className="primary-action membership-confirm-upgrade-btn"
            onClick={() => runWithPulse(planState.pendingTier ?? 'Pro', () => confirmMembershipUpgrade())}
            type="button"
          >
            Confirm upgrade
          </button>
        ) : null}

        {planState.activeTier !== 'Adventurer' && planState.status === 'active' ? (
          <button
            className="secondary-action membership-cancel-btn"
            onClick={() => runWithPulse(planState.activeTier, () => requestMembershipCancel())}
            type="button"
          >
            Cancel paid membership
          </button>
        ) : null}

        {planState.status !== 'active' ? (
          <button
            className="profile-secondary-link"
            onClick={() => runWithPulse(planState.activeTier, () => undoMembershipChange())}
            type="button"
          >
            Undo pending change
          </button>
        ) : null}
      </div>

      {notice ? <p className="membership-plan-notice is-success">{notice}</p> : null}
      {error ? <p className="membership-plan-notice is-error">{error}</p> : null}
    </section>
  );
}