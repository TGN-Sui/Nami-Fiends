import type { EventProcessor } from './indexer.js';
import type { NamiTypedEvent } from './events.js';
import { AppealService } from './services/appeal.service.js';
import { BadgeHistoryService } from './services/badge-history.service.js';
import { BoostHistoryService } from './services/boost-history.service.js';
import { ChannelAccessService } from './services/channel-access.service.js';
import { ChannelService } from './services/channel.service.js';
import { GuildService } from './services/guild.service.js';
import { JuryService } from './services/jury.service.js';
import { ModerationService } from './services/moderation.service.js';
import { PassportTimelineService } from './services/passport-timeline.service.js';
import { ProfileService } from './services/profile.service.js';
import { RecoveryService } from './services/recovery.service.js';
import { SquadService } from './services/squad.service.js';
import { NodenameRegistryService } from './services/nodename-registry.service.js';

export class ProjectionRegistry {
  readonly guilds = new GuildService();
  readonly recovery = new RecoveryService();
  readonly passportTimelines = new PassportTimelineService();
  readonly appeals = new AppealService();
  readonly jury = new JuryService();
  readonly squads = new SquadService();
  readonly profiles = new ProfileService();
  readonly channels = new ChannelService();
  readonly channelAccess = new ChannelAccessService();
  readonly moderation = new ModerationService();
  readonly badgeHistory = new BadgeHistoryService();
  readonly boostHistory = new BoostHistoryService();
  readonly nodenameRegistry = new NodenameRegistryService();

  private readonly processors: EventProcessor[];

  constructor() {
    this.processors = [
      this.guilds,
      this.recovery,
      this.passportTimelines,
      this.appeals,
      this.jury,
      this.squads,
      this.profiles,
      this.channels,
      this.channelAccess,
      this.moderation,
      this.badgeHistory,
      this.boostHistory,
      this.nodenameRegistry,
    ];
  }

  getProcessors(): EventProcessor[] {
    return this.processors;
  }

  async load(): Promise<void> {
    await Promise.all([
      this.guilds.load(),
      this.recovery.load(),
      this.passportTimelines.load(),
      this.appeals.load(),
      this.jury.load(),
      this.squads.load(),
      this.profiles.load(),
      this.channels.load(),
      this.channelAccess.load(),
      this.moderation.load(),
      this.badgeHistory.load(),
      this.boostHistory.load(),
      this.nodenameRegistry.load(),
    ]);
  }

  async save(): Promise<void> {
    await Promise.all([
      this.guilds.save(),
      this.recovery.save(),
      this.passportTimelines.save(),
      this.appeals.save(),
      this.jury.save(),
      this.squads.save(),
      this.profiles.save(),
      this.channels.save(),
      this.channelAccess.save(),
      this.moderation.save(),
      this.badgeHistory.save(),
      this.boostHistory.save(),
      this.nodenameRegistry.save(),
    ]);
  }

  async clear(): Promise<void> {
    await Promise.all([
      this.guilds.clear(),
      this.recovery.clear(),
      this.passportTimelines.clear(),
      this.appeals.clear(),
      this.jury.clear(),
      this.squads.clear(),
      this.profiles.clear(),
      this.channels.clear(),
      this.channelAccess.clear(),
      this.moderation.clear(),
      this.badgeHistory.clear(),
      this.boostHistory.clear(),
      this.nodenameRegistry.clear(),
    ]);
  }

  async processEvent(typed: NamiTypedEvent): Promise<void> {
    for (const processor of this.processors) {
      await processor.process(typed);
    }
  }

  getServiceNames(): string[] {
    return [
      'GuildService',
      'RecoveryService',
      'PassportTimelineService',
      'AppealService',
      'JuryService',
      'SquadService',
      'ProfileService',
      'ChannelService',
      'ChannelAccessService',
      'ModerationService',
      'BadgeHistoryService',
      'BoostHistoryService',
      'NodenameRegistryService',
    ];
  }
}