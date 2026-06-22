import { useSyncExternalStore } from 'react';

import {
  approvalRequestForApprover,
  createApprovalRequest,
  resolveApprovalRequestsForReference,
  updateApprovalRequestStatus,
} from './approval-requests-store.js';
import { initializeGuildHierarchy } from './guild-hierarchy-store.js';
import { isGameChannelOwner } from './channel-owner-access.js';
import { getSelfMember, isMemberVerified, memberFeatureTier, SELF_MEMBER_ID } from './member-access.js';
import { discoverableGuildSpaceMembers } from './guild-space-members.js';
import { deliverIncomingPrivateMessage } from './messages-store.js';
import { type NamiGuildRecord } from './nami-affiliations.js';
import { members, type NamiMember } from './uiMockData.js';

const PROPOSALS_KEY = 'nami.guild.creation-proposals';
const CREATED_GUILDS_KEY = 'nami.guild.created-records';
const COOLDOWN_KEY = 'nami.guild.creation-cooldown';

const COOLDOWN_DURATION_MS = 24 * 60 * 60 * 1000;
const MAX_GUILD_CREATION_FAILURES = 3;

export type GuildCofounderApproval = 'pending' | 'approved' | 'declined';

export type GuildCreationProposal = {
  id: string;
  proposedName: string;
  isPublic: boolean;
  creatorMemberId: string;
  creatorName: string;
  cofounderMemberIds: [string, string];
  cofounderNames: [string, string];
  approvals: Record<string, GuildCofounderApproval>;
  status: 'pending' | 'approved' | 'declined' | 'finalized';
  createdAt: string;
  declinedAt: string | null;
  finalizedGuildId: string | null;
};

export type GuildCreationResult =
  | { ok: true; proposal: GuildCreationProposal }
  | { ok: false; reason: string };

export type GuildCreationCooldown = {
  blocked: boolean;
  failureCount: number;
  remainingMs: number;
};

type GuildCreationCooldownState = {
  failureCount: number;
  cooldownUntil: string | null;
};

const listeners = new Set<() => void>();
let cachedProposals: GuildCreationProposal[] | null = null;
let cachedCreatedGuilds: NamiGuildRecord[] | null = null;

function emit(): void {
  cachedProposals = null;
  cachedCreatedGuilds = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readProposals(): GuildCreationProposal[] {
  try {
    const stored = window.localStorage.getItem(PROPOSALS_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as GuildCreationProposal[]) : [];
  } catch {
    return [];
  }
}

function writeProposals(proposals: GuildCreationProposal[]): void {
  window.localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
  emit();
}

function readCreatedGuilds(): NamiGuildRecord[] {
  try {
    const stored = window.localStorage.getItem(CREATED_GUILDS_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as NamiGuildRecord[]) : [];
  } catch {
    return [];
  }
}

function writeCreatedGuilds(guilds: NamiGuildRecord[]): void {
  window.localStorage.setItem(CREATED_GUILDS_KEY, JSON.stringify(guilds));
  emit();
}

function readCooldownState(): Record<string, GuildCreationCooldownState> {
  try {
    const stored = window.localStorage.getItem(COOLDOWN_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);

    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, GuildCreationCooldownState>)
      : {};
  } catch {
    return {};
  }
}

function writeCooldownState(next: Record<string, GuildCreationCooldownState>): void {
  window.localStorage.setItem(COOLDOWN_KEY, JSON.stringify(next));
  emit();
}

function getProposalSnapshot(): GuildCreationProposal[] {
  if (!cachedProposals) {
    cachedProposals = readProposals();
  }

  return cachedProposals;
}

export function useGuildCreationStore(): {
  proposals: GuildCreationProposal[];
  createdGuilds: NamiGuildRecord[];
} {
  const proposals = useSyncExternalStore(subscribe, getProposalSnapshot, getProposalSnapshot);
  const createdGuilds = useSyncExternalStore(
    subscribe,
    () => {
      if (!cachedCreatedGuilds) {
        cachedCreatedGuilds = readCreatedGuilds();
      }

      return cachedCreatedGuilds;
    },
    () => readCreatedGuilds()
  );

  return { proposals, createdGuilds };
}

export function channelOwnerOfficialGuildCount(memberId: string): number {
  return getCreatedGuildRecords().filter((guild) => guild.ownerMemberId === memberId).length;
}

