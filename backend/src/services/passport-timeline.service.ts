/**
 * backend/src/services/passport-timeline.service.ts
 *
 * Aggregates passport journey events into per-passport timelines.
 *
 * Vision alignment: "Passport owns journey" — progression, conduct,
 * titles, and cosmetics form an auditable history derived from events.
 */

import { readProjection, writeProjection } from '../storage.js';
import type { EventProcessor } from '../indexer.js';
import type { NamiTypedEvent } from '../events.js';
import type {
  BadgePointsAdded,
  BlackPassportIssued,
  ConductSignalUpdated,
  ConductStatusCreated,
  CosmeticEquipped,
  CosmeticLoadoutCreated,
  CosmeticUnlocked,
  IdentityVerified,
  PassportCreated,
  PassportDowned,
  PassportRespawned,
  TierUpgraded,
  TitleClaimed,
  TitleDisplayCreated,
  TitleEquipped,
  XPAdded,
} from '../types/events.js';

export type TimelineCategory =
  | 'origin'
  | 'progression'
  | 'verification'
  | 'conduct'
  | 'customization'
  | 'moderation';

export type TimelineEntryKind =
  | 'passport_created'
  | 'identity_verified'
  | 'xp_added'
  | 'badge_points_added'
  | 'tier_upgraded'
  | 'conduct_status_created'
  | 'conduct_signal_updated'
  | 'passport_downed'
  | 'passport_respawned'
  | 'black_passport_issued'
  | 'title_claimed'
  | 'title_display_created'
  | 'title_equipped'
  | 'cosmetic_unlocked'
  | 'cosmetic_loadout_created'
  | 'cosmetic_equipped';

export interface TimelineEntry {
  id: string;
  kind: TimelineEntryKind;
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

export type PassportTimelineStore = Record<string, PassportTimelineProjection>;

export interface TimelineQuery {
  category?: TimelineCategory;
  limit?: number;
}

const EMPTY_SNAPSHOT = (): PassportTimelineSnapshot => ({
  level: null,
  total_xp: null,
  level_progress: null,
  badge_points_total: null,
  reputation: null,
  tier: null,
  conduct_signal: null,
  equipped_title_type: null,
  verification_level: null,
});

export class PassportTimelineService implements EventProcessor {
  private store: PassportTimelineStore = {};
  private readonly projectionPath: string;

  constructor(projectionPath = 'data/projections/passport-timelines.json') {
    this.projectionPath = projectionPath;
  }

  async load(): Promise<void> {
    this.store = await readProjection<PassportTimelineStore>(
      this.projectionPath,
      {}
    );
  }

  async save(): Promise<void> {
    await writeProjection(this.projectionPath, this.store);
  }

  async clear(): Promise<void> {
    this.store = {};
  }

  getProjectionPath(): string {
    return this.projectionPath;
  }

  getStats(): { passportCount: number; totalEntries: number } {
    const timelines = Object.values(this.store);

    return {
      passportCount: timelines.length,
      totalEntries: timelines.reduce(
        (total, timeline) => total + timeline.entry_count,
        0
      ),
    };
  }

