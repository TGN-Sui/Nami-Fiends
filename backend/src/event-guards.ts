import type { NamiEventData } from './types/events.js';

type FieldType = 'address' | 'u8' | 'u64' | 'bool' | 'bytes';

type EventSchema = Record<string, FieldType>;

export const KNOWN_EVENT_NAMES = [
  'IdentityCreated',
  'PassportCreated',
  'XPAdded',
  'BadgePointsAdded',
  'TierUpgraded',
  'IdentityVerified',
  'BadgeMinted',
  'BadgeIssuerCreated',
  'BadgeIssuedByIssuer',
  'BoostUsed',
  'ChannelCreated',
  'ChannelUpdated',
  'ChannelVerified',
  'ChannelAccessPolicyCreated',
  'ChannelAccessRuleUpdated',
  'ConductStatusCreated',
  'ConductSignalUpdated',
  'PassportDowned',
  'PassportRespawned',
  'WarningIssued',
  'MuteIssued',
  'ChannelBanIssued',
  'BlackPassportIssued',
  'AdminAction',
  'AppealOpened',
  'AppealResolved',
  'JuryCaseOpened',
  'JuryVoteSubmitted',
  'JuryCaseClosed',
  'SquadCreated',
  'SquadMemberSponsored',
  'GuildCreated',
  'GuildMemberAdded',
  'GuildUpdated',
  'ProfileCreated',
  'ProfileUpdated',
  'NodenameRegistered',
  'EnterNamiCompleted',
  'TitleClaimed',
  'TitleDisplayCreated',
  'TitleEquipped',
  'CosmeticUnlocked',
  'CosmeticLoadoutCreated',
  'CosmeticEquipped',
  'RecoveryRequested',
  'RecoveryResolved',
] as const;

export type NamiEventName = (typeof KNOWN_EVENT_NAMES)[number];

const KNOWN_EVENT_NAME_SET = new Set<string>(KNOWN_EVENT_NAMES);