function memberHasGuildCreationTier(member: NamiMember): boolean {
  const tier = member.id === SELF_MEMBER_ID ? memberFeatureTier(member) : member.tier;

  return tier !== 'NPC';
}

export function canMemberCreateGuild(member: NamiMember): boolean {
  if (!isMemberVerified(member) || !memberHasGuildCreationTier(member) || member.signal === 'Black') {
    return false;
  }

  if (isGameChannelOwner() && channelOwnerOfficialGuildCount(member.id) > 0) {
    return false;
  }

  return true;
}

export function membersEligibleForGuildCreation(excludeMemberIds: string[] = []): NamiMember[] {
  const excluded = new Set(excludeMemberIds);

  return discoverableGuildSpaceMembers().filter(
    (member) => !excluded.has(member.id) && canMemberCreateGuild(member)
  );
}

export function formatGuildCreationCooldownRemaining(remainingMs: number): string {
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return minutes + ' minute' + (minutes === 1 ? '' : 's');
  }

  if (minutes === 0) {
    return hours + ' hour' + (hours === 1 ? '' : 's');
  }

  return hours + ' hour' + (hours === 1 ? '' : 's') + ' ' + minutes + ' minutes';
}

export function getGuildCreationCooldown(memberId: string): GuildCreationCooldown {
  const all = readCooldownState();
  const current = all[memberId] ?? { failureCount: 0, cooldownUntil: null };

  if (!current.cooldownUntil) {
    return {
      blocked: false,
      failureCount: current.failureCount,
      remainingMs: 0,
    };
  }

  const until = new Date(current.cooldownUntil).getTime();
  const remainingMs = until - Date.now();

  if (remainingMs > 0) {
    return {
      blocked: true,
      failureCount: current.failureCount,
      remainingMs,
    };
  }

  writeCooldownState({
    ...all,
    [memberId]: { failureCount: 0, cooldownUntil: null },
  });

  return {
    blocked: false,
    failureCount: 0,
    remainingMs: 0,
  };
}

function recordGuildCreationFailure(creatorMemberId: string): void {
  const all = readCooldownState();
  const current = all[creatorMemberId] ?? { failureCount: 0, cooldownUntil: null };
  const nextFailureCount = current.failureCount + 1;

  writeCooldownState({
    ...all,
    [creatorMemberId]: {
      failureCount: nextFailureCount,
      cooldownUntil:
        nextFailureCount >= MAX_GUILD_CREATION_FAILURES
          ? new Date(Date.now() + COOLDOWN_DURATION_MS).toISOString()
          : current.cooldownUntil,
    },
  });
}

function resetGuildCreationFailures(creatorMemberId: string): void {
  const all = readCooldownState();

  if (!all[creatorMemberId]) {
    return;
  }

  writeCooldownState({
    ...all,
    [creatorMemberId]: { failureCount: 0, cooldownUntil: null },
  });
}

function allApprovalsMet(proposal: GuildCreationProposal): boolean {
  const requiredMemberIds = [proposal.creatorMemberId, ...proposal.cofounderMemberIds];

  return requiredMemberIds.every((memberId) => proposal.approvals[memberId] === 'approved');
}

function finalizeProposal(proposal: GuildCreationProposal): GuildCreationProposal {
  const guildId = 'guild-created-' + proposal.id;
  const createdGuild: NamiGuildRecord = {
    id: guildId,
    name: proposal.proposedName.trim() || 'New Guild',
    ownerMemberId: proposal.creatorMemberId,
    memberIds: [proposal.creatorMemberId, ...proposal.cofounderMemberIds],
    isPublic: proposal.isPublic,
  };

  writeCreatedGuilds([createdGuild, ...readCreatedGuilds()]);
  initializeGuildHierarchy(createdGuild, proposal.creatorMemberId, [...proposal.cofounderMemberIds]);
  resetGuildCreationFailures(proposal.creatorMemberId);

  return {
    ...proposal,
    status: 'finalized',
    finalizedGuildId: guildId,
  };
}

