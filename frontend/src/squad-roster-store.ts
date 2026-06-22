import { useSyncExternalStore } from 'react';

import {
  approvalRequestByReference,
  createApprovalRequest,
  updateApprovalRequestStatus,
} from './approval-requests-store.js';
import { isGameChannelOwner } from './channel-owner-access.js';
import { canLeadSquadInvites } from './guild-space-access.js';
import { getSelfMember } from './member-access.js';
import { deliverIncomingPrivateMessage } from './messages-store.js';
import { unlockAdventurerBenefitsForMember } from './squad-benefits-store.js';
import {
  effectiveMemberTier,
  membershipPlanForTier,
  type PaidMembershipTier,
} from './membership-plans-store.js';
import {
  namiSquads,
  squadsForMember,
  type NamiSquadRecord,
} from './nami-affiliations.js';
import { members, type NamiMember } from './uiMockData.js';

const INVITES_KEY = 'nami.squad.invites';
const ROSTER_KEY = 'nami.squad.roster-overrides';

export type SquadInviteStatus = 'pending' | 'accepted' | 'declined';

export type SquadInvite = {
  id: string;
  squadId: string;
  squadName: string;
  inviterMemberId: string;
  inviterName: string;
  targetMemberId: string;
  targetMemberName: string;
  status: SquadInviteStatus;
  createdAt: string;
};

export type SquadInviteResult =
  | { ok: true; invite: SquadInvite }
  | { ok: false; reason: string };

type SquadRosterOverride = {
  addedMemberIds: string[];
  removedMemberIds: string[];
};

const listeners = new Set<() => void>();
let cachedInvites: SquadInvite[] | null = null;
let cachedRoster: Record<string, SquadRosterOverride> | null = null;

