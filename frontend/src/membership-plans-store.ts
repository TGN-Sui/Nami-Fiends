import { useSyncExternalStore } from 'react';

import { isXVerificationEligibleForAdventurerClaim } from './x-verification-store.js';
import { type NamiMember } from './uiMockData.js';

export type PaidMembershipTier = 'Adventurer' | 'Pro' | 'Elite';

export type MembershipBillingCycle = 'monthly' | 'annual';

export type MembershipPlanStatus =
  | 'active'
  | 'pending-upgrade'
  | 'pending-downgrade'
  | 'pending-cancel'
  | 'cancelled';

export type MembershipPlanId = 'adventurer' | 'pro' | 'elite';

export type MembershipCheckoutRail = 'card' | 'paypal' | 'other';

export type MembershipCryptoAsset = 'sui' | 'usdc-sui' | 'goon';

/** @deprecated Use MembershipCheckoutRail */
export type MembershipPaymentMethod = MembershipCheckoutRail;

export type AdventurerAccessSource = 'paid' | 'x-claim' | null;

export type MembershipPlan = {
  id: MembershipPlanId;
  tier: PaidMembershipTier;
  label: string;
  tagline: string;
  monthlyUsd: number;
  annualUsd: number;
  channelSlots: number;
  boostCount: number;
  squadSlots: number;
  juryEligible: boolean;
  claimableViaVerifiedX: boolean;
  highlights: string[];
};

export const MEMBERSHIP_CHECKOUT_RAILS: ReadonlyArray<{
  id: MembershipCheckoutRail;
  label: string;
  hint: string;
}> = [
  {
    id: 'card',
    label: 'Credit / debit card',
    hint: 'Secure card checkout via Stripe on the receiving server',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    hint: 'PayPal checkout with server-side capture and webhook confirmation',
  },
  {
    id: 'other',
    label: 'Other',
    hint: 'SUI, USDC on Sui, or $GOON — sign in wallet and send to treasury',
  },
];

export const MEMBERSHIP_CRYPTO_ASSETS: ReadonlyArray<{
  id: MembershipCryptoAsset;
  label: string;
  hint: string;
}> = [
  {
    id: 'sui',
    label: 'SUI',
    hint: 'USD-equivalent SUI at checkout spot price',
  },
  {
    id: 'usdc-sui',
    label: 'USDC on Sui',
    hint: 'Send USDC equal to the tier USD amount',
  },
  {
    id: 'goon',
    label: '$GOON',
    hint: 'Send GOON equal to the tier USD amount',
  },
];

export const MEMBERSHIP_PAYMENT_METHODS = MEMBERSHIP_CHECKOUT_RAILS;

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'adventurer',
    tier: 'Adventurer',
    label: 'Adventurer',
    tagline: '$3 USDC/mo or claim free with a verified X.com account.',
    monthlyUsd: 3,
    annualUsd: 27,
    channelSlots: 3,
    boostCount: 1,
    squadSlots: 0,
    juryEligible: false,
    claimableViaVerifiedX: true,
    highlights: [
      'Channel creation',
      'Guild creation',
      '1 boost',
      '3 followed channels',
      'Claimable via verified X.com OAuth',
    ],
  },
  {
    id: 'pro',
    tier: 'Pro',
    label: 'Pro Circuit',
    tagline: 'Expanded squads, jury duty, and creator tools.',
    monthlyUsd: 9.99,
    annualUsd: 89,
    channelSlots: 5,
    boostCount: 6,
    squadSlots: 3,
    juryEligible: true,
    claimableViaVerifiedX: false,
    highlights: ['6 boosts', '3 squad slots', 'Jury eligibility', 'Profile cosmetics tier I'],
  },
  {
    id: 'elite',
    tier: 'Elite',
    label: 'Elite Crest',
    tagline: 'Maximum slots, spotlight priority, and premium cosmetics.',
    monthlyUsd: 19.99,
    annualUsd: 179,
    channelSlots: 8,
    boostCount: 8,
    squadSlots: 8,
    juryEligible: true,
    claimableViaVerifiedX: false,
    highlights: ['8 boosts', '8 squad slots', 'Banner slots', 'Premium reactions & filters'],
  },
];

const MEMBERSHIP_STATE_KEY = 'nami.membership.planState';

export type MembershipPlanState = {
  activeTier: PaidMembershipTier;
  billingCycle: MembershipBillingCycle;
  status: MembershipPlanStatus;
  pendingTier: PaidMembershipTier | null;
  pendingCheckoutRail: MembershipCheckoutRail | null;
  pendingCryptoAsset: MembershipCryptoAsset | null;
  pendingPaymentId: string | null;
  adventurerSource: AdventurerAccessSource;
  renewsAtMs: number;
  updatedAtMs: number;
};

