import { readProjection, writeProjection } from '../storage.js';
import type { EventProcessor } from '../indexer.js';
import type { NamiTypedEvent } from '../events.js';
import type { SquadCreated, SquadMemberSponsored } from '../types/events.js';

export interface SquadProjection {
  id: string;
  owner: string;
  owner_passport_id: string;
  max_slots: number;
  member_count: number;
  members: string[];
}

export type SquadStore = Record<string, SquadProjection>;

export class SquadService implements EventProcessor {
  private store: SquadStore = {};
  private readonly projectionPath: string;

  constructor(projectionPath = 'data/projections/squads.json') {
    this.projectionPath = projectionPath;
  }

  async load(): Promise<void> {
    this.store = await readProjection<SquadStore>(this.projectionPath, {});
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

  getStats(): { count: number; totalMembers: number } {
    const squads = Object.values(this.store);

    return {
      count: squads.length,
      totalMembers: squads.reduce((total, squad) => total + squad.member_count, 0),
    };
  }

  async process(typed: NamiTypedEvent): Promise<void> {
    const { eventName, data } = typed;

    if (eventName === 'SquadCreated') {
      const event = data as SquadCreated;

      this.store[event.squad_id] = {
        id: event.squad_id,
        owner: event.owner,
        owner_passport_id: event.owner_passport_id,
        max_slots: event.max_slots,
        member_count: 1,
        members: [event.owner],
      };
      return;
    }

    if (eventName === 'SquadMemberSponsored') {
      const event = data as SquadMemberSponsored;
      const squad = this.store[event.squad_id];

      if (!squad || squad.members.includes(event.member)) {
        return;
      }

      squad.members.push(event.member);
      squad.member_count = squad.members.length;
    }
  }

  getSquad(squadId: string): SquadProjection | undefined {
    return this.store[squadId];
  }

  getAll(): SquadProjection[] {
    return Object.values(this.store);
  }

  getMemberSquads(member: string): SquadProjection[] {
    return Object.values(this.store).filter((squad) =>
      squad.members.includes(member)
    );
  }

  getOwnerSquads(owner: string): SquadProjection[] {
    return Object.values(this.store).filter((squad) => squad.owner === owner);
  }
}