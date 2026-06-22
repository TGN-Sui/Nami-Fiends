import { useSyncExternalStore } from 'react';

import { isGameChannelOwner } from './channel-owner-access.js';
import { canLeadSquadInvites } from './guild-space-access.js';
import { findDiscoverableGuildSpaceMember } from './guild-space-members.js';
import { getSelfMember, memberFeatureTier } from './member-access.js';
import type { PaidMembershipTier } from './membership-plans-store.js';
import { membershipPlanForTier } from './membership-plans-store.js';
import { namiSquads, type NamiSquadRecord } from './nami-affiliations.js';
import type { NamiMember } from './uiMockData.js';

const CREATED_SQUADS_KEY = 'nami.squad.created-records';

export type SquadCreationResult =
  | { ok: true; squad: NamiSquadRecord }
  | { ok: false; reason: string };

const listeners = new Set<() => void>();
let cachedSquads: NamiSquadRecord[] | null = null;

function emit(): void {
  cachedSquads = null;
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent('nami-squad-created-records-changed'));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function readCreatedSquads(): NamiSquadRecord[] {
  if (cachedSquads) {
    return cachedSquads;
  }

  try {
    const stored = window.localStorage.getItem(CREATED_SQUADS_KEY);

    if (!stored) {
      cachedSquads = [];
      return cachedSquads;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      cachedSquads = [];
      return cachedSquads;
    }

    const squads = parsed as NamiSquadRecord[];
    const normalized = squads.map(normalizeCreatedSquadMaxSlots);

    cachedSquads = normalized;

    if (normalized.some((squad, index) => squad.maxSlots !== squads[index]?.maxSlots)) {
      window.localStorage.setItem(CREATED_SQUADS_KEY, JSON.stringify(normalized));
    }

    return cachedSquads;
  } catch {
    cachedSquads = [];
    return cachedSquads;
  }
}

function getCreatedSquadSnapshot(): NamiSquadRecord[] {
  return readCreatedSquads();
}

function writeCreatedSquads(squads: NamiSquadRecord[]): void {
  window.localStorage.setItem(CREATED_SQUADS_KEY, JSON.stringify(squads));
  emit();
}

export function getCreatedSquadRecords(): NamiSquadRecord[] {
  return getCreatedSquadSnapshot();
}

export function createdSquadsForMember(memberId: string): NamiSquadRecord[] {
  return readCreatedSquads().filter((squad) => squad.memberIds.includes(memberId));
}

export function createdSquadById(squadId: string): NamiSquadRecord | undefined {
  return readCreatedSquads().find((squad) => squad.id === squadId);
}

function leaderMembershipTier(leaderId: string): PaidMembershipTier | 'NPC' | null {
  if (leaderId === getSelfMember().id) {
    return memberFeatureTier(getSelfMember());
  }

  const leader = findDiscoverableGuildSpaceMember(leaderId);
  const tier = leader?.tier;

  if (tier === 'Pro' || tier === 'Elite' || tier === 'Adventurer') {
    return tier;
  }

  return tier === 'NPC' ? 'NPC' : null;
}

function normalizeCreatedSquadMaxSlots(squad: NamiSquadRecord): NamiSquadRecord {
  const leaderId = squad.memberIds[0];

  if (!leaderId) {
    return squad;
  }

  const tier = leaderMembershipTier(leaderId);

  if (!tier || tier === 'NPC') {
    return squad;
  }

  const expectedMaxSlots = membershipPlanForTier(tier).squadSlots;

  if (squad.maxSlots === expectedMaxSlots) {
    return squad;
  }

  return { ...squad, maxSlots: expectedMaxSlots };
}

function squadsLedCount(memberId: string): number {
  const seen = new Set<string>();
  let count = 0;

  for (const squad of [...readCreatedSquads(), ...namiSquads]) {
    if (seen.has(squad.id)) {
      continue;
    }

    seen.add(squad.id);

    if (squad.memberIds[0] === memberId) {
      count += 1;
    }
  }

  return count;
}

function maxSquadsLedByMember(member: NamiMember): number {
  if (isGameChannelOwner() && member.id === getSelfMember().id) {
    return 1;
  }

  const tier = member.id === getSelfMember().id ? memberFeatureTier(member) : member.tier;

  if (tier === 'Pro' || tier === 'Elite') {
    return Number.MAX_SAFE_INTEGER;
  }

  return 0;
}

export function canMemberCreateSquad(member: NamiMember = getSelfMember()): boolean {
  if (!canLeadSquadInvites(member)) {
    return false;
  }

  return squadsLedCount(member.id) < maxSquadsLedByMember(member);
}

export function createMemberSquad(name: string): SquadCreationResult {
  const selfMember = getSelfMember();
  const trimmedName = name.trim();

  if (!canMemberCreateSquad(selfMember)) {
    return { ok: false, reason: 'Squad creation is unavailable for your membership tier.' };
  }

  if (trimmedName.length < 2) {
    return { ok: false, reason: 'Enter a squad name with at least 2 characters.' };
  }

  const tier = memberFeatureTier(selfMember);

  if (tier === 'NPC') {
    return { ok: false, reason: 'Squad creation is unavailable for your membership tier.' };
  }

  const maxSlots = membershipPlanForTier(tier).squadSlots;
  const squad: NamiSquadRecord = {
    id: 'squad-created-' + Date.now().toString(36),
    name: trimmedName,
    memberIds: [selfMember.id],
    maxSlots,
  };

  writeCreatedSquads([squad, ...readCreatedSquads()]);

  return { ok: true, squad };
}

export function useSquadCreationStore(): NamiSquadRecord[] {
  return useSyncExternalStore(subscribe, getCreatedSquadSnapshot, getCreatedSquadSnapshot);
}

export function resetSquadCreationStoreForTests(): void {
  try {
    window.localStorage.removeItem(CREATED_SQUADS_KEY);
  } catch {
    // Ignore restricted storage environments.
  }

  cachedSquads = null;
}