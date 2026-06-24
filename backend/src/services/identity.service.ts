import { readProjection, writeProjection } from '../storage.js';
import type { EventProcessor } from '../indexer.js';
import type { NamiTypedEvent } from '../events.js';
import { decodeMoveBytes } from '../move-bytes.js';
import type { IdentityCreated } from '../types/events.js';

export interface IdentityProjection {
  identity_id: string;
  owner: string;
  nodename: string | null;
  created_at_ms: string | null;
  updated_at_ms: string | null;
}

export type IdentityStore = {
  byIdentityId: Record<string, IdentityProjection>;
  byOwner: Record<string, string>;
};

function emptyStore(): IdentityStore {
  return {
    byIdentityId: {},
    byOwner: {},
  };
}

function normalizeOwner(value: string): string {
  return value.trim().toLowerCase();
}

export class IdentityService implements EventProcessor {
  private store: IdentityStore = emptyStore();
  private readonly projectionPath: string;

  constructor(projectionPath = 'data/projections/identities.json') {
    this.projectionPath = projectionPath;
  }

  async load(): Promise<void> {
    this.store = await readProjection<IdentityStore>(this.projectionPath, emptyStore());

    if (!this.store.byIdentityId) {
      this.store.byIdentityId = {};
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
    return { count: Object.keys(this.store.byIdentityId).length };
  }

  async process(typed: NamiTypedEvent): Promise<void> {
    const { eventName, data, timestampMs } = typed;

    if (eventName !== 'IdentityCreated') {
      return;
    }

    const event = data as IdentityCreated;

    if (!event.identity_id.startsWith('0x') || !event.owner.startsWith('0x')) {
      return;
    }

    const owner = normalizeOwner(event.owner);
    const nodenameRaw = decodeMoveBytes(event.nodename);
    const nodename = nodenameRaw.trim() ? nodenameRaw.trim().toLowerCase() : null;
    const existing = this.store.byIdentityId[event.identity_id];

    const next: IdentityProjection = {
      identity_id: event.identity_id,
      owner,
      nodename: nodename ?? existing?.nodename ?? null,
      created_at_ms: existing?.created_at_ms ?? timestampMs,
      updated_at_ms: timestampMs,
    };

    this.store.byIdentityId[event.identity_id] = next;
    this.store.byOwner[owner] = event.identity_id;
  }

  getByIdentityId(identityId: string): IdentityProjection | undefined {
    return this.store.byIdentityId[identityId];
  }

  getByOwner(owner: string): IdentityProjection | undefined {
    const identityId = this.store.byOwner[normalizeOwner(owner)];

    if (!identityId) {
      return undefined;
    }

    return this.store.byIdentityId[identityId];
  }

  list(limit = 50): IdentityProjection[] {
    return Object.values(this.store.byIdentityId)
      .sort((left, right) => {
        const leftMs = Number(left.updated_at_ms ?? left.created_at_ms ?? 0);
        const rightMs = Number(right.updated_at_ms ?? right.created_at_ms ?? 0);
        return rightMs - leftMs;
      })
      .slice(0, limit);
  }
}