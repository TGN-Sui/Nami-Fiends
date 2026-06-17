/**
 * Backend projection view types.
 *
 * These mirror the indexer HTTP JSON responses — not Move event shapes.
 * Canonical event definitions remain in backend/src/types/events.ts only.
 */

export interface GuildProjection {
  id: string;
  owner: string;
  owner_passport_id: string;
  name?: string;
  description?: string;
  max_members: number;
  is_public: boolean;
  member_count: number;
  members: string[];
  created_at_ms?: number;
  updated_at_ms?: number;
}

export type TimelineCategory =
  | 'origin'
  | 'progression'
  | 'verification'
  | 'conduct'
  | 'customization'
  | 'moderation';

export interface TimelineEntry {
  id: string;
  kind: string;
  category: TimelineCategory;
  timestamp_ms: string | null;
  tx_digest: string;
  event_seq: string;
  payload: Record<string, unknown>;
}

export interface PassportTimelineSnapshot {
  level: number | null;
  total_xp: number | null;
  level_progress: number | null;
  badge_points_total: number | null;
  reputation: number | null;
  tier: number | null;
  conduct_signal: number | null;
  equipped_title_type: number | null;
  verification_level: number | null;
}

export interface PassportTimelineProjection {
  passport_id: string;
  identity_id: string | null;
  entry_count: number;
  snapshot: PassportTimelineSnapshot;
  entries: TimelineEntry[];
}

export interface RecoveryProjection {
  id: string;
  requester: string;
  identity_id: string;
  passport_id: string;
  current_owner: string;
  requested_new_owner: string;
  status: number;
  resolution_code: number;
  is_open: boolean;
  created_at_ms: string | null;
  resolved_at_ms: string | null;
}

export interface AppealProjection {
  id: string;
  appellant: string;
  passport_id: string;
  moderation_record_id: string;
  moderation_action_type: number;
  moderation_reason_code: number;
  status: number;
  resolution_code: number;
  is_open: boolean;
  created_at_ms: string | null;
  resolved_at_ms: string | null;
}

export interface JuryCaseProjection {
  id: string;
  appeal_id: string;
  appellant: string;
  passport_id: string;
  required_votes: number;
  approve_votes: number;
  deny_votes: number;
  modify_votes: number;
  status: number;
  final_recommendation: number;
  is_open: boolean;
  created_at_ms: string | null;
  closed_at_ms: string | null;
}

export interface SquadProjection {
  id: string;
  owner: string;
  owner_passport_id: string;
  max_slots: number;
  member_count: number;
  members: string[];
}

export interface ProfileProjection {
  id: string;
  owner: string;
  passport_id: string;
  is_public: boolean;
  created_at_ms: string | null;
  updated_at_ms: string | null;
}

export interface ChannelProjection {
  id: string;
  owner: string;
  owner_passport_id: string;
  is_public: boolean;
  is_verified: boolean;
  created_at_ms: string | null;
  updated_at_ms: string | null;
  verified_at_ms: string | null;
}

export interface ModerationRecordProjection {
  id: string;
  action_type: number;
  moderator: string;
  target_owner: string;
  passport_id: string;
  channel_id: string | null;
  reason_code: number;
  expires_at_ms: number | null;
  issued_at_ms: string | null;
}

export interface BadgeHistoryEntry {
  id: string;
  source: number;
  owner: string;
  passport_id: string | null;
  badge_type: number;
  points: number | null;
  issuer_id: string | null;
  issuer_type: number | null;
  issued_at_ms: string | null;
}

export interface BoostHistoryEntry {
  id: string;
  owner: string;
  channel_id: string;
  power: number;
  tier: number;
  week_id: number;
  used_at_ms: string | null;
}

export interface ChannelAccessProjection {
  channel_id: string;
  owner: string;
  allow_npc_chat: boolean;
  minimum_tier: number;
  minimum_reputation: number;
  created_at_ms: string | null;
  updated_at_ms: string | null;
}

export interface DiscoveryChannelRanking {
  channel_id: string;
  owner: string;
  is_verified: boolean;
  is_public: boolean;
  boost_power: number;
  boost_count: number;
  score: number;
  week_id: number;
  rank: number;
  signals: string[];
}

export interface DiscoveryGuildRanking {
  guild_id: string;
  owner: string;
  is_public: boolean;
  member_count: number;
  score: number;
  rank: number;
  signals: string[];
}

export interface DiscoveryCycleSnapshot {
  week_id: number;
  generated_at_ms: number;
  channel_count: number;
  guild_count: number;
}

export interface ChannelDiscoveryResponse {
  cycle: DiscoveryCycleSnapshot;
  channels: DiscoveryChannelRanking[];
}

export interface GuildDiscoveryResponse {
  cycle: DiscoveryCycleSnapshot;
  guilds: DiscoveryGuildRanking[];
}