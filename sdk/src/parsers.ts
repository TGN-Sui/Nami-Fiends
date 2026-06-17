import { conductSignalLabel, membershipTierLabel, reputationLabel } from './labels.js';

type SuiObjectData = {
  objectId?: string;
  content?: {
    dataType?: string;
    fields?: Record<string, unknown>;
  };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readU64(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function readU8(value: unknown): number {
  return readU64(value);
}

function readAddress(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readOptionalAddress(value: unknown): string | null {
  if (typeof value === 'string' && value.startsWith('0x')) {
    return value;
  }

  const record = asRecord(value);

  if (record && typeof record.Some === 'string') {
    return record.Some;
  }

  if (record && Array.isArray(record.fields) && typeof record.fields[0] === 'string') {
    return record.fields[0];
  }

  return null;
}

function readBytesAsString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  const record = asRecord(value);

  if (record && Array.isArray(record.bytes)) {
    try {
      return new TextDecoder().decode(new Uint8Array(record.bytes as number[]));
    } catch {
      return '';
    }
  }

  if (Array.isArray(value)) {
    try {
      return new TextDecoder().decode(new Uint8Array(value as number[]));
    } catch {
      return '';
    }
  }

  return '';
}

function readBool(value: unknown): boolean {
  return value === true;
}

function readMoveFields(source: SuiObjectData): Record<string, unknown> | null {
  const content = source.content;

  if (!content || content.dataType !== 'moveObject') {
    return null;
  }

  return asRecord(content.fields);
}

export interface ParsedPassport {
  objectId: string;
  identityId: string;
  xp: number;
  level: number;
  levelProgress: number;
  badgePoints: number;
  reputation: number;
  reputationLabel: string;
  archetype: number;
  tier: number;
  membershipTierLabel: string;
  boostScore: number;
  prestigePoints: number;
  createdAtMs: number;
}

export interface ParsedGuild {
  objectId: string;
  owner: string;
  ownerPassportId: string;
  name: string;
  description: string;
  isPublic: boolean;
  maxMembers: number;
  memberCount: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface ParsedSquad {
  objectId: string;
  owner: string;
  ownerPassportId: string;
  name: string;
  maxSlots: number;
  memberCount: number;
  createdAtMs: number;
}

export interface ParsedChannel {
  objectId: string;
  owner: string;
  ownerPassportId: string;
  name: string;
  description: string;
  metadataRef: string;
  isPublic: boolean;
  isVerified: boolean;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface ParsedProfile {
  objectId: string;
  owner: string;
  passportId: string;
  displayName: string;
  bioRef: string;
  avatarRef: string;
  metadataRef: string;
  isPublic: boolean;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface ParsedIdentity {
  objectId: string;
  owner: string;
  trustTier: number;
  verificationLevel: number;
  passportId: string | null;
  createdAtMs: number;
  version: number;
}

export interface ParsedConductStatus {
  objectId: string;
  owner: string;
  passportId: string;
  signal: number;
  signalLabel: string;
  reasonCode: number;
  expiresAtMs: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface ParsedChannelAccessPolicy {
  objectId: string;
  owner: string;
  channelId: string;
  allowNpcChat: boolean;
  minimumTier: number;
  minimumReputation: number;
  minimumTierLabel: string;
  minimumReputationLabel: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface ParsedTitleDisplay {
  objectId: string;
  owner: string;
  passportId: string;
  equippedTitleType: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface ParsedCosmeticLoadout {
  objectId: string;
  owner: string;
  passportId: string;
  profileFrameCode: number;
  passportThemeCode: number;
  chatOverlayCode: number;
  avatarStyleCode: number;
  badgeDisplayCode: number;
  titleEffectCode: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export function parsePassportObject(source: SuiObjectData): ParsedPassport | null {
  const fields = readMoveFields(source);

  if (!fields) {
    return null;
  }

  const objectId = source.objectId ?? readAddress(fields.id);

  return {
    objectId,
    identityId: readAddress(fields.identity_id),
    xp: readU64(fields.xp),
    level: readU64(fields.level),
    levelProgress: readU64(fields.level_progress),
    badgePoints: readU64(fields.badge_points),
    reputation: readU8(fields.reputation),
    reputationLabel: reputationLabel(readU8(fields.reputation)),
    archetype: readU8(fields.archetype),
    tier: readU8(fields.tier),
    membershipTierLabel: membershipTierLabel(readU8(fields.tier)),
    boostScore: readU64(fields.boost_score),
    prestigePoints: readU64(fields.prestige_points),
    createdAtMs: readU64(fields.created_at_ms),
  };
}

export function parseGuildObject(source: SuiObjectData): ParsedGuild | null {
  const fields = readMoveFields(source);

  if (!fields) {
    return null;
  }

  const objectId = source.objectId ?? readAddress(fields.id);

  return {
    objectId,
    owner: readAddress(fields.owner),
    ownerPassportId: readAddress(fields.owner_passport_id),
    name: readBytesAsString(fields.name),
    description: readBytesAsString(fields.description),
    isPublic: readBool(fields.is_public),
    maxMembers: readU64(fields.max_members),
    memberCount: readU64(fields.member_count),
    createdAtMs: readU64(fields.created_at_ms),
    updatedAtMs: readU64(fields.updated_at_ms),
  };
}

export function parseSquadObject(source: SuiObjectData): ParsedSquad | null {
  const fields = readMoveFields(source);

  if (!fields) {
    return null;
  }

  const objectId = source.objectId ?? readAddress(fields.id);

  return {
    objectId,
    owner: readAddress(fields.owner),
    ownerPassportId: readAddress(fields.owner_passport_id),
    name: readBytesAsString(fields.name),
    maxSlots: readU64(fields.max_slots),
    memberCount: readU64(fields.member_count),
    createdAtMs: readU64(fields.created_at_ms),
  };
}

export function parseChannelObject(source: SuiObjectData): ParsedChannel | null {
  const fields = readMoveFields(source);

  if (!fields) {
    return null;
  }

  const objectId = source.objectId ?? readAddress(fields.id);

  return {
    objectId,
    owner: readAddress(fields.owner),
    ownerPassportId: readAddress(fields.owner_passport_id),
    name: readBytesAsString(fields.name),
    description: readBytesAsString(fields.description),
    metadataRef: readBytesAsString(fields.metadata_ref),
    isPublic: readBool(fields.is_public),
    isVerified: readBool(fields.is_verified),
    createdAtMs: readU64(fields.created_at_ms),
    updatedAtMs: readU64(fields.updated_at_ms),
  };
}

export function parseIdentityObject(source: SuiObjectData): ParsedIdentity | null {
  const fields = readMoveFields(source);

  if (!fields) {
    return null;
  }

  const objectId = source.objectId ?? readAddress(fields.id);

  return {
    objectId,
    owner: readAddress(fields.owner),
    trustTier: readU8(fields.trust_tier),
    verificationLevel: readU8(fields.verification_level),
    passportId: readOptionalAddress(fields.passport_id),
    createdAtMs: readU64(fields.created_at_ms),
    version: readU8(fields.version),
  };
}

export function parseConductStatusObject(source: SuiObjectData): ParsedConductStatus | null {
  const fields = readMoveFields(source);

  if (!fields) {
    return null;
  }

  const objectId = source.objectId ?? readAddress(fields.id);
  const signal = readU8(fields.signal);

  return {
    objectId,
    owner: readAddress(fields.owner),
    passportId: readAddress(fields.passport_id),
    signal,
    signalLabel: conductSignalLabel(signal),
    reasonCode: readU64(fields.reason_code),
    expiresAtMs: readU64(fields.expires_at_ms),
    createdAtMs: readU64(fields.created_at_ms),
    updatedAtMs: readU64(fields.updated_at_ms),
  };
}

export function parseChannelAccessPolicyObject(
  source: SuiObjectData
): ParsedChannelAccessPolicy | null {
  const fields = readMoveFields(source);

  if (!fields) {
    return null;
  }

  const objectId = source.objectId ?? readAddress(fields.id);
  const minimumTier = readU8(fields.minimum_tier);
  const minimumReputation = readU8(fields.minimum_reputation);

  return {
    objectId,
    owner: readAddress(fields.owner),
    channelId: readAddress(fields.channel_id),
    allowNpcChat: readBool(fields.allow_npc_chat),
    minimumTier,
    minimumReputation,
    minimumTierLabel: membershipTierLabel(minimumTier),
    minimumReputationLabel: reputationLabel(minimumReputation),
    createdAtMs: readU64(fields.created_at_ms),
    updatedAtMs: readU64(fields.updated_at_ms),
  };
}

export function parseTitleDisplayObject(source: SuiObjectData): ParsedTitleDisplay | null {
  const fields = readMoveFields(source);

  if (!fields) {
    return null;
  }

  const objectId = source.objectId ?? readAddress(fields.id);

  return {
    objectId,
    owner: readAddress(fields.owner),
    passportId: readAddress(fields.passport_id),
    equippedTitleType: readU8(fields.equipped_title_type),
    createdAtMs: readU64(fields.created_at_ms),
    updatedAtMs: readU64(fields.updated_at_ms),
  };
}

export function parseCosmeticLoadoutObject(
  source: SuiObjectData
): ParsedCosmeticLoadout | null {
  const fields = readMoveFields(source);

  if (!fields) {
    return null;
  }

  const objectId = source.objectId ?? readAddress(fields.id);

  return {
    objectId,
    owner: readAddress(fields.owner),
    passportId: readAddress(fields.passport_id),
    profileFrameCode: readU64(fields.profile_frame_code),
    passportThemeCode: readU64(fields.passport_theme_code),
    chatOverlayCode: readU64(fields.chat_overlay_code),
    avatarStyleCode: readU64(fields.avatar_style_code),
    badgeDisplayCode: readU64(fields.badge_display_code),
    titleEffectCode: readU64(fields.title_effect_code),
    createdAtMs: readU64(fields.created_at_ms),
    updatedAtMs: readU64(fields.updated_at_ms),
  };
}

export function parseProfileObject(source: SuiObjectData): ParsedProfile | null {
  const fields = readMoveFields(source);

  if (!fields) {
    return null;
  }

  const objectId = source.objectId ?? readAddress(fields.id);

  return {
    objectId,
    owner: readAddress(fields.owner),
    passportId: readAddress(fields.passport_id),
    displayName: readBytesAsString(fields.display_name),
    bioRef: readBytesAsString(fields.bio_ref),
    avatarRef: readBytesAsString(fields.avatar_ref),
    metadataRef: readBytesAsString(fields.metadata_ref),
    isPublic: readBool(fields.is_public),
    createdAtMs: readU64(fields.created_at_ms),
    updatedAtMs: readU64(fields.updated_at_ms),
  };
}