const EVENT_SCHEMAS: Record<NamiEventName, EventSchema> = {
  IdentityCreated: { identity_id: 'address', owner: 'address' },
  PassportCreated: { passport_id: 'address', identity_id: 'address' },
  XPAdded: {
    passport_id: 'address',
    amount: 'u64',
    total_xp: 'u64',
    level: 'u64',
    level_progress: 'u64',
  },
  BadgePointsAdded: {
    passport_id: 'address',
    amount: 'u64',
    total: 'u64',
    reputation: 'u64',
  },
  TierUpgraded: {
    passport_id: 'address',
    old_tier: 'u8',
    new_tier: 'u8',
  },
  IdentityVerified: {
    identity_id: 'address',
    passport_id: 'address',
    owner: 'address',
    source: 'u8',
    verification_level: 'u8',
  },
  BadgeMinted: { owner: 'address', badge_type: 'u8', points: 'u64' },
  BadgeIssuerCreated: {
    owner: 'address',
    issuer_id: 'address',
    issuer_type: 'u8',
    can_issue_basic: 'bool',
    can_issue_event: 'bool',
    can_issue_completion: 'bool',
  },
  BadgeIssuedByIssuer: {
    issuer_id: 'address',
    issuer_type: 'u8',
    recipient: 'address',
    badge_type: 'u8',
  },
  BoostUsed: {
    owner: 'address',
    channel_id: 'address',
    power: 'u64',
    tier: 'u8',
    week_id: 'u64',
  },
  ChannelCreated: {
    channel_id: 'address',
    owner: 'address',
    owner_passport_id: 'address',
    is_public: 'bool',
  },
  ChannelUpdated: {
    channel_id: 'address',
    owner: 'address',
    is_public: 'bool',
  },
  ChannelVerified: { channel_id: 'address', owner: 'address' },
  ChannelAccessPolicyCreated: {
    owner: 'address',
    channel_id: 'address',
    allow_npc_chat: 'bool',
    minimum_tier: 'u8',
    minimum_reputation: 'u64',
  },
  ChannelAccessRuleUpdated: {
    owner: 'address',
    channel_id: 'address',
    allow_npc_chat: 'bool',
    minimum_tier: 'u8',
    minimum_reputation: 'u64',
  },
  ConductStatusCreated: {
    owner: 'address',
    passport_id: 'address',
    signal: 'u8',
  },
  ConductSignalUpdated: {
    owner: 'address',
    passport_id: 'address',
    old_signal: 'u8',
    new_signal: 'u8',
    reason_code: 'u64',
    expires_at_ms: 'u64',
  },
  PassportDowned: {
    owner: 'address',
    passport_id: 'address',
    reason_code: 'u64',
    respawn_at_ms: 'u64',
  },
  PassportRespawned: {
    owner: 'address',
    passport_id: 'address',
    restored_signal: 'u8',
  },
  WarningIssued: {
    moderator: 'address',
    target_owner: 'address',
    passport_id: 'address',
    reason_code: 'u64',
  },
  MuteIssued: {
    moderator: 'address',
    target_owner: 'address',
    passport_id: 'address',
    channel_id: 'address',
    reason_code: 'u64',
    expires_at_ms: 'u64',
  },
  ChannelBanIssued: {
    moderator: 'address',
    target_owner: 'address',
    passport_id: 'address',
    channel_id: 'address',
    reason_code: 'u64',
    expires_at_ms: 'u64',
  },
  BlackPassportIssued: {
    moderator: 'address',
    target_owner: 'address',
    passport_id: 'address',
    reason_code: 'u64',
    respawn_at_ms: 'u64',
  },
  AdminAction: {
    admin_cap_id: 'address',
    action_type: 'u8',
    target: 'address',
  },
  AppealOpened: {
    appeal_id: 'address',
    appellant: 'address',
    passport_id: 'address',
    moderation_record_id: 'address',
    moderation_action_type: 'u8',
    moderation_reason_code: 'u64',
  },
  AppealResolved: {
    appeal_id: 'address',
    appellant: 'address',
    passport_id: 'address',
    result_status: 'u8',
    resolution_code: 'u64',
  },
  JuryCaseOpened: {
    jury_case_id: 'address',
    appeal_id: 'address',
    appellant: 'address',
    passport_id: 'address',
    required_votes: 'u8',
  },
  JuryVoteSubmitted: {
    jury_case_id: 'address',
    appeal_id: 'address',
    vote: 'u8',
  },
  JuryCaseClosed: {
    jury_case_id: 'address',
    appeal_id: 'address',
    final_recommendation: 'u8',
    approve_votes: 'u8',
    deny_votes: 'u8',
    modify_votes: 'u8',
  },
  SquadCreated: {
    squad_id: 'address',
    owner: 'address',
    owner_passport_id: 'address',
    max_slots: 'u64',
  },
  SquadMemberSponsored: {
    squad_id: 'address',
    sponsor: 'address',
    member: 'address',
  },
  GuildCreated: {
    guild_id: 'address',
    owner: 'address',
    owner_passport_id: 'address',
    max_members: 'u64',
    is_public: 'bool',
  },
  GuildMemberAdded: {
    guild_id: 'address',
    owner: 'address',
    member: 'address',
    role: 'u8',
  },
  GuildUpdated: {
    guild_id: 'address',
    owner: 'address',
    is_public: 'bool',
  },
  ProfileCreated: {
    profile_id: 'address',
    owner: 'address',
    passport_id: 'address',
    is_public: 'bool',
  },
  ProfileUpdated: {
    profile_id: 'address',
    owner: 'address',
    passport_id: 'address',
    is_public: 'bool',
  },
  NodenameRegistered: {
    nodename: 'bytes',
    identity_id: 'address',
    owner: 'address',
  },
  EnterNamiCompleted: {
    owner: 'address',
    identity_id: 'address',
    passport_id: 'address',
    profile_id: 'address',
    nodename: 'bytes',
    archetype: 'u8',
  },
  TitleClaimed: {
    owner: 'address',
    passport_id: 'address',
    title_type: 'u8',
    source_code: 'u64',
  },
  TitleDisplayCreated: { owner: 'address', passport_id: 'address' },
  TitleEquipped: {
    owner: 'address',
    passport_id: 'address',
    title_type: 'u8',
  },
  CosmeticUnlocked: {
    owner: 'address',
    passport_id: 'address',
    cosmetic_type: 'u8',
    cosmetic_code: 'u64',
    source_code: 'u64',
  },
  CosmeticLoadoutCreated: { owner: 'address', passport_id: 'address' },
  CosmeticEquipped: {
    owner: 'address',
    passport_id: 'address',
    cosmetic_type: 'u8',
    cosmetic_code: 'u64',
  },
  RecoveryRequested: {
    recovery_id: 'address',
    requester: 'address',
    identity_id: 'address',
    passport_id: 'address',
    current_owner: 'address',
    requested_new_owner: 'address',
  },
  RecoveryResolved: {
    recovery_id: 'address',
    requester: 'address',
    identity_id: 'address',
    passport_id: 'address',
    result_status: 'u8',
    resolution_code: 'u64',
  },
};

