import { readProjection, writeProjection } from '../storage.js';
import type { EventProcessor } from '../indexer.js';
import type { NamiTypedEvent } from '../events.js';
import type {
  ChannelAccessPolicyCreated,
  ChannelAccessRuleUpdated,
} from '../types/events.js';

export interface ChannelAccessProjection {
  channel_id: string;
  owner: string;
  allow_npc_chat: boolean;
  minimum_tier: number;
  minimum_reputation: number;
  created_at_ms: string | null;
  updated_at_ms: string | null;
}

export type ChannelAccessStore = Record<string, ChannelAccessProjection>;

export class ChannelAccessService implements EventProcessor {
  private store: ChannelAccessStore = {};
  private readonly projectionPath: string;

  constructor(projectionPath = 'data/projections/channel-access.json') {
    this.projectionPath = projectionPath;
  }

  async load(): Promise<void> {
    this.store = await readProjection<ChannelAccessStore>(this.projectionPath, {});
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

  getStats(): { count: number; npcChatEnabledCount: number } {
    const policies = Object.values(this.store);

    return {
      count: policies.length,
      npcChatEnabledCount: policies.filter((policy) => policy.allow_npc_chat).length,
    };
  }

  async process(typed: NamiTypedEvent): Promise<void> {
    const { eventName, data, timestampMs } = typed;

    if (eventName === 'ChannelAccessPolicyCreated') {
      const event = data as ChannelAccessPolicyCreated;

      this.store[event.channel_id] = {
        channel_id: event.channel_id,
        owner: event.owner,
        allow_npc_chat: event.allow_npc_chat,
        minimum_tier: event.minimum_tier,
        minimum_reputation: event.minimum_reputation,
        created_at_ms: timestampMs,
        updated_at_ms: timestampMs,
      };
      return;
    }

    if (eventName === 'ChannelAccessRuleUpdated') {
      const event = data as ChannelAccessRuleUpdated;
      const policy = this.store[event.channel_id];

      if (!policy) {
        this.store[event.channel_id] = {
          channel_id: event.channel_id,
          owner: event.owner,
          allow_npc_chat: event.allow_npc_chat,
          minimum_tier: event.minimum_tier,
          minimum_reputation: event.minimum_reputation,
          created_at_ms: timestampMs,
          updated_at_ms: timestampMs,
        };
        return;
      }

      policy.owner = event.owner;
      policy.allow_npc_chat = event.allow_npc_chat;
      policy.minimum_tier = event.minimum_tier;
      policy.minimum_reputation = event.minimum_reputation;
      policy.updated_at_ms = timestampMs;
    }
  }

  getPolicy(channelId: string): ChannelAccessProjection | undefined {
    return this.store[channelId];
  }

  getAll(): ChannelAccessProjection[] {
    return Object.values(this.store);
  }

  getOwnerPolicies(owner: string): ChannelAccessProjection[] {
    return Object.values(this.store).filter((policy) => policy.owner === owner);
  }
}