import { readProjection, writeProjection } from '../storage.js';
import type { EventProcessor } from '../indexer.js';
import type { NamiTypedEvent } from '../events.js';
import type { ProfileCreated, ProfileUpdated } from '../types/events.js';

export interface ProfileProjection {
  id: string;
  owner: string;
  passport_id: string;
  is_public: boolean;
  created_at_ms: string | null;
  updated_at_ms: string | null;
}

export type ProfileStore = Record<string, ProfileProjection>;

export class ProfileService implements EventProcessor {
  private store: ProfileStore = {};
  private readonly projectionPath: string;

  constructor(projectionPath = 'data/projections/profiles.json') {
    this.projectionPath = projectionPath;
  }

  async load(): Promise<void> {
    this.store = await readProjection<ProfileStore>(this.projectionPath, {});
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
    const profiles = Object.values(this.store);

    return {
      count: profiles.length,
      publicCount: profiles.filter((profile) => profile.is_public).length,
    };
  }

  async process(typed: NamiTypedEvent): Promise<void> {
    const { eventName, data, timestampMs } = typed;

    if (eventName === 'ProfileCreated') {
      const event = data as ProfileCreated;

      this.store[event.profile_id] = {
        id: event.profile_id,
        owner: event.owner,
        passport_id: event.passport_id,
        is_public: event.is_public,
        created_at_ms: timestampMs,
        updated_at_ms: timestampMs,
      };
      return;
    }

    if (eventName === 'ProfileUpdated') {
      const event = data as ProfileUpdated;
      const profile = this.store[event.profile_id];

      if (!profile) {
        this.store[event.profile_id] = {
          id: event.profile_id,
          owner: event.owner,
          passport_id: event.passport_id,
          is_public: event.is_public,
          created_at_ms: timestampMs,
          updated_at_ms: timestampMs,
        };
        return;
      }

      profile.owner = event.owner;
      profile.passport_id = event.passport_id;
      profile.is_public = event.is_public;
      profile.updated_at_ms = timestampMs;
    }
  }

  getProfile(profileId: string): ProfileProjection | undefined {
    return this.store[profileId];
  }

  getAll(): ProfileProjection[] {
    return Object.values(this.store);
  }

  getByOwner(owner: string): ProfileProjection | undefined {
    return Object.values(this.store).find((profile) => profile.owner === owner);
  }

  listPublic(limit = 50): ProfileProjection[] {
    return Object.values(this.store)
      .filter((profile) => profile.is_public)
      .slice(0, limit);
  }
}