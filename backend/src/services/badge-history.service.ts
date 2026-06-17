import { readProjection, writeProjection } from '../storage.js';
import type { EventProcessor } from '../indexer.js';
import type { NamiTypedEvent } from '../events.js';
import type { BadgeIssuedByIssuer, BadgeMinted } from '../types/events.js';

export const BADGE_SOURCE = {
  MINTED: 1,
  ISSUER: 2,
} as const;

export type BadgeSource = (typeof BADGE_SOURCE)[keyof typeof BADGE_SOURCE];

export interface BadgeHistoryEntry {
  id: string;
  source: BadgeSource;
  owner: string;
  passport_id: string | null;
  badge_type: number;
  points: number | null;
  issuer_id: string | null;
  issuer_type: number | null;
  issued_at_ms: string | null;
}

export type BadgeHistoryStore = Record<string, BadgeHistoryEntry>;

function entryId(typed: NamiTypedEvent): string {
  return `${typed.id.txDigest}:${typed.id.eventSeq}`;
}

export class BadgeHistoryService implements EventProcessor {
  private store: BadgeHistoryStore = {};
  private readonly projectionPath: string;

  constructor(projectionPath = 'data/projections/badge-history.json') {
    this.projectionPath = projectionPath;
  }

  async load(): Promise<void> {
    this.store = await readProjection<BadgeHistoryStore>(this.projectionPath, {});
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

  getStats(): { count: number; mintedCount: number; issuerCount: number } {
    const entries = Object.values(this.store);

    return {
      count: entries.length,
      mintedCount: entries.filter((entry) => entry.source === BADGE_SOURCE.MINTED).length,
      issuerCount: entries.filter((entry) => entry.source === BADGE_SOURCE.ISSUER).length,
    };
  }

  async process(typed: NamiTypedEvent): Promise<void> {
    const { eventName, data, timestampMs } = typed;
    const id = entryId(typed);

    if (eventName === 'BadgeMinted') {
      const event = data as BadgeMinted;

      this.store[id] = {
        id,
        source: BADGE_SOURCE.MINTED,
        owner: event.owner,
        passport_id: null,
        badge_type: event.badge_type,
        points: event.points,
        issuer_id: null,
        issuer_type: null,
        issued_at_ms: timestampMs,
      };
      return;
    }

    if (eventName === 'BadgeIssuedByIssuer') {
      const event = data as BadgeIssuedByIssuer;

      this.store[id] = {
        id,
        source: BADGE_SOURCE.ISSUER,
        owner: event.recipient,
        passport_id: null,
        badge_type: event.badge_type,
        points: null,
        issuer_id: event.issuer_id,
        issuer_type: event.issuer_type,
        issued_at_ms: timestampMs,
      };
    }
  }

  getEntry(entryId: string): BadgeHistoryEntry | undefined {
    return this.store[entryId];
  }

  getAll(): BadgeHistoryEntry[] {
    return Object.values(this.store);
  }

  listByOwner(owner: string, limit = 50): BadgeHistoryEntry[] {
    return Object.values(this.store)
      .filter((entry) => entry.owner === owner)
      .slice(0, limit);
  }
}