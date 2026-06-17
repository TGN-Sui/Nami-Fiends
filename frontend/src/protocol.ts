import {
  createNamiIndexerClient,
  loadChannelCardsForOwner,
  loadConductProtocolView,
  loadCustomizationProtocolView,
  loadGuildCardsForMember,
  loadIdentityProtocolView,
  loadOwnerChannelAccessPolicies,
  loadPassportProtocolView,
  loadProfileProtocolView,
  loadSquadsProtocolView,
  type AppealProjection,
  type BadgeHistoryEntry,
  type BoostHistoryEntry,
  type ChannelAccessPolicyView,
  type ChannelCardView,
  type ConductProtocolView,
  type CustomizationProtocolView,
  type GuildCardView,
  type IdentityProtocolView,
  type JuryCaseProjection,
  type MembershipProtocolView,
  type ModerationRecordProjection,
  type NamiIndexerClient,
  type PassportProtocolView,
  type ProfileProtocolView,
  type RecoveryProjection,
  type SquadCardView,
} from '@nami/sdk';

import {
  createConfiguredNamiClient,
  getConfiguredNetwork,
} from './nami.js';
import { isValidProtocolOwner, readDemoOwner, readIndexerUrl } from './protocol-env.js';

export type ProtocolDataMode = 'live' | 'mock';

export interface ProtocolContext {
  network: string;
  chain: ReturnType<typeof createConfiguredNamiClient>;
  indexer: NamiIndexerClient | null;
  demoOwner: string | null;
  indexerUrl: string | null;
}

export function getProtocolContext(): ProtocolContext {
  const chain = createConfiguredNamiClient();
  const indexerUrl = readIndexerUrl();
  const demoOwner = readDemoOwner();

  const indexer =
    indexerUrl !== null ? createNamiIndexerClient({ baseUrl: indexerUrl }) : null;

  return {
    network: getConfiguredNetwork(),
    chain,
    indexer,
    demoOwner,
    indexerUrl,
  };
}

function guardOwner(
  context: ProtocolContext,
  owner: string,
  options: { chain?: boolean; indexer?: boolean } = {}
): boolean {
  if (!isValidProtocolOwner(owner)) {
    return false;
  }

  if (options.chain !== false && context.chain === null) {
    return false;
  }

  if (options.indexer && context.indexer === null) {
    return false;
  }

  return true;
}

export async function fetchGuildCards(
  context: ProtocolContext,
  owner: string
): Promise<GuildCardView[]> {
  if (!guardOwner(context, owner, { indexer: true })) {
    return [];
  }

  return loadGuildCardsForMember(context.chain!, context.indexer!, owner);
}

export async function fetchPassportView(
  context: ProtocolContext,
  owner: string
): Promise<PassportProtocolView | null> {
  if (!guardOwner(context, owner)) {
    return null;
  }

  return loadPassportProtocolView(context.chain!, context.indexer, owner);
}

export async function fetchModerationQueues(context: ProtocolContext): Promise<{
  appeals: AppealProjection[];
  juryCases: JuryCaseProjection[];
}> {
  if (!context.indexer) {
    return { appeals: [], juryCases: [] };
  }

  const [appeals, juryCases] = await Promise.all([
    context.indexer.getOpenAppeals(),
    context.indexer.getOpenJuryCases(),
  ]);

  return { appeals, juryCases };
}

export async function fetchOpenRecoveryRequests(
  context: ProtocolContext
): Promise<RecoveryProjection[]> {
  if (!context.indexer) {
    return [];
  }

  return context.indexer.getOpenRecoveryRequests();
}

export async function fetchSquadCards(
  context: ProtocolContext,
  owner: string
): Promise<SquadCardView[]> {
  if (!guardOwner(context, owner)) {
    return [];
  }

  return loadSquadsProtocolView(context.chain!, context.indexer, owner);
}

export async function fetchChannelCards(
  context: ProtocolContext,
  owner: string
): Promise<ChannelCardView[]> {
  if (!guardOwner(context, owner, { indexer: true })) {
    return [];
  }

  return loadChannelCardsForOwner(context.chain!, context.indexer!, owner);
}

export async function fetchProfileView(
  context: ProtocolContext,
  owner: string
): Promise<ProfileProtocolView | null> {
  if (!guardOwner(context, owner)) {
    return null;
  }

  return loadProfileProtocolView(context.chain!, context.indexer, owner);
}

export async function fetchOwnerHistory(
  context: ProtocolContext,
  owner: string
): Promise<{
  badgeHistory: BadgeHistoryEntry[];
  boostHistory: BoostHistoryEntry[];
}> {
  if (!guardOwner(context, owner, { indexer: true })) {
    return { badgeHistory: [], boostHistory: [] };
  }

  const [badgeHistory, boostHistory] = await Promise.all([
    context.indexer!.getBadgeHistoryByOwner(owner),
    context.indexer!.getBoostHistoryByOwner(owner),
  ]);

  return { badgeHistory, boostHistory };
}

export async function fetchActiveModerationRecords(
  context: ProtocolContext
): Promise<ModerationRecordProjection[]> {
  if (!context.indexer) {
    return [];
  }

  return context.indexer.getActiveModerationRecords();
}

export async function fetchConductView(
  context: ProtocolContext,
  owner: string
): Promise<ConductProtocolView | null> {
  if (!guardOwner(context, owner)) {
    return null;
  }

  return loadConductProtocolView(context.chain!, owner);
}

export async function fetchIdentityView(
  context: ProtocolContext,
  owner: string
): Promise<IdentityProtocolView | null> {
  if (!guardOwner(context, owner)) {
    return null;
  }

  return loadIdentityProtocolView(context.chain!, owner);
}

export async function fetchCustomizationView(
  context: ProtocolContext,
  owner: string
): Promise<CustomizationProtocolView | null> {
  if (!guardOwner(context, owner)) {
    return null;
  }

  return loadCustomizationProtocolView(context.chain!, owner);
}

export async function fetchChannelAccessPolicies(
  context: ProtocolContext,
  owner: string
): Promise<ChannelAccessPolicyView[]> {
  if (!guardOwner(context, owner)) {
    return [];
  }

  return loadOwnerChannelAccessPolicies(context.chain!, context.indexer, owner);
}

export type {
  AppealProjection,
  BadgeHistoryEntry,
  BoostHistoryEntry,
  ChannelAccessPolicyView,
  ChannelCardView,
  ConductProtocolView,
  CustomizationProtocolView,
  GuildCardView,
  IdentityProtocolView,
  JuryCaseProjection,
  MembershipProtocolView,
  ModerationRecordProjection,
  PassportProtocolView,
  ProfileProtocolView,
  RecoveryProjection,
  SquadCardView,
} from '@nami/sdk';