const TIER_RANK: Record<PaidMembershipTier, number> = {
  Adventurer: 1,
  Pro: 2,
  Elite: 3,
};

let cachedMembershipState: MembershipPlanState | null = null;

function defaultMembershipState(): MembershipPlanState {
  return {
    activeTier: 'Adventurer',
    billingCycle: 'monthly',
    status: 'active',
    pendingTier: null,
    pendingCheckoutRail: null,
    pendingCryptoAsset: null,
    pendingPaymentId: null,
    adventurerSource: 'paid',
    renewsAtMs: Date.now() + 30 * 24 * 60 * 60 * 1000,
    updatedAtMs: Date.now(),
  };
}

export function readMembershipPlanState(): MembershipPlanState {
  if (cachedMembershipState) {
    return cachedMembershipState;
  }

  try {
    const stored = window.localStorage.getItem(MEMBERSHIP_STATE_KEY);

    if (!stored) {
      cachedMembershipState = defaultMembershipState();
      return cachedMembershipState;
    }

    const parsed = JSON.parse(stored) as Partial<MembershipPlanState> & {
      pendingPaymentMethod?: 'card' | 'paypal' | 'sui' | 'usdc-sui';
    };
    const activeTier =
      parsed.activeTier === 'Pro' || parsed.activeTier === 'Elite' || parsed.activeTier === 'Adventurer'
        ? parsed.activeTier
        : 'Adventurer';

    cachedMembershipState = {
      activeTier,
      billingCycle: parsed.billingCycle === 'annual' ? 'annual' : 'monthly',
      status:
        parsed.status === 'pending-upgrade' ||
        parsed.status === 'pending-downgrade' ||
        parsed.status === 'pending-cancel' ||
        parsed.status === 'cancelled'
          ? parsed.status
          : 'active',
      pendingTier:
        parsed.pendingTier === 'Pro' ||
        parsed.pendingTier === 'Elite' ||
        parsed.pendingTier === 'Adventurer'
          ? parsed.pendingTier
          : null,
      pendingCheckoutRail: (() => {
        if (
          parsed.pendingCheckoutRail === 'card' ||
          parsed.pendingCheckoutRail === 'paypal' ||
          parsed.pendingCheckoutRail === 'other'
        ) {
          return parsed.pendingCheckoutRail;
        }

        const legacy = parsed.pendingPaymentMethod;

        if (legacy === 'card' || legacy === 'paypal') {
          return legacy;
        }

        if (legacy === 'sui' || legacy === 'usdc-sui') {
          return 'other';
        }

        return null;
      })(),
      pendingCryptoAsset: (() => {
        if (
          parsed.pendingCryptoAsset === 'sui' ||
          parsed.pendingCryptoAsset === 'usdc-sui' ||
          parsed.pendingCryptoAsset === 'goon'
        ) {
          return parsed.pendingCryptoAsset;
        }

        if (parsed.pendingPaymentMethod === 'sui') {
          return 'sui';
        }

        if (parsed.pendingPaymentMethod === 'usdc-sui') {
          return 'usdc-sui';
        }

        return null;
      })(),
      pendingPaymentId:
        typeof parsed.pendingPaymentId === 'string' ? parsed.pendingPaymentId : null,
      adventurerSource:
        parsed.adventurerSource === 'paid' || parsed.adventurerSource === 'x-claim'
          ? parsed.adventurerSource
          : null,
      renewsAtMs: typeof parsed.renewsAtMs === 'number' ? parsed.renewsAtMs : Date.now(),
      updatedAtMs: typeof parsed.updatedAtMs === 'number' ? parsed.updatedAtMs : Date.now(),
    };

    return cachedMembershipState;
  } catch {
    cachedMembershipState = defaultMembershipState();
    return cachedMembershipState;
  }
}

function saveMembershipPlanState(state: MembershipPlanState): void {
  cachedMembershipState = state;
  window.localStorage.setItem(MEMBERSHIP_STATE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('nami-membership-plan-changed'));
}

function invalidateMembershipState(): void {
  cachedMembershipState = null;
}

export function membershipPlanForTier(tier: PaidMembershipTier): MembershipPlan {
  return MEMBERSHIP_PLANS.find((plan) => plan.tier === tier) ?? MEMBERSHIP_PLANS[0]!;
}

export function formatMembershipPrice(plan: MembershipPlan, cycle: MembershipBillingCycle): string {
  const currencySuffix = plan.tier === 'Adventurer' ? ' USDC' : '';

  if (cycle === 'annual') {
    return '$' + plan.annualUsd.toFixed(0) + currencySuffix + '/yr';
  }

  return '$' + plan.monthlyUsd.toFixed(2) + currencySuffix + '/mo';
}