  async process(typed: NamiTypedEvent): Promise<void> {
    const { eventName, data } = typed;

    if (eventName === 'PassportCreated') {
      const event = data as PassportCreated;
      const timeline = this.ensureTimeline(event.passport_id);
      timeline.identity_id = event.identity_id;
      this.appendEntry(timeline, typed, 'passport_created', 'origin', {
        identity_id: event.identity_id,
      });
      return;
    }

    if (eventName === 'IdentityVerified') {
      const event = data as IdentityVerified;
      const timeline = this.ensureTimeline(event.passport_id);
      timeline.snapshot.verification_level = event.verification_level;
      this.appendEntry(timeline, typed, 'identity_verified', 'verification', {
        identity_id: event.identity_id,
        owner: event.owner,
        source: event.source,
        verification_level: event.verification_level,
      });
      return;
    }

    if (eventName === 'XPAdded') {
      const event = data as XPAdded;
      const timeline = this.ensureTimeline(event.passport_id);
      timeline.snapshot.level = event.level;
      timeline.snapshot.total_xp = event.total_xp;
      timeline.snapshot.level_progress = event.level_progress;
      this.appendEntry(timeline, typed, 'xp_added', 'progression', {
        amount: event.amount,
        total_xp: event.total_xp,
        level: event.level,
        level_progress: event.level_progress,
      });
      return;
    }

    if (eventName === 'BadgePointsAdded') {
      const event = data as BadgePointsAdded;
      const timeline = this.ensureTimeline(event.passport_id);
      timeline.snapshot.badge_points_total = event.total;
      timeline.snapshot.reputation = event.reputation;
      this.appendEntry(timeline, typed, 'badge_points_added', 'progression', {
        amount: event.amount,
        total: event.total,
        reputation: event.reputation,
      });
      return;
    }

    if (eventName === 'TierUpgraded') {
      const event = data as TierUpgraded;
      const timeline = this.ensureTimeline(event.passport_id);
      timeline.snapshot.tier = event.new_tier;
      this.appendEntry(timeline, typed, 'tier_upgraded', 'progression', {
        old_tier: event.old_tier,
        new_tier: event.new_tier,
      });
      return;
    }

    if (eventName === 'ConductStatusCreated') {
      const event = data as ConductStatusCreated;
      const timeline = this.ensureTimeline(event.passport_id);
      timeline.snapshot.conduct_signal = event.signal;
      this.appendEntry(timeline, typed, 'conduct_status_created', 'conduct', {
        owner: event.owner,
        signal: event.signal,
      });
      return;
    }

    if (eventName === 'ConductSignalUpdated') {
      const event = data as ConductSignalUpdated;
      const timeline = this.ensureTimeline(event.passport_id);
      timeline.snapshot.conduct_signal = event.new_signal;
      this.appendEntry(timeline, typed, 'conduct_signal_updated', 'conduct', {
        owner: event.owner,
        old_signal: event.old_signal,
        new_signal: event.new_signal,
        reason_code: event.reason_code,
        expires_at_ms: event.expires_at_ms,
      });
      return;
    }

    if (eventName === 'PassportDowned') {
      const event = data as PassportDowned;
      const timeline = this.ensureTimeline(event.passport_id);
      this.appendEntry(timeline, typed, 'passport_downed', 'conduct', {
        owner: event.owner,
        reason_code: event.reason_code,
        respawn_at_ms: event.respawn_at_ms,
      });
      return;
    }

    if (eventName === 'PassportRespawned') {
      const event = data as PassportRespawned;
      const timeline = this.ensureTimeline(event.passport_id);
      timeline.snapshot.conduct_signal = event.restored_signal;
      this.appendEntry(timeline, typed, 'passport_respawned', 'conduct', {
        owner: event.owner,
        restored_signal: event.restored_signal,
      });
      return;
    }

    if (eventName === 'BlackPassportIssued') {
      const event = data as BlackPassportIssued;
      const timeline = this.ensureTimeline(event.passport_id);
      this.appendEntry(timeline, typed, 'black_passport_issued', 'moderation', {
        moderator: event.moderator,
        target_owner: event.target_owner,
        reason_code: event.reason_code,
        respawn_at_ms: event.respawn_at_ms,
      });
      return;
    }

    if (eventName === 'TitleClaimed') {
      const event = data as TitleClaimed;
      const timeline = this.ensureTimeline(event.passport_id);
      this.appendEntry(timeline, typed, 'title_claimed', 'customization', {
        owner: event.owner,
        title_type: event.title_type,
        source_code: event.source_code,
      });
      return;
    }

    if (eventName === 'TitleDisplayCreated') {
      const event = data as TitleDisplayCreated;
      const timeline = this.ensureTimeline(event.passport_id);
      this.appendEntry(
        timeline,
        typed,
        'title_display_created',
        'customization',
        {
          owner: event.owner,
        }
      );
      return;
    }

    if (eventName === 'TitleEquipped') {
      const event = data as TitleEquipped;
      const timeline = this.ensureTimeline(event.passport_id);
      timeline.snapshot.equipped_title_type = event.title_type;
      this.appendEntry(timeline, typed, 'title_equipped', 'customization', {
        owner: event.owner,
        title_type: event.title_type,
      });
      return;
    }

    if (eventName === 'CosmeticUnlocked') {
      const event = data as CosmeticUnlocked;
      const timeline = this.ensureTimeline(event.passport_id);
      this.appendEntry(timeline, typed, 'cosmetic_unlocked', 'customization', {
        owner: event.owner,
        cosmetic_type: event.cosmetic_type,
        cosmetic_code: event.cosmetic_code,
        source_code: event.source_code,
      });
      return;
    }

    if (eventName === 'CosmeticLoadoutCreated') {
      const event = data as CosmeticLoadoutCreated;
      const timeline = this.ensureTimeline(event.passport_id);
      this.appendEntry(
        timeline,
        typed,
        'cosmetic_loadout_created',
        'customization',
        {
          owner: event.owner,
        }
      );
      return;
    }

    if (eventName === 'CosmeticEquipped') {
      const event = data as CosmeticEquipped;
      const timeline = this.ensureTimeline(event.passport_id);
      this.appendEntry(timeline, typed, 'cosmetic_equipped', 'customization', {
        owner: event.owner,
        cosmetic_type: event.cosmetic_type,
        cosmetic_code: event.cosmetic_code,
      });
    }
  }