function emit(): void {
  cachedInvites = null;
  cachedRoster = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readInvites(): SquadInvite[] {
  try {
    const stored = window.localStorage.getItem(INVITES_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as SquadInvite[]) : [];
  } catch {
    return [];
  }
}

function writeInvites(invites: SquadInvite[]): void {
  window.localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
  emit();
}

function readRosterOverrides(): Record<string, SquadRosterOverride> {
  try {
    const stored = window.localStorage.getItem(ROSTER_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, SquadRosterOverride>;

    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeRosterOverrides(next: Record<string, SquadRosterOverride>): void {
  window.localStorage.setItem(ROSTER_KEY, JSON.stringify(next));
  emit();
}

export function useSquadRosterStore(): {
  invites: SquadInvite[];
  rosterOverrides: Record<string, SquadRosterOverride>;
} {
  const invites = useSyncExternalStore(
    subscribe,
    () => {
      if (!cachedInvites) {
        cachedInvites = readInvites();
      }

      return cachedInvites;
    },
    () => readInvites()
  );

  const rosterOverrides = useSyncExternalStore(
    subscribe,
    () => {
      if (!cachedRoster) {
        cachedRoster = readRosterOverrides();
      }

      return cachedRoster;
    },
    () => readRosterOverrides()
  );

  return { invites, rosterOverrides };
}

export function squadSlotsFromMembership(): number {
  return squadSlotsForLeader(getSelfMember().id);
}

export function squadSlotsForLeader(memberId: string): number {
  const member = members.find((entry) => entry.id === memberId);
  const tier: PaidMembershipTier =
    memberId === getSelfMember().id
      ? effectiveMemberTier()
      : member?.tier === 'Pro' || member?.tier === 'Elite' || member?.tier === 'Adventurer'
        ? member.tier
        : 'Adventurer';

  if (member?.tier === 'NPC') {
    return 0;
  }

  if (isGameChannelOwner() && memberId === getSelfMember().id) {
    return 1;
  }

  return membershipPlanForTier(tier).squadSlots;
}

export function squadsLedByMember(memberId: string): NamiSquadRecord[] {
  return namiSquads.filter((squad) => squad.memberIds[0] === memberId);
}

export function effectiveSquadMemberIds(squad: NamiSquadRecord): string[] {
  const override = readRosterOverrides()[squad.id] ?? {
    addedMemberIds: [],
    removedMemberIds: [],
  };

  const baseIds = squad.memberIds.filter((memberId) => !override.removedMemberIds.includes(memberId));

  return [...new Set([...baseIds, ...override.addedMemberIds])];
}

export function pendingSquadInvitesFromLeader(memberId: string = getSelfMember().id): SquadInvite[] {
  return readInvites().filter(
    (invite) => invite.inviterMemberId === memberId && invite.status === 'pending'
  );
}

export function usedSquadInviteSlots(memberId: string = getSelfMember().id): number {
  return squadsLedByMember(memberId).reduce((total, squad) => {
    const roster = effectiveSquadMemberIds(squad);

    return total + Math.max(0, roster.length - 1);
  }, 0);
}

export function reservedSquadInviteSlots(memberId: string = getSelfMember().id): number {
  return pendingSquadInvitesFromLeader(memberId).length;
}

export function availableSquadInviteSlots(memberId: string = getSelfMember().id): number {
  return Math.max(
    0,
    squadSlotsForLeader(memberId) - usedSquadInviteSlots(memberId) - reservedSquadInviteSlots(memberId)
  );
}

export function invitableSquadsForMember(memberId: string = getSelfMember().id): NamiSquadRecord[] {
  return squadsLedByMember(memberId).filter((squad) => {
    const roster = effectiveSquadMemberIds(squad);

    return roster.length < squad.maxSlots;
  });
}

export function invitableSquadsForTarget(targetMemberId: string): NamiSquadRecord[] {
  const selfMember = getSelfMember();

  if (!canLeadSquadInvites(selfMember) || availableSquadInviteSlots(selfMember.id) <= 0) {
    return [];
  }

  if (targetMemberId === selfMember.id) {
    return [];
  }

  const targetMember = members.find((member) => member.id === targetMemberId);

  if (!targetMember || targetMember.signal === 'Black') {
    return [];
  }

  return invitableSquadsForMember(selfMember.id).filter((squad) => {
    const roster = effectiveSquadMemberIds(squad);

    if (roster.includes(targetMemberId)) {
      return false;
    }

    return !readInvites().some(
      (invite) =>
        invite.squadId === squad.id &&
        invite.targetMemberId === targetMemberId &&
        invite.status === 'pending'
    );
  });
}

export function canInviteMemberToAnySquad(targetMember: NamiMember): boolean {
  return invitableSquadsForTarget(targetMember.id).length > 0;
}

export function membersEligibleForSquadInvite(
  squad: NamiSquadRecord,
  searchQuery: string = ''
): NamiMember[] {
  const selfMember = getSelfMember();
  const roster = new Set(effectiveSquadMemberIds(squad));
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return members.filter((member) => {
    if (member.id === selfMember.id || member.signal === 'Black' || roster.has(member.id)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return (
      member.name.toLowerCase().includes(normalizedQuery) ||
      member.badge.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function sendSquadInvite(squad: NamiSquadRecord, targetMember: NamiMember): SquadInviteResult {
  const selfMember = getSelfMember();

  if (squad.memberIds[0] !== selfMember.id) {
    return { ok: false, reason: 'Only the squad leader can send squad invites.' };
  }

  if (availableSquadInviteSlots(selfMember.id) <= 0) {
    return {
      ok: false,
      reason: 'No squad slots available on your membership plan. Upgrade to add more squad members.',
    };
  }

  const roster = effectiveSquadMemberIds(squad);

  if (roster.length >= squad.maxSlots) {
    return { ok: false, reason: squad.name + ' is full (' + squad.maxSlots + '/' + squad.maxSlots + ' slots).' };
  }

  if (roster.includes(targetMember.id)) {
    return { ok: false, reason: targetMember.name + ' is already in ' + squad.name + '.' };
  }

  const pendingInvite = readInvites().some(
    (invite) =>
      invite.squadId === squad.id &&
      invite.targetMemberId === targetMember.id &&
      invite.status === 'pending'
  );

  if (pendingInvite) {
    return { ok: false, reason: 'An invite is already pending for ' + targetMember.name + '.' };
  }

  const invite: SquadInvite = {
    id: 'squad-invite-' + Date.now(),
    squadId: squad.id,
    squadName: squad.name,
    inviterMemberId: selfMember.id,
    inviterName: selfMember.name,
    targetMemberId: targetMember.id,
    targetMemberName: targetMember.name,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  writeInvites([invite, ...readInvites()]);

  createApprovalRequest({
    kind: 'squad-invite',
    approverMemberId: targetMember.id,
    approverName: targetMember.name,
    senderMemberId: selfMember.id,
    senderName: selfMember.name,
    title: 'Squad invite · ' + squad.name,
    body:
      selfMember.name +
      ' invited you to join ' +
      squad.name +
      '. Approve to enter the squad roster and unlock Adventurer benefits.',
    referenceId: invite.id,
  });

  deliverIncomingPrivateMessage({
    memberId: selfMember.id,
    memberName: selfMember.name,
    body:
      'Squad invite sent to ' +
      targetMember.name +
      ' for ' +
      squad.name +
      '. Waiting for approval.',
    authorName: selfMember.name,
    signal: selfMember.signal,
    markUnread: false,
  });

  return { ok: true, invite };
}

export function squadInviteById(inviteId: string): SquadInvite | undefined {
  return readInvites().find((invite) => invite.id === inviteId);
}

export function acceptSquadInvite(inviteId: string): SquadInviteResult {
  if (isGameChannelOwner()) {
    return {
      ok: false,
      reason: 'Game channel owners lead one squad and cannot join other squads.',
    };
  }

  const invites = readInvites();
  const index = invites.findIndex((invite) => invite.id === inviteId);

  if (index < 0) {
    return { ok: false, reason: 'Squad invite not found.' };
  }

  const invite = invites[index]!;

  if (invite.status !== 'pending') {
    return { ok: false, reason: 'That squad invite is no longer pending.' };
  }

  const leaderSlots = squadSlotsForLeader(invite.inviterMemberId);
  const usedSlots = usedSquadInviteSlots(invite.inviterMemberId);
  const reservedSlots = pendingSquadInvitesFromLeader(invite.inviterMemberId).filter(
    (entry) => entry.id !== inviteId
  ).length;

  if (usedSlots + reservedSlots >= leaderSlots) {
    return {
      ok: false,
      reason: 'The squad leader no longer has an open squad slot for this invite.',
    };
  }

  const squad = namiSquads.find((entry) => entry.id === invite.squadId);

  if (!squad) {
    return { ok: false, reason: 'Squad no longer exists.' };
  }

  const roster = effectiveSquadMemberIds(squad);

  if (roster.length >= squad.maxSlots) {
    return { ok: false, reason: invite.squadName + ' is already full.' };
  }

  const overrides = readRosterOverrides();
  const squadOverride = overrides[squad.id] ?? { addedMemberIds: [], removedMemberIds: [] };

  writeRosterOverrides({
    ...overrides,
    [squad.id]: {
      ...squadOverride,
      addedMemberIds: [...squadOverride.addedMemberIds, invite.targetMemberId],
    },
  });

  const nextInvites = [...invites];
  nextInvites[index] = { ...invite, status: 'accepted' };
  writeInvites(nextInvites);
  unlockAdventurerBenefitsForMember(invite.targetMemberId);
  updateApprovalRequestByReference(inviteId, 'approved');

  return { ok: true, invite: nextInvites[index]! };
}

export function declineSquadInvite(inviteId: string): SquadInviteResult {
  const invites = readInvites();
  const index = invites.findIndex((invite) => invite.id === inviteId);

  if (index < 0) {
    return { ok: false, reason: 'Squad invite not found.' };
  }

  const invite = invites[index]!;

  if (invite.status !== 'pending') {
    return { ok: false, reason: 'That squad invite is no longer pending.' };
  }

  const nextInvites = [...invites];
  nextInvites[index] = { ...invite, status: 'declined' };
  writeInvites(nextInvites);

  return { ok: true, invite: nextInvites[index]! };
}

export function respondToSquadInviteApproval(
  inviteId: string,
  decision: 'approved' | 'declined'
): SquadInviteResult {
  if (decision === 'approved') {
    const result = acceptSquadInvite(inviteId);

    if (result.ok) {
      updateApprovalRequestByReference(inviteId, 'approved');
    }

    return result;
  }

  const result = declineSquadInvite(inviteId);

  if (result.ok) {
    updateApprovalRequestByReference(inviteId, 'declined');
  }

  return result;
}

function updateApprovalRequestByReference(
  referenceId: string,
  status: 'approved' | 'declined'
): void {
  const match = approvalRequestByReference(referenceId);

  if (match) {
    updateApprovalRequestStatus(match.id, status);
  }
}

export function squadsAvailableToSelf(): NamiSquadRecord[] {
  const selfId = getSelfMember().id;

  return [...squadsForMember(selfId), ...squadsLedByMember(selfId)].filter(
    (squad, index, list) => list.findIndex((entry) => entry.id === squad.id) === index
  );
}