export function membershipCheckoutRailLabel(rail: MembershipCheckoutRail): string {
  return MEMBERSHIP_CHECKOUT_RAILS.find((entry) => entry.id === rail)?.label ?? rail;
}

export function membershipCryptoAssetLabel(asset: MembershipCryptoAsset): string {
  return MEMBERSHIP_CRYPTO_ASSETS.find((entry) => entry.id === asset)?.label ?? asset;
}

export function membershipPaymentMethodLabel(method: MembershipCheckoutRail): string {
  return membershipCheckoutRailLabel(method);
}

export function membershipCheckoutSelectionLabel(
  rail: MembershipCheckoutRail,
  cryptoAsset: MembershipCryptoAsset | null
): string {
  if (rail === 'other' && cryptoAsset) {
    return membershipCryptoAssetLabel(cryptoAsset);
  }

  return membershipCheckoutRailLabel(rail);
}

export function effectiveMemberTier(state: MembershipPlanState = readMembershipPlanState()): PaidMembershipTier {
  if (state.status === 'pending-upgrade' && state.pendingTier) {
    return state.pendingTier;
  }

  if (state.status === 'cancelled') {
    return 'Adventurer';
  }

  return state.activeTier;
}

export function applyMembershipTierToMember(member: NamiMember): NamiMember {
  if (member.id !== 'm1') {
    return member;
  }

  const tier = effectiveMemberTier();

  return { ...member, tier };
}

export type MembershipActionResult =
  | { ok: true; message: string }
  | { ok: false; reason: string };

export function requestMembershipUpgrade(
  targetTier: PaidMembershipTier,
  billingCycle: MembershipBillingCycle,
  checkoutRail: MembershipCheckoutRail = 'card',
  cryptoAsset: MembershipCryptoAsset | null = null
): MembershipActionResult {
  const state = readMembershipPlanState();

  if (TIER_RANK[targetTier] <= TIER_RANK[state.activeTier] && state.status !== 'pending-cancel') {
    return { ok: false, reason: 'Choose a higher tier to upgrade.' };
  }

  if (targetTier === 'Adventurer' && isXVerificationEligibleForAdventurerClaim()) {
    return {
      ok: false,
      reason: 'Your verified X.com account already qualifies for Adventurer. Use Claim via X instead.',
    };
  }

  if (checkoutRail === 'other' && !cryptoAsset) {
    return { ok: false, reason: 'Choose SUI, USDC on Sui, or $GOON under Other.' };
  }

  saveMembershipPlanState({
    ...state,
    billingCycle,
    status: 'pending-upgrade',
    pendingTier: targetTier,
    pendingCheckoutRail: checkoutRail,
    pendingCryptoAsset: checkoutRail === 'other' ? cryptoAsset : null,
    pendingPaymentId: null,
    updatedAtMs: Date.now(),
  });

  const plan = membershipPlanForTier(targetTier);
  const price = formatMembershipPrice(plan, billingCycle);

  return {
    ok: true,
    message:
      'Upgrade to ' +
      plan.label +
      ' queued (' +
      price +
      ' via ' +
      membershipCheckoutSelectionLabel(checkoutRail, cryptoAsset) +
      '). Continue to checkout.',
  };
}

export function claimAdventurerMembershipViaX(): MembershipActionResult {
  if (!isXVerificationEligibleForAdventurerClaim()) {
    return {
      ok: false,
      reason: 'Link and verify your X.com account through X authorization before claiming Adventurer.',
    };
  }

  const state = readMembershipPlanState();

  if (TIER_RANK[state.activeTier] > TIER_RANK.Adventurer && state.status === 'active') {
    return { ok: false, reason: 'You already have a higher membership tier than Adventurer.' };
  }

  const cycleMs = 30 * 24 * 60 * 60 * 1000;

  saveMembershipPlanState({
    ...state,
    activeTier: 'Adventurer',
    billingCycle: 'monthly',
    status: 'active',
    pendingTier: null,
    pendingCheckoutRail: null,
    pendingCryptoAsset: null,
    pendingPaymentId: null,
    adventurerSource: 'x-claim',
    renewsAtMs: Date.now() + cycleMs,
    updatedAtMs: Date.now(),
  });

  return {
    ok: true,
    message: 'Adventurer claimed through verified X.com authorization. Renews while X stays linked.',
  };
}

export function setMembershipPendingPaymentId(paymentId: string): void {
  const state = readMembershipPlanState();

  saveMembershipPlanState({
    ...state,
    pendingPaymentId: paymentId,
    updatedAtMs: Date.now(),
  });
}

