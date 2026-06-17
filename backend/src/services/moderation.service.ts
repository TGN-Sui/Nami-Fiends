import { readProjection, writeProjection } from '../storage.js';
import type { EventProcessor } from '../indexer.js';
import type { NamiTypedEvent } from '../events.js';
import type {
  BlackPassportIssued,
  ChannelBanIssued,
  MuteIssued,
  WarningIssued,
} from '../types/events.js';

export const MODERATION_ACTION = {
  WARNING: 1,
  MUTE: 2,
  CHANNEL_BAN: 3,
  BLACK_PASSPORT: 4,
} as const;

export type ModerationActionType =
  (typeof MODERATION_ACTION)[keyof typeof MODERATION_ACTION];

export interface ModerationRecordProjection {
  id: string;
  action_type: ModerationActionType;
  moderator: string;
  target_owner: string;
  passport_id: string;
  channel_id: string | null;
  reason_code: number;
  expires_at_ms: number | null;
  issued_at_ms: string | null;
}

export type ModerationStore = Record<string, ModerationRecordProjection>;

function recordId(typed: NamiTypedEvent): string {
  return `${typed.id.txDigest}:${typed.id.eventSeq}`;
}

function isActive(record: ModerationRecordProjection, nowMs = Date.now()): boolean {
  if (record.action_type === MODERATION_ACTION.WARNING) {
    return false;
  }

  if (record.expires_at_ms === null) {
    return true;
  }

  return record.expires_at_ms > nowMs;
}

export class ModerationService implements EventProcessor {
  private store: ModerationStore = {};
  private readonly projectionPath: string;

  constructor(projectionPath = 'data/projections/moderation.json') {
    this.projectionPath = projectionPath;
  }

  async load(): Promise<void> {
    this.store = await readProjection<ModerationStore>(this.projectionPath, {});
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

  getStats(): { count: number; activeCount: number } {
    const records = Object.values(this.store);

    return {
      count: records.length,
      activeCount: records.filter((record) => isActive(record)).length,
    };
  }

  async process(typed: NamiTypedEvent): Promise<void> {
    const { eventName, data, timestampMs } = typed;
    const id = recordId(typed);

    if (eventName === 'WarningIssued') {
      const event = data as WarningIssued;

      this.store[id] = {
        id,
        action_type: MODERATION_ACTION.WARNING,
        moderator: event.moderator,
        target_owner: event.target_owner,
        passport_id: event.passport_id,
        channel_id: null,
        reason_code: event.reason_code,
        expires_at_ms: null,
        issued_at_ms: timestampMs,
      };
      return;
    }

    if (eventName === 'MuteIssued') {
      const event = data as MuteIssued;

      this.store[id] = {
        id,
        action_type: MODERATION_ACTION.MUTE,
        moderator: event.moderator,
        target_owner: event.target_owner,
        passport_id: event.passport_id,
        channel_id: event.channel_id,
        reason_code: event.reason_code,
        expires_at_ms: event.expires_at_ms,
        issued_at_ms: timestampMs,
      };
      return;
    }

    if (eventName === 'ChannelBanIssued') {
      const event = data as ChannelBanIssued;

      this.store[id] = {
        id,
        action_type: MODERATION_ACTION.CHANNEL_BAN,
        moderator: event.moderator,
        target_owner: event.target_owner,
        passport_id: event.passport_id,
        channel_id: event.channel_id,
        reason_code: event.reason_code,
        expires_at_ms: event.expires_at_ms,
        issued_at_ms: timestampMs,
      };
      return;
    }

    if (eventName === 'BlackPassportIssued') {
      const event = data as BlackPassportIssued;

      this.store[id] = {
        id,
        action_type: MODERATION_ACTION.BLACK_PASSPORT,
        moderator: event.moderator,
        target_owner: event.target_owner,
        passport_id: event.passport_id,
        channel_id: null,
        reason_code: event.reason_code,
        expires_at_ms: event.respawn_at_ms,
        issued_at_ms: timestampMs,
      };
    }
  }

  getRecord(recordId: string): ModerationRecordProjection | undefined {
    return this.store[recordId];
  }

  getAll(): ModerationRecordProjection[] {
    return Object.values(this.store);
  }

  listActive(limit = 50): ModerationRecordProjection[] {
    return Object.values(this.store)
      .filter((record) => isActive(record))
      .slice(0, limit);
  }

  listByPassport(passportId: string): ModerationRecordProjection[] {
    return Object.values(this.store).filter(
      (record) => record.passport_id === passportId
    );
  }

  listByTarget(targetOwner: string): ModerationRecordProjection[] {
    return Object.values(this.store).filter(
      (record) => record.target_owner === targetOwner
    );
  }
}