export const PRIORITY_EVENT_NAMES = [
  'PassportCreated',
  'EnterNamiCompleted',
  'NodenameRegistered',
  'XPAdded',
  'BadgePointsAdded',
  'TierUpgraded',
  'ConductSignalUpdated',
  'PassportDowned',
  'BlackPassportIssued',
  'GuildCreated',
  'GuildMemberAdded',
  'TitleClaimed',
  'TitleEquipped',
  'CosmeticUnlocked',
  'CosmeticEquipped',
  'RecoveryRequested',
  'RecoveryResolved',
  'AppealOpened',
  'AppealResolved',
  'JuryCaseOpened',
] as const satisfies readonly NamiEventName[];

export type PriorityEventName = (typeof PRIORITY_EVENT_NAMES)[number];

const PRIORITY_EVENT_NAME_SET = new Set<string>(PRIORITY_EVENT_NAMES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAddress(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('0x');
}

function isU8(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255;
}

function isU64(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isBool(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isBytes(value: unknown): value is string | number[] {
  if (typeof value === 'string') {
    return true;
  }

  return Array.isArray(value) && value.every((entry) => typeof entry === 'number');
}

function checkField(value: unknown, fieldType: FieldType): boolean {
  switch (fieldType) {
    case 'address':
      return isAddress(value);
    case 'u8':
      return isU8(value);
    case 'u64':
      return isU64(value);
    case 'bool':
      return isBool(value);
    case 'bytes':
      return isBytes(value);
    default:
      return false;
  }
}

export function parseEventName(eventType: string): string | null {
  const match = eventType.match(/::([A-Za-z][A-Za-z0-9_]*)$/);
  return match?.[1] ?? null;
}

export function isKnownEventName(name: string): name is NamiEventName {
  return KNOWN_EVENT_NAME_SET.has(name);
}

export function isPriorityEventName(name: string): name is PriorityEventName {
  return PRIORITY_EVENT_NAME_SET.has(name);
}

export function validateEventData(
  eventName: NamiEventName,
  data: unknown
): NamiEventData | null {
  if (!isRecord(data)) {
    return null;
  }

  const schema = EVENT_SCHEMAS[eventName];

  for (const [field, fieldType] of Object.entries(schema)) {
    if (!checkField(data[field], fieldType)) {
      return null;
    }
  }

  return data as unknown as NamiEventData;
}

export function toUnknownEventData(data: unknown): Record<string, unknown> {
  if (isRecord(data)) {
    return data;
  }

  return {};
}