function notifyCreatorOfDecline(proposal: GuildCreationProposal, declinedByMemberId: string): void {
  const declinerName =
    proposal.cofounderMemberIds.includes(declinedByMemberId)
      ? proposal.cofounderNames[proposal.cofounderMemberIds.indexOf(declinedByMemberId)]!
      : 'A co-founder';

  deliverIncomingPrivateMessage({
    memberId: proposal.creatorMemberId,
    memberName: proposal.creatorName,
    body:
      declinerName +
      ' declined your guild creation proposal for ' +
      proposal.proposedName +
      '. You can try again with new co-founders.',
    authorName: declinerName,
    signal: 'Orange',
    markUnread: true,
  });
}

export function submitGuildCreationProposal(input: {
  proposedName: string;
  isPublic: boolean;
  cofounderMemberIds: string[];
}): GuildCreationResult {
  const selfMember = getSelfMember();

  if (!canMemberCreateGuild(selfMember)) {
    if (isGameChannelOwner() && channelOwnerOfficialGuildCount(selfMember.id) > 0) {
      return {
        ok: false,
        reason: 'Game channel owners can create only one official guild.',
      };
    }

    return { ok: false, reason: 'Only verified members can start guild creation.' };
  }

  const cooldown = getGuildCreationCooldown(selfMember.id);

  if (cooldown.blocked) {
    return {
      ok: false,
      reason:
        'Guild creation is on cooldown for ' +
        formatGuildCreationCooldownRemaining(cooldown.remainingMs) +
        ' after 3 declined attempts.',
    };
  }

  if (input.cofounderMemberIds.length !== 2) {
    return { ok: false, reason: 'Select exactly two verified co-founders to create a guild.' };
  }

  const uniqueCofounders = [...new Set(input.cofounderMemberIds)];

  if (uniqueCofounders.length !== 2) {
    return { ok: false, reason: 'Co-founders must be two different verified members.' };
  }

  if (uniqueCofounders.includes(selfMember.id)) {
    return { ok: false, reason: 'You cannot select yourself as a co-founder.' };
  }

  const cofounderMembers = uniqueCofounders
    .map((memberId) => members.find((member) => member.id === memberId))
    .filter((member): member is NamiMember => Boolean(member));

  if (cofounderMembers.length !== 2 || !cofounderMembers.every(canMemberCreateGuild)) {
    return { ok: false, reason: 'Each co-founder must be a verified member capable of guild creation.' };
  }

  const existingPending = readProposals().find(
    (proposal) => proposal.status === 'pending' && proposal.creatorMemberId === selfMember.id
  );

  if (existingPending) {
    return {
      ok: false,
      reason: 'Finish or wait for your current co-founder approvals before starting another guild.',
    };
  }

  const pendingDuplicate = readProposals().some(
    (proposal) =>
      proposal.status === 'pending' &&
      proposal.creatorMemberId === selfMember.id &&
      proposal.cofounderMemberIds.every((memberId) => uniqueCofounders.includes(memberId))
  );

  if (pendingDuplicate) {
    return { ok: false, reason: 'You already have a pending guild creation proposal with those co-founders.' };
  }

  const proposal: GuildCreationProposal = {
    id: 'guild-create-' + Date.now(),
    proposedName: input.proposedName.trim() || 'Untitled Guild',
    isPublic: input.isPublic,
    creatorMemberId: selfMember.id,
    creatorName: selfMember.name,
    cofounderMemberIds: [cofounderMembers[0]!.id, cofounderMembers[1]!.id],
    cofounderNames: [cofounderMembers[0]!.name, cofounderMembers[1]!.name],
    approvals: {
      [selfMember.id]: 'approved',
      [cofounderMembers[0]!.id]: 'pending',
      [cofounderMembers[1]!.id]: 'pending',
    },
    status: 'pending',
    createdAt: new Date().toISOString(),
    declinedAt: null,
    finalizedGuildId: null,
  };

  writeProposals([proposal, ...readProposals()]);

  for (const cofounder of cofounderMembers) {
    createApprovalRequest({
      kind: 'guild-cofounder',
      approverMemberId: cofounder.id,
      approverName: cofounder.name,
      senderMemberId: selfMember.id,
      senderName: selfMember.name,
      title: 'Guild co-founder approval · ' + proposal.proposedName,
      body:
        selfMember.name +
        ' invited you to co-found ' +
        proposal.proposedName +
        ' (' +
        (proposal.isPublic ? 'public' : 'private') +
        ' guild). Open this message to approve or decline.',
      referenceId: proposal.id,
    });
  }

  deliverIncomingPrivateMessage({
    memberId: selfMember.id,
    memberName: selfMember.name,
    body:
      'Guild creation proposal sent to ' +
      proposal.cofounderNames.join(' and ') +
      '. Waiting for co-founder approvals.',
    authorName: selfMember.name,
    signal: selfMember.signal,
    markUnread: false,
  });

  return { ok: true, proposal };
}

