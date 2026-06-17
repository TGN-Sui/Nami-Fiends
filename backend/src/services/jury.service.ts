import { readProjection, writeProjection } from '../storage.js';
import type { EventProcessor } from '../indexer.js';
import type { NamiTypedEvent } from '../events.js';
import type {
  JuryCaseClosed,
  JuryCaseOpened,
  JuryVoteSubmitted,
} from '../types/events.js';

export const JURY_CASE_STATUS = {
  OPEN: 1,
  CLOSED: 2,
} as const;

export type JuryCaseStatus =
  (typeof JURY_CASE_STATUS)[keyof typeof JURY_CASE_STATUS];

export interface JuryCaseProjection {
  id: string;
  appeal_id: string;
  appellant: string;
  passport_id: string;
  required_votes: number;
  approve_votes: number;
  deny_votes: number;
  modify_votes: number;
  status: JuryCaseStatus;
  final_recommendation: number;
  is_open: boolean;
  created_at_ms: string | null;
  closed_at_ms: string | null;
}

export type JuryCaseStore = Record<string, JuryCaseProjection>;

const VOTE_APPROVE = 2;
const VOTE_DENY = 3;
const VOTE_MODIFY = 4;

export class JuryService implements EventProcessor {
  private store: JuryCaseStore = {};
  private readonly projectionPath: string;

  constructor(projectionPath = 'data/projections/jury.json') {
    this.projectionPath = projectionPath;
  }

  async load(): Promise<void> {
    this.store = await readProjection<JuryCaseStore>(this.projectionPath, {});
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

  getStats(): { count: number; openCount: number; closedCount: number } {
    const cases = Object.values(this.store);

    return {
      count: cases.length,
      openCount: cases.filter((juryCase) => juryCase.is_open).length,
      closedCount: cases.filter((juryCase) => !juryCase.is_open).length,
    };
  }

  async process(typed: NamiTypedEvent): Promise<void> {
    const { eventName, data, timestampMs } = typed;

    if (eventName === 'JuryCaseOpened') {
      const event = data as JuryCaseOpened;

      this.store[event.jury_case_id] = {
        id: event.jury_case_id,
        appeal_id: event.appeal_id,
        appellant: event.appellant,
        passport_id: event.passport_id,
        required_votes: event.required_votes,
        approve_votes: 0,
        deny_votes: 0,
        modify_votes: 0,
        status: JURY_CASE_STATUS.OPEN,
        final_recommendation: 0,
        is_open: true,
        created_at_ms: timestampMs,
        closed_at_ms: null,
      };
      return;
    }

    if (eventName === 'JuryVoteSubmitted') {
      const event = data as JuryVoteSubmitted;
      const juryCase = this.store[event.jury_case_id];

      if (!juryCase) {
        return;
      }

      if (event.vote === VOTE_APPROVE) {
        juryCase.approve_votes += 1;
      } else if (event.vote === VOTE_DENY) {
        juryCase.deny_votes += 1;
      } else if (event.vote === VOTE_MODIFY) {
        juryCase.modify_votes += 1;
      }
      return;
    }

    if (eventName === 'JuryCaseClosed') {
      const event = data as JuryCaseClosed;
      const juryCase = this.store[event.jury_case_id];

      if (!juryCase) {
        return;
      }

      juryCase.approve_votes = event.approve_votes;
      juryCase.deny_votes = event.deny_votes;
      juryCase.modify_votes = event.modify_votes;
      juryCase.final_recommendation = event.final_recommendation;
      juryCase.status = JURY_CASE_STATUS.CLOSED;
      juryCase.is_open = false;
      juryCase.closed_at_ms = timestampMs;
    }
  }

  getCase(juryCaseId: string): JuryCaseProjection | undefined {
    return this.store[juryCaseId];
  }

  getAll(): JuryCaseProjection[] {
    return Object.values(this.store);
  }

  listOpen(limit = 50): JuryCaseProjection[] {
    return Object.values(this.store)
      .filter((juryCase) => juryCase.is_open)
      .slice(0, limit);
  }

  listByAppeal(appealId: string): JuryCaseProjection[] {
    return Object.values(this.store).filter(
      (juryCase) => juryCase.appeal_id === appealId
    );
  }

  listByPassport(passportId: string): JuryCaseProjection[] {
    return Object.values(this.store).filter(
      (juryCase) => juryCase.passport_id === passportId
    );
  }
}