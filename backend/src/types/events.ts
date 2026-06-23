/**
 * backend/src/types/events.ts
 *
 * Canonical, strongly-typed definitions for every Nami on-chain event.
 * This is the SINGLE SOURCE OF TRUTH for event shapes in the backend.
 *
 * Shapes are derived directly from the emitted structs in contracts/nami/sources/*.move
 * and documented in docs/events.md.
 *
 * Rules (to maintain architectural cleanliness):
 * - Never duplicate these interfaces in SDK, frontend, or other backend files.
 * - Use these for projection logic and domain services.
 * - Raw Sui parsedJson is cast/validated against these at processing time.
 * - The raw append-only JSONL log remains the immutable history (envelope + original parsedJson).
 */

export const NAMI_EVENT_MODULES = [
  'identity',
  'passport',
  'verification',
  'badge',
  'badge_issuer',
  'boost',
  'channel',
  'channel_access',
  'conduct',
  'moderation',
  'admin',
  'appeals',
  'jury',
  'squad',
  'guild',
  'profile',
  'onboarding',
  'title',
  'cosmetics',
  'recovery'
] as const;

export type NamiEventModule = (typeof NAMI_EVENT_MODULES)[number];

// =============================================================================
// CORE IDENTITY & PASSPORT
// =============================================================================

export interface IdentityCreated {
  identity_id: string;
  owner: string;
}

export interface NodenameRegistered {
  nodename: string | number[];
  identity_id: string;
  owner: string;
}

export interface EnterNamiCompleted {
  owner: string;
  identity_id: string;
  passport_id: string;
  profile_id: string;
  nodename: string | number[];
  archetype: number;
}

export interface PassportCreated {
  passport_id: string;
  identity_id: string;
}

export interface XPAdded {
  passport_id: string;
  amount: number;
  total_xp: number;
  level: number;
  level_progress: number;
}

export interface BadgePointsAdded {
  passport_id: string;
  amount: number;
  total: number;
  reputation: number;
}

export interface TierUpgraded {
  passport_id: string;
  old_tier: number;
  new_tier: number;
}

// =============================================================================
// VERIFICATION
// =============================================================================

export interface IdentityVerified {
  identity_id: string;
  passport_id: string;
  owner: string;
  source: number;
  verification_level: number;
}

// =============================================================================
// BADGES & ISSUERS
// =============================================================================

export interface BadgeMinted {
  owner: string;
  badge_type: number;
  points: number;
}

export interface BadgeIssuerCreated {
  owner: string;
  issuer_id: string;
  issuer_type: number;
  can_issue_basic: boolean;
  can_issue_event: boolean;
  can_issue_completion: boolean;
}

export interface BadgeIssuedByIssuer {
  issuer_id: string;
  issuer_type: number;
  recipient: string;
  badge_type: number;
}

// =============================================================================
// BOOSTS
// =============================================================================

export interface BoostUsed {
  owner: string;
  channel_id: string;
  power: number;
  tier: number;
  week_id: number;
}

// =============================================================================
// CHANNELS
// =============================================================================

export interface ChannelCreated {
  channel_id: string;
  owner: string;
  owner_passport_id: string;
  is_public: boolean;
}

export interface ChannelUpdated {
  channel_id: string;
  owner: string;
  is_public: boolean;
}

export interface ChannelVerified {
  channel_id: string;
  owner: string;
}

// =============================================================================
// CHANNEL ACCESS
// =============================================================================

export interface ChannelAccessPolicyCreated {
  owner: string;
  channel_id: string;
  allow_npc_chat: boolean;
  minimum_tier: number;
  minimum_reputation: number;
}

export interface ChannelAccessRuleUpdated {
  owner: string;
  channel_id: string;
  allow_npc_chat: boolean;
  minimum_tier: number;
  minimum_reputation: number;
}

// =============================================================================
// CONDUCT
// =============================================================================

export interface ConductStatusCreated {
  owner: string;
  passport_id: string;
  signal: number;
}

export interface ConductSignalUpdated {
  owner: string;
  passport_id: string;
  old_signal: number;
  new_signal: number;
  reason_code: number;
  expires_at_ms: number;
}

export interface PassportDowned {
  owner: string;
  passport_id: string;
  reason_code: number;
  respawn_at_ms: number;
}

export interface PassportRespawned {
  owner: string;
  passport_id: string;
  restored_signal: number;
}

// =============================================================================
// MODERATION
// =============================================================================

export interface WarningIssued {
  moderator: string;
  target_owner: string;
  passport_id: string;
  reason_code: number;
}

export interface MuteIssued {
  moderator: string;
  target_owner: string;
  passport_id: string;
  channel_id: string;
  reason_code: number;
  expires_at_ms: number;
}

export interface ChannelBanIssued {
  moderator: string;
  target_owner: string;
  passport_id: string;
  channel_id: string;
  reason_code: number;
  expires_at_ms: number;
}

export interface BlackPassportIssued {
  moderator: string;
  target_owner: string;
  passport_id: string;
  reason_code: number;
  respawn_at_ms: number;
}

// =============================================================================
// ADMIN
// =============================================================================

export interface AdminAction {
  admin_cap_id: string;
  action_type: number;
  target: string;
}

// =============================================================================
// APPEALS
// =============================================================================