export function respondToGuildCreationProposal(
  proposalId: string,
  memberId: string,
  decision: 'approved' | 'declined'
): GuildCreationResult {
  const proposals = readProposals();
  const index = proposals.findIndex((proposal) => proposal.id === proposalId);

  if (index < 0) {
    return { ok: false, reason: 'Guild creation proposal not found.' };
  }

  const current = proposals[index]!;

  if (current.status !== 'pending') {
    return { ok: false, reason: 'That guild creation proposal is no longer pending.' };
  }

  const isCofounder = current.cofounderMemberIds.includes(memberId);

  if (!isCofounder) {
    return { ok: false, reason: 'Only invited co-founders can respond to this proposal.' };
  }

  if (current.approvals[memberId] !== 'pending') {
    return { ok: false, reason: 'You already responded to this guild creation proposal.' };
  }

  const nextApprovals = {
    ...current.approvals,
    [memberId]: decision,
  };

  if (decision === 'declined') {
    resolveApprovalRequestsForReference(current.id, 'declined');

    const declinedProposal: GuildCreationProposal = {
      ...current,
      approvals: nextApprovals,
      status: 'declined',
      declinedAt: new Date().toISOString(),
    };

    const nextProposals = [...proposals];
    nextProposals[index] = declinedProposal;
    writeProposals(nextProposals);
    recordGuildCreationFailure(current.creatorMemberId);
    notifyCreatorOfDecline(declinedProposal, memberId);

    return { ok: true, proposal: declinedProposal };
  }

  let nextProposal: GuildCreationProposal = {
    ...current,
    approvals: nextApprovals,
  };

  if (allApprovalsMet(nextProposal)) {
    resolveApprovalRequestsForReference(current.id, 'approved');
    nextProposal = finalizeProposal(nextProposal);
  } else {
    const approval = approvalRequestForApprover(current.id, memberId);

    if (approval) {
      updateApprovalRequestStatus(approval.id, 'approved');
    }
  }

  const nextProposals = [...proposals];
  nextProposals[index] = nextProposal;
  writeProposals(nextProposals);

  return { ok: true, proposal: nextProposal };
}

export function creatorPendingGuildProposals(memberId: string): GuildCreationProposal[] {
  return readProposals().filter(
    (proposal) => proposal.status === 'pending' && proposal.creatorMemberId === memberId
  );
}

export function cofounderPendingGuildApprovals(memberId: string): GuildCreationProposal[] {
  return readProposals().filter(
    (proposal) =>
      proposal.status === 'pending' &&
      proposal.cofounderMemberIds.includes(memberId) &&
      proposal.approvals[memberId] === 'pending'
  );
}

export function pendingCofounderApprovalsForProposal(
  proposal: GuildCreationProposal
): Array<{ memberId: string; memberName: string }> {
  return proposal.cofounderMemberIds
    .filter((memberId) => proposal.approvals[memberId] === 'pending')
    .map((memberId) => ({
      memberId,
      memberName:
        proposal.cofounderNames[proposal.cofounderMemberIds.indexOf(memberId)] ?? 'Co-founder',
    }));
}

/** @deprecated Use creatorPendingGuildProposals or cofounderPendingGuildApprovals */
export function pendingGuildCreationForMember(memberId: string): GuildCreationProposal[] {
  return [
    ...creatorPendingGuildProposals(memberId),
    ...cofounderPendingGuildApprovals(memberId),
  ];
}

export function getCreatedGuildRecords(): NamiGuildRecord[] {
  return readCreatedGuilds();
}

export function resetGuildCreationStateForTests(): void {
  window.localStorage.removeItem(PROPOSALS_KEY);
  window.localStorage.removeItem(CREATED_GUILDS_KEY);
  window.localStorage.removeItem(COOLDOWN_KEY);
  emit();
}