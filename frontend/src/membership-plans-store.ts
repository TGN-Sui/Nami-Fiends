import { useSyncExternalStore } from 'react';

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
  highlights: string[];
};

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'adventurer',
    tier: 'Adventurer',
    label: 'Adventurer',
    tagline: 'Verified free access after human check.',
    monthlyUsd: 0,
    annualUsd: 0,
    channelSlots: 3,
    boostCount: 1,
    squadSlots: 0,
    juryEligible: false,
    highlights: ['Channel creation', 'Guild creation', '1 boost', '3 followed channels'],
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
    highlights: ['8 boosts', '8 squad slots', 'Banner slots', 'Premium reactions & filters'],
  },
];

const MEMBERSHIP_STATE_KEY = 'nami.membership.planState';

export type MembershipPlanState = {
  activeTier: PaidMembershipTier;
  billingCycle: MembershipBillingCycle;
  status: MembershipPlanStatus;
  pendingTier: PaidMembershipTier | null;
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

    const parsed = JSON.parse(stored) as Partial<MembershipPlanState>;
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
  if (plan.monthlyUsd === 0) {
    return 'Free';
  }

  if (cycle === 'annual') {
    return '$' + plan.annualUsd.toFixed(0) + '/yr';
  }

  return '$' + plan.monthlyUsd.toFixed(2) + '/mo';
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
  billingCycle: MembershipBillingCycle
): MembershipActionResult {
  const state = readMembershipPlanState();

  if (TIER_RANK[targetTier] <= TIER_RANK[state.activeTier] && state.status !== 'pending-cancel') {
    return { ok: false, reason: 'Choose a higher tier to upgrade.' };
  }

  if (targetTier === 'Adventurer') {
    return { ok: false, reason: 'Adventurer is unlocked through verification, not checkout.' };
  }

  saveMembershipPlanState({
    ...state,
    billingCycle,
    status: 'pending-upgrade',
    pendingTier: targetTier,
    updatedAtMs: Date.now(),
  });

  return {
    ok: true,
    message: 'Upgrade to ' + targetTier + ' queued. Perks activate after payment confirmation.',
  };
}

export function confirmMembershipUpgrade(): MembershipActionResult {
  const state = readMembershipPlanState();

  if (state.status !== 'pending-upgrade' || !state.pendingTier) {
    return { ok: false, reason: 'No pending upgrade to confirm.' };
  }

  const cycleMs = state.billingCycle === 'annual' ? 365 : 30;
  const renewsAtMs = Date.now() + cycleMs * 24 * 60 * 60 * 1000;

  saveMembershipPlanState({
    activeTier: state.pendingTier,
    billingCycle: state.billingCycle,
    status: 'active',
    pendingTier: null,
    renewsAtMs,
    updatedAtMs: Date.now(),
  });

  return { ok: true, message: 'Welcome to ' + state.pendingTier + '.' };
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

  if (state.activeTier === 'Adventurer') {
    return { ok: false, reason: 'Adventurer access is free and verification-based.' };
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
      ', then you keep Adventurer if verified.',
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