/**
 * backend/src/services/recovery.service.ts
 *
 * Domain Service + Projection for Recovery requests.
 *
 * Symmetric to GuildService. Powers recovery review dashboards and
 * passport-linked recovery timelines without duplicating contract logic.
 *
 * On-chain hardening exercised here:
 * - RecoveryRequested opens status=OPEN (1)
 * - RecoveryResolved transitions to APPROVED/DENIED/MODIFIED (2/3/4)
 * - Double-resolution is blocked on-chain; replay applies each resolve once
 */

import { readProjection, writeProjection } from '../storage.js';
import type { EventProcessor } from '../indexer.js';
import type { NamiTypedEvent } from '../events.js';
import type { RecoveryRequested, RecoveryResolved } from '../types/events.js';

export const RECOVERY_STATUS = {
  OPEN: 1,
  APPROVED: 2,
  DENIED: 3,
  MODIFIED: 4,
} as const;

export type RecoveryStatus =
  (typeof RECOVERY_STATUS)[keyof typeof RECOVERY_STATUS];

export interface RecoveryProjection {
  id: string;
  requester: string;
  identity_id: string;
  passport_id: string;
  current_owner: string;
  requested_new_owner: string;
  status: RecoveryStatus;
  resolution_code: number;
  is_open: boolean;
  created_at_ms: string | null;
  resolved_at_ms: string | null;
}

export type RecoveryStore = Record<string, RecoveryProjection>;

export class RecoveryService implements EventProcessor {
  private store: RecoveryStore = {};
  private readonly projectionPath: string;

  constructor(projectionPath = 'data/projections/recovery.json') {
    this.projectionPath = projectionPath;
  }

  async load(): Promise<void> {
    this.store = await readProjection<RecoveryStore>(this.projectionPath, {});
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
    const requests = Object.values(this.store);

    return {
      count: requests.length,
      openCount: requests.filter((request) => request.is_open).length,
      resolvedCount: requests.filter((request) => !request.is_open).length,
    };
  }

  async process(typed: NamiTypedEvent): Promise<void> {
    const { eventName, data, timestampMs } = typed;

    if (eventName === 'RecoveryRequested') {
      const event = data as RecoveryRequested;

      this.store[event.recovery_id] = {
        id: event.recovery_id,
        requester: event.requester,
        identity_id: event.identity_id,
        passport_id: event.passport_id,
        current_owner: event.current_owner,
        requested_new_owner: event.requested_new_owner,
        status: RECOVERY_STATUS.OPEN,
        resolution_code: 0,
        is_open: true,
        created_at_ms: timestampMs,
        resolved_at_ms: null,
      };
      return;
    }

    if (eventName === 'RecoveryResolved') {
      const event = data as RecoveryResolved;
      const request = this.store[event.recovery_id];

      if (!request) {
        return;
      }

      request.status = event.result_status as RecoveryStatus;
      request.resolution_code = event.resolution_code;
      request.is_open = false;
      request.resolved_at_ms = timestampMs;
    }
  }

  getRecovery(recoveryId: string): RecoveryProjection | undefined {
    return this.store[recoveryId];
  }

  getAll(): RecoveryProjection[] {
    return Object.values(this.store);
  }

  listOpen(limit = 50): RecoveryProjection[] {
    return Object.values(this.store)
      .filter((request) => request.is_open)
      .slice(0, limit);
  }

  listByPassport(passportId: string): RecoveryProjection[] {
    return Object.values(this.store).filter(
      (request) => request.passport_id === passportId
    );
  }

  listByIdentity(identityId: string): RecoveryProjection[] {
    return Object.values(this.store).filter(
      (request) => request.identity_id === identityId
    );
  }

  listByRequester(requester: string): RecoveryProjection[] {
    return Object.values(this.store).filter(
      (request) => request.requester === requester
    );
  }
}