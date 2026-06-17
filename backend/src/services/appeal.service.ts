import { readProjection, writeProjection } from '../storage.js';
import type { EventProcessor } from '../indexer.js';
import type { NamiTypedEvent } from '../events.js';
import type { AppealOpened, AppealResolved } from '../types/events.js';

export const APPEAL_STATUS = {
  OPEN: 1,
  APPROVED: 2,
  DENIED: 3,
  MODIFIED: 4,
} as const;

export type AppealStatus = (typeof APPEAL_STATUS)[keyof typeof APPEAL_STATUS];

export interface AppealProjection {
  id: string;
  appellant: string;
  passport_id: string;
  moderation_record_id: string;
  moderation_action_type: number;
  moderation_reason_code: number;
  status: AppealStatus;
  resolution_code: number;
  is_open: boolean;
  created_at_ms: string | null;
  resolved_at_ms: string | null;
}

export type AppealStore = Record<string, AppealProjection>;

export class AppealService implements EventProcessor {
  private store: AppealStore = {};
  private readonly projectionPath: string;

  constructor(projectionPath = 'data/projections/appeals.json') {
    this.projectionPath = projectionPath;
  }

  async load(): Promise<void> {
    this.store = await readProjection<AppealStore>(this.projectionPath, {});
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

  getStats(): { count: number; openCount: number; resolvedCount: number } {
    const appeals = Object.values(this.store);

    return {
      count: appeals.length,
      openCount: appeals.filter((appeal) => appeal.is_open).length,
      resolvedCount: appeals.filter((appeal) => !appeal.is_open).length,
    };
  }

  async process(typed: NamiTypedEvent): Promise<void> {
    const { eventName, data, timestampMs } = typed;

    if (eventName === 'AppealOpened') {
      const event = data as AppealOpened;

      this.store[event.appeal_id] = {
        id: event.appeal_id,
        appellant: event.appellant,
        passport_id: event.passport_id,
        moderation_record_id: event.moderation_record_id,
        moderation_action_type: event.moderation_action_type,
        moderation_reason_code: event.moderation_reason_code,
        status: APPEAL_STATUS.OPEN,
        resolution_code: 0,
        is_open: true,
        created_at_ms: timestampMs,
        resolved_at_ms: null,
      };
      return;
    }

    if (eventName === 'AppealResolved') {
      const event = data as AppealResolved;
      const appeal = this.store[event.appeal_id];

      if (!appeal) {
        return;
      }

      appeal.status = event.result_status as AppealStatus;
      appeal.resolution_code = event.resolution_code;
      appeal.is_open = false;
      appeal.resolved_at_ms = timestampMs;
    }
  }

  getAppeal(appealId: string): AppealProjection | undefined {
    return this.store[appealId];
  }

  getAll(): AppealProjection[] {
    return Object.values(this.store);
  }

  listOpen(limit = 50): AppealProjection[] {
    return Object.values(this.store)
      .filter((appeal) => appeal.is_open)
      .slice(0, limit);
  }

  listByPassport(passportId: string): AppealProjection[] {
    return Object.values(this.store).filter(
      (appeal) => appeal.passport_id === passportId
    );
  }

  listByAppellant(appellant: string): AppealProjection[] {
    return Object.values(this.store).filter(
      (appeal) => appeal.appellant === appellant
    );
  }
}