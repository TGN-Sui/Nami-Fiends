import type { NamiClient } from './client.js';
import type { NamiIndexerClient } from './indexer-client.js';
import { conductSignalLabel } from './labels.js';
import {
  parseChannelAccessPolicyObject,
  parseChannelObject,
  parseConductStatusObject,
  parseCosmeticLoadoutObject,
  parseGuildObject,
  parseIdentityObject,
  parsePassportObject,
  parseProfileObject,
  parseSquadObject,
  parseTitleDisplayObject,
  type ParsedChannelAccessPolicy,
  type ParsedChannel,
  type ParsedConductStatus,
  type ParsedCosmeticLoadout,
  type ParsedGuild,
  type ParsedIdentity,
  type ParsedPassport,
  type ParsedProfile,
  type ParsedSquad,
  type ParsedTitleDisplay,
} from './parsers.js';
import type {
  ChannelAccessProjection,
  ChannelProjection,
  GuildProjection,
  PassportTimelineProjection,
  ProfileProjection,
} from './projections.js';

export interface GuildCardView {
  id: string;
  title: string;
  subtitle: string;
  memberCount: number;
  isPublic: boolean;
  source: 'indexer' | 'chain' | 'merged';
}

export interface PassportProtocolView {
  owner: string;
  passport: ParsedPassport | null;
  timeline: PassportTimelineProjection | null;
  timelineEntryCount: number;
  snapshotLevel: number | null;
  snapshotTier: number | null;
}

export interface ChannelCardView {
  id: string;
  title: string;
  subtitle: string;
  isPublic: boolean;
  isVerified: boolean;
  source: 'indexer' | 'chain' | 'merged';
}

export interface ProfileProtocolView {
  owner: string;
  profile: ParsedProfile | null;
  projection: ProfileProjection | null;
  passport: ParsedPassport | null;
  timelineEntryCount: number;
  snapshotTier: number | null;
}

export interface MembershipProtocolView {
  owner: string;
  passport: ParsedPassport | null;
  tier: number | null;
  membershipTierLabel: string;
}

export interface SquadCardView {
  id: string;
  name: string;
  memberCount: number;
  maxSlots: number;
  owner: string;
  source: 'indexer' | 'chain' | 'merged';
}

async function fetchOnChainObject<T>(
  chain: NamiClient,
  objectId: string,
  parser: (payload: {
    objectId?: string;
    content?: { dataType?: string; fields?: Record<string, unknown> };
  }) => T | null
): Promise<T | null> {
  try {
    const object = await chain.getObject(objectId);
    const payload: {
      objectId?: string;
      content?: { dataType?: string; fields?: Record<string, unknown> };
    } = {
      content: object.data?.content as {
        dataType?: string;
        fields?: Record<string, unknown>;
      },
    };

    if (object.data?.objectId) {
      payload.objectId = object.data.objectId;
    }

    return parser(payload);
  } catch {
    return null;
  }
}

function channelTitle(
  projection: ChannelProjection,
  onChain: ParsedChannel | null
): string {
  const onChainName = onChain?.name?.trim();

  if (onChainName) {
    return onChainName;
  }

  if (projection.id) {
    return `Channel ${projection.id.slice(0, 10)}…`;
  }

  return 'Channel';
}

function guildTitle(
  projection: GuildProjection,
  onChain: ParsedGuild | null
): string {
  const onChainName = onChain?.name?.trim();

  if (onChainName) {
    return onChainName;
  }

  if (projection.id) {
    return `Guild ${projection.id.slice(0, 10)}…`;
  }

  return 'Guild';
}

export async function loadMembershipProtocolView(
  chain: NamiClient,
  owner: string
): Promise<MembershipProtocolView> {
  const owned = await chain.getOwnedPassports(owner);
  const passport = owned[0] ? parseOwnedObject(owned[0], parsePassportObject) : null;

  return {
    owner,
    passport,
    tier: passport?.tier ?? null,
    membershipTierLabel: passport?.membershipTierLabel ?? 'Unknown',
  };
}

export async function loadSquadsProtocolView(
  chain: NamiClient,
  indexer: NamiIndexerClient | null,
  owner: string
): Promise<SquadCardView[]> {
  const [projections, ownedSquads] = await Promise.all([
    indexer ? indexer.getMemberSquads(owner) : Promise.resolve([]),
    chain.getOwnedSquads(owner),
  ]);

  const onChainById = new Map<string, ParsedSquad>();

  for (const owned of ownedSquads) {
    const parsed = parseOwnedObject(owned, parseSquadObject);

    if (parsed?.objectId) {
      onChainById.set(parsed.objectId, parsed);
    }
  }

  const squadIds = new Set<string>([
    ...projections.map((squad) => squad.id),
    ...onChainById.keys(),
  ]);

  return [...squadIds].map((id) => {
    const projection = projections.find((squad) => squad.id === id) ?? null;
    const onChain = onChainById.get(id) ?? null;
    const name = onChain?.name?.trim() || `Squad ${id.slice(0, 8)}…`;

    return {
      id,
      name,
      memberCount: projection?.member_count ?? onChain?.memberCount ?? 0,
      maxSlots: projection?.max_slots ?? onChain?.maxSlots ?? 0,
      owner: projection?.owner ?? onChain?.owner ?? '',
      source:
        projection && onChain ? 'merged' : projection ? 'indexer' : onChain ? 'chain' : 'indexer',
    } satisfies SquadCardView;
  });
}

