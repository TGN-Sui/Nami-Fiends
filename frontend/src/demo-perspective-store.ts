import { useSyncExternalStore } from 'react';

import { saveOwnedGameChannelId } from './channel-owner-access.js';

import {
  hydrateMembershipPlanState,
  readMembershipPlanState,
  type MembershipPlanState,
  type PaidMembershipTier,
} from './membership-plans-store.js';
import type { NamiAdminRole } from './nami-capabilities.js';
import {
  readUserSurfaceRole,
  saveUserSurfaceRole,
  type UserSurfaceRole,
} from './surface-preferences.js';
import type { ConductSignal, NamiMember, NamiPage } from './uiMockData.js';

const BASELINE_KEY = 'nami.demo.owner-baseline';
const ACTIVE_PERSPECTIVE_KEY = 'nami.demo.active-perspective';
const DEMO_CHANNEL_NAV_KEY = 'nami.demo.channel-nav';
const DEMO_PERSPECTIVE_FOCUS_KEY = 'nami.demo.perspective-focus';

export type DemoPerspectiveId =
  | 'npc'
  | 'adventurer'
  | 'pro-member'
  | 'elite-member'
  | 'elite-channel-owner'
  | 'guild-owner'
  | 'nami-team'
  | 'nami-moderator'
  | 'nami-official-owner';

export type DemoSafetyModerationRole = 'Member' | 'Channel Owner' | 'Nami Moderator' | 'Nami Dev';

export type DemoPerspectivePreset = {
  id: DemoPerspectiveId;
  label: string;
  detail: string;
  tier: NamiMember['tier'];
  surfaceRole: UserSurfaceRole;
  signal: ConductSignal;
  isNamiTeam: boolean;
  adminRole: NamiAdminRole;
  safetyModerationRole: DemoSafetyModerationRole;
  landingPage: NamiPage;
  channelId?: string;
};

export const DEMO_PERSPECTIVE_PRESETS: DemoPerspectivePreset[] = [
  {
    id: 'npc',
    label: 'NPC Gamer',
    detail: 'Unverified baseline — limited slots, boosts, and appearance.',
    tier: 'NPC',
    surfaceRole: 'member',
    signal: 'Green',
    isNamiTeam: false,
    adminRole: 'none',
    safetyModerationRole: 'Member',
    landingPage: 'hub',
  },
  {
    id: 'adventurer',
    label: 'Adventurer',
    detail: 'Entry verified member with guild tools and glass themes.',
    tier: 'Adventurer',
    surfaceRole: 'member',
    signal: 'Green',
    isNamiTeam: false,
    adminRole: 'none',
    safetyModerationRole: 'Member',
    landingPage: 'hub',
  },
  {
    id: 'pro-member',
    label: 'Pro Creator',
    detail: 'Verified creator with member feeds and jury eligibility.',
    tier: 'Pro',
    surfaceRole: 'member',
    signal: 'Green',
    isNamiTeam: false,
    adminRole: 'none',
    safetyModerationRole: 'Member',
    landingPage: 'hub',
  },
  {
    id: 'elite-member',
    label: 'Elite Creator',
    detail: 'Premium member tools without channel-owner surfaces.',
    tier: 'Elite',
    surfaceRole: 'member',
    signal: 'Green',
    isNamiTeam: false,
    adminRole: 'none',
    safetyModerationRole: 'Member',
    landingPage: 'userProfile',
  },
  {
    id: 'elite-channel-owner',
    label: 'Game Channel Owner',
    detail: 'Elite tier with game feed settings and owner profile tools.',
    tier: 'Elite',
    surfaceRole: 'channel-owner',
    signal: 'Green',
    isNamiTeam: false,
    adminRole: 'none',
    safetyModerationRole: 'Channel Owner',
    landingPage: 'channelProfile',
    channelId: 'vortex',
  },
  {
    id: 'guild-owner',
    label: 'Guild Owner',
    detail: 'Guild feed configuration and guild management surfaces.',
    tier: 'Pro',
    surfaceRole: 'guild-owner',
    signal: 'Green',
    isNamiTeam: false,
    adminRole: 'none',
    safetyModerationRole: 'Channel Owner',
    landingPage: 'guilds',
  },
  {
    id: 'nami-team',
    label: 'Nami Team',
    detail: 'Official team foil, alerts, and feed-abuse visibility.',
    tier: 'Pro',
    surfaceRole: 'member',
    signal: 'Green',
    isNamiTeam: true,
    adminRole: 'none',
    safetyModerationRole: 'Nami Moderator',
    landingPage: 'hub',
  },
  {
    id: 'nami-moderator',
    label: 'Nami Moderator',
    detail: 'Manual Color Signal review and moderation queue access.',
    tier: 'Pro',
    surfaceRole: 'member',
    signal: 'Green',
    isNamiTeam: false,
    adminRole: 'official-moderator',
    safetyModerationRole: 'Nami Moderator',
    landingPage: 'safetyCenter',
  },
  {
    id: 'nami-official-owner',
    label: 'Nami Official Owner',
    detail: 'Platform owner dashboard, advanced settings, and indexed data.',
    tier: 'Elite',
    surfaceRole: 'member',
    signal: 'Green',
    isNamiTeam: true,
    adminRole: 'official-owner',
    safetyModerationRole: 'Nami Dev',
    landingPage: 'settings',
  },
];

