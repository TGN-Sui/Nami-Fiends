import { readProjection, writeProjection } from '../storage.js';
import type { EventProcessor } from '../indexer.js';
import type { NamiTypedEvent } from '../events.js';
import type {
  ChannelCreated,
  ChannelUpdated,
  ChannelVerified,
} from '../types/events.js';

export interface ChannelProjection {
  id: string;
  owner: string;
  owner_passport_id: string;
  is_public: boolean;
  is_verified: boolean;
  created_at_ms: string | null;
  updated_at_ms: string | null;
  verified_at_ms: string | null;
}

export type ChannelStore = Record<string, ChannelProjection>;

export class ChannelService implements EventProcessor {
  private store: ChannelStore = {};
  private readonly projectionPath: string;

  constructor(projectionPath = 'data/projections/channels.json') {
    this.projectionPath = projectionPath;
  }

  async load(): Promise<void> {
    this.store = await readProjection<ChannelStore>(this.projectionPath, {});
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

  getStats(): { count: number; publicCount: number; verifiedCount: number } {
    const channels = Object.values(this.store);

    return {
      count: channels.length,
      publicCount: channels.filter((channel) => channel.is_public).length,
      verifiedCount: channels.filter((channel) => channel.is_verified).length,
    };
  }

  async process(typed: NamiTypedEvent): Promise<void> {
    const { eventName, data, timestampMs } = typed;

    if (eventName === 'ChannelCreated') {
      const event = data as ChannelCreated;

      this.store[event.channel_id] = {
        id: event.channel_id,
        owner: event.owner,
        owner_passport_id: event.owner_passport_id,
        is_public: event.is_public,
        is_verified: false,
        created_at_ms: timestampMs,
        updated_at_ms: timestampMs,
        verified_at_ms: null,
      };
      return;
    }

    if (eventName === 'ChannelUpdated') {
      const event = data as ChannelUpdated;
      const channel = this.store[event.channel_id];

      if (!channel) {
        return;
      }

      channel.owner = event.owner;
      channel.is_public = event.is_public;
      channel.updated_at_ms = timestampMs;
      return;
    }

    if (eventName === 'ChannelVerified') {
      const event = data as ChannelVerified;
      const channel = this.store[event.channel_id];

      if (!channel) {
        return;
      }

      channel.owner = event.owner;
      channel.is_verified = true;
      channel.verified_at_ms = timestampMs;
      channel.updated_at_ms = timestampMs;
    }
  }

  getChannel(channelId: string): ChannelProjection | undefined {
    return this.store[channelId];
  }

  getAll(): ChannelProjection[] {
    return Object.values(this.store);
  }

  getOwnerChannels(owner: string): ChannelProjection[] {
    return Object.values(this.store).filter((channel) => channel.owner === owner);
  }

  listPublic(limit = 50): ChannelProjection[] {
    return Object.values(this.store)
      .filter((channel) => channel.is_public)
      .slice(0, limit);
  }

  listVerified(limit = 50): ChannelProjection[] {
    return Object.values(this.store)
      .filter((channel) => channel.is_verified)
      .slice(0, limit);
  }
}