export async function loadGuildCardsForMember(
  chain: NamiClient,
  indexer: NamiIndexerClient | null,
  member: string
): Promise<GuildCardView[]> {
  if (!indexer) {
    return [];
  }

  const projections = await indexer.getMemberGuilds(member);

  return Promise.all(
    projections.map(async (projection) => {
      let onChain: ParsedGuild | null = null;

      onChain = await fetchOnChainObject(chain, projection.id, parseGuildObject);

      return {
        id: projection.id,
        title: guildTitle(projection, onChain),
        subtitle: onChain?.description?.trim() || `${projection.member_count} member(s)`,
        memberCount: projection.member_count,
        isPublic: projection.is_public,
        source: onChain ? 'merged' : 'indexer',
      } satisfies GuildCardView;
    })
  );
}

export async function loadPassportProtocolView(
  chain: NamiClient,
  indexer: NamiIndexerClient | null,
  owner: string
): Promise<PassportProtocolView> {
  const owned = await chain.getOwnedPassports(owner);
  const passport = owned[0] ? parseOwnedObject(owned[0], parsePassportObject) : null;

  let timeline: PassportTimelineProjection | null = null;
  let timelineEntryCount = 0;
  let snapshotLevel: number | null = null;
  let snapshotTier: number | null = null;

  if (indexer && passport?.objectId) {
    timeline = await indexer.getPassportTimeline(passport.objectId, { limit: 50 });

    if (timeline) {
      timelineEntryCount = timeline.entry_count;
      snapshotLevel = timeline.snapshot.level;
      snapshotTier = timeline.snapshot.tier;
    }
  }

  return {
    owner,
    passport,
    timeline,
    timelineEntryCount,
    snapshotLevel,
    snapshotTier,
  };
}

export async function loadChannelCardsForOwner(
  chain: NamiClient,
  indexer: NamiIndexerClient | null,
  owner: string
): Promise<ChannelCardView[]> {
  if (!indexer) {
    return [];
  }

  const projections = await indexer.getOwnerChannels(owner);

  return Promise.all(
    projections.map(async (projection) => {
      const onChain = await fetchOnChainObject(chain, projection.id, parseChannelObject);

      return {
        id: projection.id,
        title: channelTitle(projection, onChain),
        subtitle:
          onChain?.description?.trim() ||
          (projection.is_verified ? 'Verified channel' : 'Indexed channel'),
        isPublic: projection.is_public,
        isVerified: projection.is_verified || onChain?.isVerified === true,
        source: onChain ? 'merged' : 'indexer',
      } satisfies ChannelCardView;
    })
  );
}

export async function loadProfileProtocolView(
  chain: NamiClient,
  indexer: NamiIndexerClient | null,
  owner: string
): Promise<ProfileProtocolView> {
  const [ownedProfiles, ownedPassports] = await Promise.all([
    chain.getOwnedProfiles(owner),
    chain.getOwnedPassports(owner),
  ]);

  const profile = ownedProfiles[0]
    ? parseOwnedObject(ownedProfiles[0], parseProfileObject)
    : null;
  const passport = ownedPassports[0]
    ? parseOwnedObject(ownedPassports[0], parsePassportObject)
    : null;

  let projection: ProfileProjection | null = null;
  let timelineEntryCount = 0;
  let snapshotTier: number | null = null;

  if (indexer) {
    const queries: Promise<void>[] = [
      indexer.getProfileByOwner(owner).then((result) => {
        projection = result;
      }),
    ];

    if (passport?.objectId) {
      queries.push(
        indexer.getPassportTimeline(passport.objectId, { limit: 1 }).then((timeline) => {
          if (timeline) {
            timelineEntryCount = timeline.entry_count;
            snapshotTier = timeline.snapshot.tier;
          }
        })
      );
    }

    await Promise.all(queries);
  }

  return {
    owner,
    profile,
    projection,
    passport,
    timelineEntryCount,
    snapshotTier,
  };
}

export interface IdentityProtocolView {
  owner: string;
  identity: ParsedIdentity | null;
}

export interface ConductProtocolView {
  owner: string;
  conduct: ParsedConductStatus | null;
}

export interface CustomizationProtocolView {
  owner: string;
  titleDisplay: ParsedTitleDisplay | null;
  cosmeticLoadout: ParsedCosmeticLoadout | null;
}

export interface ChannelAccessPolicyView {
  channelId: string;
  projection: ChannelAccessProjection | null;
  onChain: ParsedChannelAccessPolicy | null;
  source: 'indexer' | 'chain' | 'merged' | 'none';
}

export interface ChannelAccessCheckView {
  channelId: string;
  policy: ChannelAccessProjection | null;
  passportTier: number | null;
  passportReputation: number | null;
  conductSignal: number | null;
  conductSignalLabel: string;
  meetsTier: boolean;
  meetsReputation: boolean;
  npcChatAllowed: boolean;
  likelyAllowed: boolean;
}