export interface AppealOpened {
  appeal_id: string;
  appellant: string;
  passport_id: string;
  moderation_record_id: string;
  moderation_action_type: number;
  moderation_reason_code: number;
}

export interface AppealResolved {
  appeal_id: string;
  appellant: string;
  passport_id: string;
  result_status: number;
  resolution_code: number;
}

// =============================================================================
// JURY
// =============================================================================

export interface JuryCaseOpened {
  jury_case_id: string;
  appeal_id: string;
  appellant: string;
  passport_id: string;
  required_votes: number;
}

export interface JuryVoteSubmitted {
  jury_case_id: string;
  appeal_id: string;
  vote: number;
}

export interface JuryCaseClosed {
  jury_case_id: string;
  appeal_id: string;
  final_recommendation: number;
  approve_votes: number;
  deny_votes: number;
  modify_votes: number;
}

// =============================================================================
// SQUADS
// =============================================================================

export interface SquadCreated {
  squad_id: string;
  owner: string;
  owner_passport_id: string;
  max_slots: number;
}

export interface SquadMemberSponsored {
  squad_id: string;
  sponsor: string;
  member: string;
}

// =============================================================================
// GUILDS (recently hardened in tests)
// =============================================================================

export interface GuildCreated {
  guild_id: string;
  owner: string;
  owner_passport_id: string;
  max_members: number;
  is_public: boolean;
}

export interface GuildMemberAdded {
  guild_id: string;
  owner: string;
  member: string;
  role: number;
}

export interface GuildUpdated {
  guild_id: string;
  owner: string;
  is_public: boolean;
}

// =============================================================================
// PROFILES
// =============================================================================

export interface ProfileCreated {
  profile_id: string;
  owner: string;
  passport_id: string;
  is_public: boolean;
}

export interface ProfileUpdated {
  profile_id: string;
  owner: string;
  passport_id: string;
  is_public: boolean;
}

// =============================================================================
// TITLES (recently hardened)
// =============================================================================

export interface TitleClaimed {
  owner: string;
  passport_id: string;
  title_type: number;
  source_code: number;
}

export interface TitleDisplayCreated {
  owner: string;
  passport_id: string;
}

export interface TitleEquipped {
  owner: string;
  passport_id: string;
  title_type: number;
}

// =============================================================================
// COSMETICS (recently hardened)
// =============================================================================

export interface CosmeticUnlocked {
  owner: string;
  passport_id: string;
  cosmetic_type: number;
  cosmetic_code: number;
  source_code: number;
}

export interface CosmeticLoadoutCreated {
  owner: string;
  passport_id: string;
}

export interface CosmeticEquipped {
  owner: string;
  passport_id: string;
  cosmetic_type: number;
  cosmetic_code: number;
}

// =============================================================================
// RECOVERY (recently hardened - double resolution prevention)
// =============================================================================

export interface RecoveryRequested {
  recovery_id: string;
  requester: string;
  identity_id: string;
  passport_id: string;
  current_owner: string;
  requested_new_owner: string;
}

export interface RecoveryResolved {
  recovery_id: string;
  requester: string;
  identity_id: string;
  passport_id: string;
  result_status: number;
  resolution_code: number;
}

// =============================================================================
// TYPED EVENT ENVELOPE (used by indexer + projections)
// =============================================================================

export type UnknownNamiEventData = Record<string, unknown>;

export type NamiEventData =
  | IdentityCreated
  | NodenameRegistered
  | EnterNamiCompleted
  | PassportCreated
  | XPAdded
  | BadgePointsAdded
  | TierUpgraded
  | IdentityVerified
  | BadgeMinted
  | BadgeIssuerCreated
  | BadgeIssuedByIssuer
  | BoostUsed
  | ChannelCreated
  | ChannelUpdated
  | ChannelVerified
  | ChannelAccessPolicyCreated
  | ChannelAccessRuleUpdated
  | ConductStatusCreated
  | ConductSignalUpdated
  | PassportDowned
  | PassportRespawned
  | WarningIssued
  | MuteIssued
  | ChannelBanIssued
  | BlackPassportIssued
  | AdminAction
  | AppealOpened
  | AppealResolved
  | JuryCaseOpened
  | JuryVoteSubmitted
  | JuryCaseClosed
  | SquadCreated
  | SquadMemberSponsored
  | GuildCreated
  | GuildMemberAdded
  | GuildUpdated
  | ProfileCreated
  | ProfileUpdated
  | TitleClaimed
  | TitleDisplayCreated
  | TitleEquipped
  | CosmeticUnlocked
  | CosmeticLoadoutCreated
  | CosmeticEquipped
  | RecoveryRequested
  | RecoveryResolved;

export interface NamiTypedEvent {
  module: NamiEventModule;
  id: {
    txDigest: string;
    eventSeq: string;
  };
  packageId: string;
  transactionModule: string;
  sender: string;
  type: string; // e.g. "0x...::guild::GuildCreated"
  timestampMs: string | null;

  /** Parsed Move event struct name, null when unknown or validation failed. */
  eventName: string | null;

  /** Validated payload for known events; loose record for unknown/malformed. */
  data: NamiEventData | UnknownNamiEventData;
}

/**
 * Priority events (per docs/events.md "Backend Indexing Priorities").
 * Canonical list lives in event-guards.ts as PRIORITY_EVENT_NAMES.
 */
export const PRIORITY_EVENT_TYPES = [
  'PassportCreated',
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
] as const;
