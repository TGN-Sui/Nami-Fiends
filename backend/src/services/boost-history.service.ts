import { readProjection, writeProjection } from '../storage.js';
import type { EventProcessor } from '../indexer.js';
import type { NamiTypedEvent } from '../events.js';
import type { BoostUsed } from '../types/events.js';

export interface BoostHistoryEntry {
  id: string;
  owner: string;
  channel_id: string;
  power: number;
  tier: number;
  week_id: number;
  used_at_ms: string | null;
}

export type BoostHistoryStore = Record<string, BoostHistoryEntry>;

function entryId(typed: NamiTypedEvent): string {
  return `${typed.id.txDigest}:${typed.id.eventSeq}`;
}

export class BoostHistoryService implements EventProcessor {
  private store: BoostHistoryStore = {};
  private readonly projectionPath: string;

  constructor(projectionPath = 'data/projections/boost-history.json') {
    this.projectionPath = projectionPath;
  }

  async load(): Promise<void> {
    this.store = await readProjection<BoostHistoryStore>(this.projectionPath, {});
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

  getStats(): { count: number; uniqueOwners: number; uniqueChannels: number } {
    const entries = Object.values(this.store);
    const owners = new Set(entries.map((entry) => entry.owner));
    const channels = new Set(entries.map((entry) => entry.channel_id));

    return {
      count: entries.length,
      uniqueOwners: owners.size,
      uniqueChannels: channels.size,
    };
  }

  async process(typed: NamiTypedEvent): Promise<void> {
    const { eventName, data, timestampMs } = typed;

    if (eventName !== 'BoostUsed') {
      return;
    }

    const event = data as BoostUsed;
    const id = entryId(typed);

    this.store[id] = {
      id,
      owner: event.owner,
      channel_id: event.channel_id,
      power: event.power,
      tier: event.tier,
      week_id: event.week_id,
      used_at_ms: timestampMs,
    };
  }

  getEntry(entryId: string): BoostHistoryEntry | undefined {
    return this.store[entryId];
  }

  getAll(): BoostHistoryEntry[] {
    return Object.values(this.store);
  }

  listByOwner(owner: string, limit = 50): BoostHistoryEntry[] {
    return Object.values(this.store)
      .filter((entry) => entry.owner === owner)
      .slice(0, limit);
  }

  listByChannel(channelId: string, limit = 50): BoostHistoryEntry[] {
    return Object.values(this.store)
      .filter((entry) => entry.channel_id === channelId)
      .slice(0, limit);
  }
}