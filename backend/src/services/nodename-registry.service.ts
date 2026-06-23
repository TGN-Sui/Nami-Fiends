import { readProjection, writeProjection } from '../storage.js';
import type { EventProcessor } from '../indexer.js';
import type { NamiTypedEvent } from '../events.js';
import { decodeMoveBytes } from '../move-bytes.js';
import type { EnterNamiCompleted, NodenameRegistered } from '../types/events.js';

export interface NodenameRegistryEntry {
  nodename: string;
  identity_id: string;
  owner: string;
  passport_id: string | null;
  profile_id: string | null;
  archetype: number | null;
  registered_at_ms: string | null;
  updated_at_ms: string | null;
}

export type NodenameRegistryStore = {
  byNodename: Record<string, NodenameRegistryEntry>;
  byOwner: Record<string, string>;
};

function emptyStore(): NodenameRegistryStore {
  return {
    byNodename: {},
    byOwner: {},
  };
}

function normalizeNodename(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeOwner(value: string): string {
  return value.trim().toLowerCase();
}

export class NodenameRegistryService implements EventProcessor {
  private store: NodenameRegistryStore = emptyStore();
  private readonly projectionPath: string;

  constructor(projectionPath = 'data/projections/nodename-registry.json') {
    this.projectionPath = projectionPath;
  }

  async load(): Promise<void> {
    this.store = await readProjection<NodenameRegistryStore>(this.projectionPath, emptyStore());

    if (!this.store.byNodename) {
      this.store.byNodename = {};
    }

    if (!this.store.byOwner) {
      this.store.byOwner = {};
    }
  }

  async save(): Promise<void> {
    await writeProjection(this.projectionPath, this.store);
  }

  async clear(): Promise<void> {
    this.store = emptyStore();
  }

  getProjectionPath(): string {
    return this.projectionPath;
  }

  getStats(): { count: number } {
    return { count: Object.keys(this.store.byNodename).length };
  }

  async process(typed: NamiTypedEvent): Promise<void> {
    const { eventName, data, timestampMs } = typed;

    if (eventName === 'NodenameRegistered') {
      const event = data as NodenameRegistered;
      this.upsertEntry({
        nodename: normalizeNodename(decodeMoveBytes(event.nodename)),
        identity_id: event.identity_id,
        owner: normalizeOwner(event.owner),
        passport_id: null,
        profile_id: null,
        archetype: null,
        registered_at_ms: timestampMs,
        updated_at_ms: timestampMs,
      });
      return;
    }

    if (eventName === 'EnterNamiCompleted') {
      const event = data as EnterNamiCompleted;
      this.upsertEntry({
        nodename: normalizeNodename(decodeMoveBytes(event.nodename)),
        identity_id: event.identity_id,
        owner: normalizeOwner(event.owner),
        passport_id: event.passport_id,
        profile_id: event.profile_id,
        archetype: event.archetype,
        registered_at_ms: timestampMs,
        updated_at_ms: timestampMs,
      });
    }
  }

  private upsertEntry(entry: NodenameRegistryEntry): void {
    if (!entry.nodename || !entry.identity_id.startsWith('0x') || !entry.owner.startsWith('0x')) {
      return;
    }

    const existing = this.store.byNodename[entry.nodename];
    const next: NodenameRegistryEntry = {
      nodename: entry.nodename,
      identity_id: entry.identity_id,
      owner: entry.owner,
      passport_id: entry.passport_id ?? existing?.passport_id ?? null,
      profile_id: entry.profile_id ?? existing?.profile_id ?? null,
      archetype: entry.archetype ?? existing?.archetype ?? null,
      registered_at_ms: existing?.registered_at_ms ?? entry.registered_at_ms,
      updated_at_ms: entry.updated_at_ms,
    };

    this.store.byNodename[entry.nodename] = next;
    this.store.byOwner[entry.owner] = entry.nodename;
  }

  getByNodename(nodename: string): NodenameRegistryEntry | undefined {
    return this.store.byNodename[normalizeNodename(nodename)];
  }

  getByOwner(owner: string): NodenameRegistryEntry | undefined {
    const nodename = this.store.byOwner[normalizeOwner(owner)];

    if (!nodename) {
      return undefined;
    }

    return this.store.byNodename[nodename];
  }

  list(limit = 50): NodenameRegistryEntry[] {
    return Object.values(this.store.byNodename)
      .sort((left, right) => {
        const leftMs = Number(left.updated_at_ms ?? left.registered_at_ms ?? 0);
        const rightMs = Number(right.updated_at_ms ?? right.registered_at_ms ?? 0);
        return rightMs - leftMs;
      })
      .slice(0, limit);
  }
}