type OwnerBaseline = {
  membershipPlanState: MembershipPlanState;
  surfaceRole: UserSurfaceRole;
};

function readJson<T>(key: string): T | null {
  try {
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function dispatchPerspectiveChanged(): void {
  window.dispatchEvent(new CustomEvent('nami-demo-perspective-changed'));
}

function captureOwnerBaseline(): OwnerBaseline {
  return {
    membershipPlanState: readMembershipPlanState(),
    surfaceRole: readUserSurfaceRole(),
  };
}

function ensureOwnerBaseline(): void {
  if (readJson<OwnerBaseline>(BASELINE_KEY)) {
    return;
  }

  writeJson(BASELINE_KEY, captureOwnerBaseline());
}

export function readActiveDemoPerspectiveId(): DemoPerspectiveId | null {
  try {
    const stored = window.localStorage.getItem(ACTIVE_PERSPECTIVE_KEY);

    if (!stored) {
      return null;
    }

    return DEMO_PERSPECTIVE_PRESETS.some((preset) => preset.id === stored)
      ? (stored as DemoPerspectiveId)
      : null;
  } catch {
    return null;
  }
}

export function isDemoPerspectiveActive(): boolean {
  return readActiveDemoPerspectiveId() !== null;
}

export function readActiveDemoPerspective(): DemoPerspectivePreset | null {
  const activeId = readActiveDemoPerspectiveId();

  if (!activeId) {
    return null;
  }

  return DEMO_PERSPECTIVE_PRESETS.find((preset) => preset.id === activeId) ?? null;
}

export function readDemoAdminRoleOverride(): NamiAdminRole | null {
  const active = readActiveDemoPerspective();

  if (!active) {
    return null;
  }

  return active.adminRole;
}

export function readDemoSafetyModerationRole(): DemoSafetyModerationRole | null {
  return readActiveDemoPerspective()?.safetyModerationRole ?? null;
}

export function canDemoManuallyReviewSignals(): boolean | null {
  const role = readDemoSafetyModerationRole();

  if (!role) {
    return null;
  }

  return role === 'Nami Moderator' || role === 'Nami Dev';
}

function paidTierForMemberTier(tier: NamiMember['tier']): PaidMembershipTier | null {
  if (tier === 'Adventurer' || tier === 'Pro' || tier === 'Elite') {
    return tier;
  }

  return null;
}

function applyMembershipForTier(tier: NamiMember['tier']): void {
  const paidTier = paidTierForMemberTier(tier);
  const baseline = readJson<OwnerBaseline>(BASELINE_KEY);
  const sourceState = baseline?.membershipPlanState ?? readMembershipPlanState();

  if (!paidTier) {
    return;
  }

  hydrateMembershipPlanState({
    ...sourceState,
    activeTier: paidTier,
    status: 'active',
    pendingTier: null,
    pendingCheckoutRail: null,
    pendingCryptoAsset: null,
    pendingPaymentId: null,
    updatedAtMs: Date.now(),
  });
}

export function applyDemoMemberOverrides(member: NamiMember): NamiMember {
  const active = readActiveDemoPerspective();

  if (!active || member.id !== 'm1') {
    return member;
  }

  const isOwner = active.adminRole === 'official-owner';

  return {
    ...member,
    tier: active.tier,
    signal: active.signal,
    isNamiTeam: isOwner ? true : active.isNamiTeam,
    isNamiBoss: isOwner ? true : active.isNamiTeam, // or false if you prefer
  } as NamiMember;
}

export function applyDemoPerspective(perspectiveId: DemoPerspectiveId): DemoPerspectivePreset {
  const preset =
    DEMO_PERSPECTIVE_PRESETS.find((entry) => entry.id === perspectiveId) ??
    DEMO_PERSPECTIVE_PRESETS[0]!;

  ensureOwnerBaseline();
  applyMembershipForTier(preset.tier);
  saveUserSurfaceRole(preset.surfaceRole);
  window.localStorage.setItem(ACTIVE_PERSPECTIVE_KEY, preset.id);

  if (preset.channelId) {
    saveOwnedGameChannelId(preset.channelId);
    window.sessionStorage.setItem(DEMO_CHANNEL_NAV_KEY, preset.channelId);
  } else {
    window.sessionStorage.removeItem(DEMO_CHANNEL_NAV_KEY);
  }

  dispatchPerspectiveChanged();
  return preset;
}

export function restoreOwnerDemoPerspective(): void {
  const baseline = readJson<OwnerBaseline>(BASELINE_KEY);

  if (baseline) {
    hydrateMembershipPlanState(baseline.membershipPlanState);
    saveUserSurfaceRole(baseline.surfaceRole);
  }

  window.localStorage.removeItem(ACTIVE_PERSPECTIVE_KEY);
  window.localStorage.removeItem(BASELINE_KEY);
  window.sessionStorage.removeItem(DEMO_CHANNEL_NAV_KEY);
  dispatchPerspectiveChanged();
}

export function consumeDemoChannelNavigation(): string | null {
  try {
    const channelId = window.sessionStorage.getItem(DEMO_CHANNEL_NAV_KEY);

    if (!channelId) {
      return null;
    }

    window.sessionStorage.removeItem(DEMO_CHANNEL_NAV_KEY);
    return channelId;
  } catch {
    return null;
  }
}

export function requestDemoPerspectiveFocus(): void {
  try {
    window.sessionStorage.setItem(DEMO_PERSPECTIVE_FOCUS_KEY, 'true');
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

export function consumeDemoPerspectiveFocus(): boolean {
  try {
    const shouldFocus = window.sessionStorage.getItem(DEMO_PERSPECTIVE_FOCUS_KEY) === 'true';

    if (shouldFocus) {
      window.sessionStorage.removeItem(DEMO_PERSPECTIVE_FOCUS_KEY);
    }

    return shouldFocus;
  } catch {
    return false;
  }
}

function subscribeDemoPerspective(listener: () => void): () => void {
  function onChange(): void {
    listener();
  }

  window.addEventListener('nami-demo-perspective-changed', onChange);
  window.addEventListener('nami-surface-role-changed', onChange);
  window.addEventListener('nami-membership-plan-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-demo-perspective-changed', onChange);
    window.removeEventListener('nami-surface-role-changed', onChange);
    window.removeEventListener('nami-membership-plan-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useDemoPerspective(): {
  activePerspective: DemoPerspectivePreset | null;
  isActive: boolean;
} {
  const activeId = useSyncExternalStore(
    subscribeDemoPerspective,
    readActiveDemoPerspectiveId,
    readActiveDemoPerspectiveId
  );

  const activePerspective =
    DEMO_PERSPECTIVE_PRESETS.find((preset) => preset.id === activeId) ?? null;

  return {
    activePerspective,
    isActive: activePerspective !== null,
  };
}