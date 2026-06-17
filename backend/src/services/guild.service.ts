/**
 * backend/src/services/guild.service.ts
 *
 * Example Domain Service + Projection for Guilds.
 *
 * This demonstrates the clean Phase 2 architecture:
 * - Listens to typed events via the EventProcessor interface.
 * - Maintains a derived "app-ready" view (latest guild state + members).
 * - Projections are rebuilt from the immutable event log.
 * - No business logic duplication with contracts or other layers.
 *
 * Vision alignment (from roadmap + docs):
 * Guilds are large trust communities. The service powers guild pages,
 * membership lists, discovery signals, and conduct-aware views.
 *
 * This replaces any future ad-hoc guild data handling.
 */

import { readProjection, writeProjection } from '../storage.js';
import type { EventProcessor } from '../indexer.js';
import type { NamiTypedEvent } from '../events.js';
import type {
  GuildCreated,
  GuildMemberAdded,
  GuildUpdated,
} from '../types/events.js';

export interface GuildProjection {
  id: string;
  owner: string;
  owner_passport_id: string;
  name?: string; // future enrichment possible via off-chain or additional events
  description?: string;
  max_members: number;
  is_public: boolean;
  member_count: number;
  members: string[]; // addresses for MVP
  created_at_ms?: number;
  updated_at_ms?: number;
}

export type GuildStore = Record<string, GuildProjection>;

export class GuildService implements EventProcessor {
  private store: GuildStore = {};
  private readonly projectionPath: string;

  constructor(projectionPath = 'data/projections/guilds.json') {
    this.projectionPath = projectionPath;
  }

  async load(): Promise<void> {
    this.store = await readProjection<GuildStore>(this.projectionPath, {});
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

  getStats(): { count: number; publicCount: number } {
    const guilds = Object.values(this.store);

    return {
      count: guilds.length,
      publicCount: guilds.filter((guild) => guild.is_public).length,
    };
  }

  /**
   * EventProcessor contract — called by the indexer for every new event.
   * Only reacts to guild events. Pure projection logic.
   */
  async process(typed: NamiTypedEvent): Promise<void> {
    const { eventName, data } = typed;

    if (eventName === 'GuildCreated') {
      const e = data as GuildCreated;
      this.store[e.guild_id] = {
        id: e.guild_id,
        owner: e.owner,
        owner_passport_id: e.owner_passport_id,
        max_members: e.max_members,
        is_public: e.is_public,
        member_count: 1, // owner is the first member per contract
        members: [e.owner],
      };
    } else if (eventName === 'GuildMemberAdded') {
      const e = data as GuildMemberAdded;
      const guild = this.store[e.guild_id];
      if (guild && !guild.members.includes(e.member)) {
        guild.members.push(e.member);
        guild.member_count = guild.members.length;
      }
    } else if (eventName === 'GuildUpdated') {
      const e = data as GuildUpdated;
      const guild = this.store[e.guild_id];
      if (guild) {
        guild.is_public = e.is_public;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Public query API (what frontend / other services will use)
  // ---------------------------------------------------------------------------

  getGuild(guildId: string): GuildProjection | undefined {
    return this.store[guildId];
  }

  listPublicGuilds(limit = 50): GuildProjection[] {
    return Object.values(this.store)
      .filter((g) => g.is_public)
      .slice(0, limit);
  }

  getMemberGuilds(member: string): GuildProjection[] {
    return Object.values(this.store).filter((g) =>
      g.members.includes(member)
    );
  }

  getAll(): GuildProjection[] {
    return Object.values(this.store);
  }
}