export function finalizeMembershipUpgradeAfterPayment(paymentId: string): MembershipActionResult {
  const state = readMembershipPlanState();

  if (state.status !== 'pending-upgrade' || !state.pendingTier) {
    return { ok: false, reason: 'No pending upgrade to finalize.' };
  }

  if (state.pendingPaymentId && state.pendingPaymentId !== paymentId) {
    return { ok: false, reason: 'Payment does not match the active checkout session.' };
  }

  const cycleMs = state.billingCycle === 'annual' ? 365 : 30;
  const renewsAtMs = Date.now() + cycleMs * 24 * 60 * 60 * 1000;

  saveMembershipPlanState({
    activeTier: state.pendingTier,
    billingCycle: state.billingCycle,
    status: 'active',
    pendingTier: null,
    pendingCheckoutRail: null,
    pendingCryptoAsset: null,
    pendingPaymentId: null,
    adventurerSource: state.pendingTier === 'Adventurer' ? 'paid' : state.adventurerSource,
    renewsAtMs,
    updatedAtMs: Date.now(),
  });

  const paymentLabel = state.pendingCheckoutRail
    ? ' via ' +
      membershipCheckoutSelectionLabel(state.pendingCheckoutRail, state.pendingCryptoAsset)
    : '';

  return { ok: true, message: 'Welcome to ' + state.pendingTier + paymentLabel + '.' };
}

/** Legacy local-only confirm when payment API is unavailable. */
export function confirmMembershipUpgrade(): MembershipActionResult {
  const state = readMembershipPlanState();

  if (state.status !== 'pending-upgrade' || !state.pendingTier) {
    return { ok: false, reason: 'No pending upgrade to confirm.' };
  }

  return finalizeMembershipUpgradeAfterPayment(state.pendingPaymentId ?? 'local-mock');
}

export function requestMembershipDowngrade(targetTier: PaidMembershipTier): MembershipActionResult {
  const state = readMembershipPlanState();

  if (targetTier === 'Elite') {
    return { ok: false, reason: 'Downgrade must move to a lower tier.' };
  }

  if (TIER_RANK[targetTier] >= TIER_RANK[state.activeTier]) {
    return { ok: false, reason: 'Choose a lower tier to downgrade.' };
  }

  saveMembershipPlanState({
    ...state,
    status: 'pending-downgrade',
    pendingTier: targetTier,
    updatedAtMs: Date.now(),
  });

  return {
    ok: true,
    message:
      'Downgrade to ' +
      targetTier +
      ' scheduled for ' +
      new Date(state.renewsAtMs).toLocaleDateString() +
      '.',
  };
}

export function requestMembershipCancel(): MembershipActionResult {
  const state = readMembershipPlanState();

  if (state.activeTier === 'Adventurer' && state.adventurerSource === 'x-claim') {
    return {
      ok: false,
      reason: 'Unlink your verified X.com account in Settings to revoke Adventurer claim access.',
    };
  }

  if (state.activeTier === 'Adventurer' && state.status === 'active') {
    saveMembershipPlanState({
      ...state,
      status: 'pending-cancel',
      pendingTier: null,
      updatedAtMs: Date.now(),
    });

    return {
      ok: true,
      message:
        'Adventurer subscription cancellation scheduled for ' +
        new Date(state.renewsAtMs).toLocaleDateString() +
        '. Re-link verified X.com to retain access without payment.',
    };
  }

  saveMembershipPlanState({
    ...state,
    status: 'pending-cancel',
    pendingTier: 'Adventurer',
    updatedAtMs: Date.now(),
  });

  return {
    ok: true,
    message:
      'Cancellation scheduled. Paid perks end on ' +
      new Date(state.renewsAtMs).toLocaleDateString() +
      ', then you fall back to Adventurer.',
  };
}

export function undoMembershipChange(): MembershipActionResult {
  const state = readMembershipPlanState();

  if (state.status === 'active') {
    return { ok: false, reason: 'No pending membership change to undo.' };
  }

  saveMembershipPlanState({
    ...state,
    status: 'active',
    pendingTier: null,
    pendingCheckoutRail: null,
    pendingCryptoAsset: null,
    pendingPaymentId: null,
    updatedAtMs: Date.now(),
  });

  return { ok: true, message: 'Pending membership change cleared.' };
}

function subscribeMembershipPlan(listener: () => void): () => void {
  function onChange(): void {
    invalidateMembershipState();
    listener();
  }

  window.addEventListener('nami-membership-plan-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-membership-plan-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useMembershipPlanState(): MembershipPlanState {
  return useSyncExternalStore(subscribeMembershipPlan, readMembershipPlanState, readMembershipPlanState);
}