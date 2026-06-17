import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

import { MembershipAdventurerClaimCard } from './MembershipAdventurerClaimCard.js';
import { MembershipCheckoutPanel } from './MembershipCheckoutPanel.js';
import { MembershipPaymentMethods } from './MembershipPaymentMethods.js';
import {
  MEMBERSHIP_PLANS,
  formatMembershipPrice,
  membershipPlanForTier,
  requestMembershipCancel,
  requestMembershipDowngrade,
  requestMembershipUpgrade,
  undoMembershipChange,
  useMembershipPlanState,
  type MembershipBillingCycle,
  type MembershipCheckoutRail,
  type MembershipCryptoAsset,
  type PaidMembershipTier,
} from './membership-plans-store.js';
import {
  closeMembershipUpgradeOverlay,
  useMembershipUpgradeOverlayOpen,
} from './membership-upgrade-store.js';

const TIER_RANK: Record<PaidMembershipTier, number> = {
  Adventurer: 1,
  Pro: 2,
  Elite: 3,
};

export function MembershipUpgradeOverlay(): ReactElement | null {
  const open = useMembershipUpgradeOverlayOpen();
  const planState = useMembershipPlanState();
  const [billingCycle, setBillingCycle] = useState<MembershipBillingCycle>(planState.billingCycle);
  const [checkoutRail, setCheckoutRail] = useState<MembershipCheckoutRail>(
    planState.pendingCheckoutRail ?? 'card'
  );
  const [cryptoAsset, setCryptoAsset] = useState<MembershipCryptoAsset | null>(
    planState.pendingCryptoAsset ?? null
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animatingTier, setAnimatingTier] = useState<PaidMembershipTier | null>(null);
  const [confirmingUpgrade, setConfirmingUpgrade] = useState(false);

  const activePlan = membershipPlanForTier(planState.activeTier);

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

    if (planState.activeTier === 'Adventurer' && planState.adventurerSource === 'x-claim') {
      return 'Active via verified X.com';
    }

    return 'Active';
  }, [planState.activeTier, planState.adventurerSource, planState.status]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setBillingCycle(planState.billingCycle);
    setCheckoutRail(planState.pendingCheckoutRail ?? 'card');
    setCryptoAsset(planState.pendingCryptoAsset ?? null);
    setNotice(null);
    setError(null);
    setConfirmingUpgrade(planState.status === 'pending-upgrade');

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        closeMembershipUpgradeOverlay();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, planState.billingCycle, planState.pendingCheckoutRail, planState.pendingCryptoAsset, planState.status]);

  if (!open) {
    return null;
  }

  function clearMessages(): void {
    setNotice(null);
    setError(null);
  }

  function runWithPulse(
    tier: PaidMembershipTier,
    action: () => { ok: boolean; message?: string; reason?: string },
    options?: { preserveConfirming?: boolean }
  ): void {
    clearMessages();
    setAnimatingTier(tier);

    const result = action();

    window.setTimeout(() => {
      setAnimatingTier(null);

      if (result.ok) {
        setNotice(result.message ?? 'Membership updated.');

        if (!options?.preserveConfirming) {
          setConfirmingUpgrade(false);
        }
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

    if (TIER_RANK[tier] > TIER_RANK[planState.activeTier] || planState.status === 'pending-cancel') {
      runWithPulse(tier, () => requestMembershipUpgrade(tier, billingCycle, checkoutRail, cryptoAsset), {
        preserveConfirming: true,
      });
      setConfirmingUpgrade(true);
      return;
    }

    if (TIER_RANK[tier] < TIER_RANK[planState.activeTier]) {
      runWithPulse(tier, () => requestMembershipDowngrade(tier));
    }
  }

  const showPaidCancel =
    planState.status === 'active' &&
    (planState.activeTier !== 'Adventurer' ||
      (planState.activeTier === 'Adventurer' && planState.adventurerSource === 'paid'));

  return createPortal(
    <div
      aria-labelledby="membership-upgrade-title"
      aria-modal="true"
      className="membership-upgrade-overlay"
      onClick={() => closeMembershipUpgradeOverlay()}
      role="dialog"
    >
      <div
        className="membership-upgrade-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Close membership plans"
          className="membership-upgrade-close"
          onClick={() => closeMembershipUpgradeOverlay()}
          type="button"
        >
          ×
        </button>

        <header className="membership-upgrade-header">
          <span className="mini-badge">Membership Plans</span>
          <h2 id="membership-upgrade-title">Upgrade your Nami access</h2>
          <p>
            Credit/debit card, PayPal, or Other (SUI, USDC, $GOON). Adventurer is $3 USDC/month — or
            claim free after X.com authorization. Card/PayPal settle server-side; crypto uses wallet
            signatures to the treasury address.
          </p>
        </header>

        <div className={'membership-upgrade-status is-status-' + planState.status}>
          <span>Current plan</span>
          <strong>{activePlan.label}</strong>
          <p>{statusLabel}</p>
        </div>

        <MembershipAdventurerClaimCard onError={setError} onNotice={setNotice} />

        <MembershipPaymentMethods
          compact
          onSelectCryptoAsset={setCryptoAsset}
          onSelectRail={setCheckoutRail}
          selectedCryptoAsset={cryptoAsset}
          selectedRail={checkoutRail}
        />

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

        <div className="membership-upgrade-plan-grid">
          {MEMBERSHIP_PLANS.map((plan, index) => {
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
                  'membership-plan-card membership-upgrade-plan-card' +
                  (isActive ? ' is-active-membership-plan' : '') +
                  (isPending ? ' is-pending-membership-plan' : '') +
                  (isAnimating ? ' is-animating-membership-plan' : '') +
                  (plan.tier === 'Elite' ? ' is-elite-membership-plan' : '') +
                  (plan.tier === 'Pro' ? ' is-pro-membership-plan' : '') +
                  (plan.tier === 'Adventurer' ? ' is-adventurer-membership-plan' : '')
                }
                key={plan.id}
                onClick={() => handleSelectPlan(plan.tier)}
                style={{ animationDelay: String(80 + index * 90) + 'ms' }}
                type="button"
              >
                <span className="membership-plan-tier-glow" aria-hidden="true" />
                <span className="membership-plan-head">
                  <strong>{plan.label}</strong>
                  <span className="membership-plan-price">
                    {formatMembershipPrice(plan, billingCycle)}
                  </span>
                </span>
                {plan.claimableViaVerifiedX ? (
                  <span className="membership-plan-x-claim-note">or free with verified X.com</span>
                ) : null}
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

        {planState.status === 'pending-upgrade' ? (
          <MembershipCheckoutPanel
            onComplete={() => setConfirmingUpgrade(false)}
            onError={setError}
            onNotice={setNotice}
          />
        ) : null}

        <div className="membership-plans-actions membership-upgrade-actions">
          {showPaidCancel ? (
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
      </div>
    </div>,
    document.body
  );
}