function parseOwnedObject<T>(
  owned: { data?: { objectId?: string; content?: unknown } | null },
  parser: (payload: {
    objectId?: string;
    content?: { dataType?: string; fields?: Record<string, unknown> };
  }) => T | null
): T | null {
  if (!owned.data) {
    return null;
  }

  const payload: {
    objectId?: string;
    content?: { dataType?: string; fields?: Record<string, unknown> };
  } = {
    content: owned.data.content as {
      dataType?: string;
      fields?: Record<string, unknown>;
    },
  };

  if (owned.data.objectId) {
    payload.objectId = owned.data.objectId;
  }

  return parser(payload);
}

export async function loadIdentityProtocolView(
  chain: NamiClient,
  owner: string
): Promise<IdentityProtocolView> {
  const owned = await chain.getOwnedIdentities(owner);
  const identity = owned[0] ? parseOwnedObject(owned[0], parseIdentityObject) : null;

  return { owner, identity };
}

export async function loadConductProtocolView(
  chain: NamiClient,
  owner: string
): Promise<ConductProtocolView> {
  const owned = await chain.getOwnedConductStatuses(owner);
  const conduct = owned[0] ? parseOwnedObject(owned[0], parseConductStatusObject) : null;

  return { owner, conduct };
}

export async function loadCustomizationProtocolView(
  chain: NamiClient,
  owner: string
): Promise<CustomizationProtocolView> {
  const [titleOwned, cosmeticOwned] = await Promise.all([
    chain.getOwnedTitleDisplays(owner),
    chain.getOwnedCosmeticLoadouts(owner),
  ]);

  return {
    owner,
    titleDisplay: titleOwned[0]
      ? parseOwnedObject(titleOwned[0], parseTitleDisplayObject)
      : null,
    cosmeticLoadout: cosmeticOwned[0]
      ? parseOwnedObject(cosmeticOwned[0], parseCosmeticLoadoutObject)
      : null,
  };
}

export async function loadOwnerChannelAccessPolicies(
  chain: NamiClient,
  indexer: NamiIndexerClient | null,
  owner: string
): Promise<ChannelAccessPolicyView[]> {
  const [indexerPolicies, ownedPolicies] = await Promise.all([
    indexer ? indexer.getOwnerChannelAccessPolicies(owner) : Promise.resolve([]),
    chain.getOwnedChannelAccessPolicies(owner),
  ]);

  const onChainByChannel = new Map<string, ParsedChannelAccessPolicy>();

  for (const owned of ownedPolicies) {
    const parsed = parseOwnedObject(owned, parseChannelAccessPolicyObject);

    if (parsed?.channelId) {
      onChainByChannel.set(parsed.channelId, parsed);
    }
  }

  const channelIds = new Set<string>([
    ...indexerPolicies.map((policy) => policy.channel_id),
    ...onChainByChannel.keys(),
  ]);

  return [...channelIds].map((channelId) => {
    const projection =
      indexerPolicies.find((policy) => policy.channel_id === channelId) ?? null;
    const onChain = onChainByChannel.get(channelId) ?? null;

    return {
      channelId,
      projection,
      onChain,
      source:
        projection && onChain ? 'merged' : projection ? 'indexer' : onChain ? 'chain' : 'none',
    } satisfies ChannelAccessPolicyView;
  });
}

export async function checkChannelAccessRead(
  chain: NamiClient,
  indexer: NamiIndexerClient | null,
  owner: string,
  channelId: string
): Promise<ChannelAccessCheckView> {
  const [passportOwned, conductOwned, policyProjection] = await Promise.all([
    chain.getOwnedPassports(owner),
    chain.getOwnedConductStatuses(owner),
    indexer ? indexer.getChannelAccessPolicy(channelId) : Promise.resolve(null),
  ]);

  const passport = passportOwned[0]
    ? parseOwnedObject(passportOwned[0], parsePassportObject)
    : null;
  const conduct = conductOwned[0]
    ? parseOwnedObject(conductOwned[0], parseConductStatusObject)
    : null;

  const passportTier = passport?.tier ?? null;
  const passportReputation = passport?.reputation ?? null;
  const conductSignal = conduct?.signal ?? null;
  const signalLabel = conductSignal !== null ? conductSignalLabel(conductSignal) : 'Unknown';

  const policy = policyProjection;
  const meetsTier =
    policy === null || passportTier === null ? false : passportTier >= policy.minimum_tier;
  const meetsReputation =
    policy === null ||
    passportReputation === null
      ? false
      : passportReputation >= policy.minimum_reputation;

  const isBlack = conductSignal === 4;
  const npcChatAllowed = policy?.allow_npc_chat === true && !isBlack;
  const likelyAllowed = policy !== null && meetsTier && meetsReputation && !isBlack;

  return {
    channelId,
    policy,
    passportTier,
    passportReputation,
    conductSignal,
    conductSignalLabel: signalLabel,
    meetsTier,
    meetsReputation,
    npcChatAllowed,
    likelyAllowed,
  };
}