  getTimeline(
    passportId: string,
    query: TimelineQuery = {}
  ): PassportTimelineProjection | undefined {
    const timeline = this.store[passportId];

    if (!timeline) {
      return undefined;
    }

    let entries = timeline.entries;

    if (query.category) {
      entries = entries.filter((entry) => entry.category === query.category);
    }

    if (query.limit !== undefined && query.limit > 0) {
      entries = entries.slice(-query.limit);
    }

    return {
      ...timeline,
      entries,
      entry_count: entries.length,
    };
  }

  getSnapshot(passportId: string): PassportTimelineSnapshot | undefined {
    return this.store[passportId]?.snapshot;
  }

  listSummaries(limit = 50): Array<{
    passport_id: string;
    identity_id: string | null;
    entry_count: number;
    snapshot: PassportTimelineSnapshot;
  }> {
    return Object.values(this.store)
      .map((timeline) => ({
        passport_id: timeline.passport_id,
        identity_id: timeline.identity_id,
        entry_count: timeline.entry_count,
        snapshot: timeline.snapshot,
      }))
      .slice(0, limit);
  }

  private ensureTimeline(passportId: string): PassportTimelineProjection {
    const existing = this.store[passportId];

    if (existing) {
      return existing;
    }

    const timeline: PassportTimelineProjection = {
      passport_id: passportId,
      identity_id: null,
      entry_count: 0,
      snapshot: EMPTY_SNAPSHOT(),
      entries: [],
    };

    this.store[passportId] = timeline;
    return timeline;
  }

  private appendEntry(
    timeline: PassportTimelineProjection,
    typed: NamiTypedEvent,
    kind: TimelineEntryKind,
    category: TimelineCategory,
    payload: Record<string, unknown>
  ): void {
    timeline.entries.push({
      id: `${typed.id.txDigest}:${typed.id.eventSeq}`,
      kind,
      category,
      timestamp_ms: typed.timestampMs,
      tx_digest: typed.id.txDigest,
      event_seq: typed.id.eventSeq,
      payload,
    });
    timeline.entry_count = timeline.entries.length;
  }
}