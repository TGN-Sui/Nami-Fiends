import { config } from './config.js';
import type { IndexedNamiEvent } from './events.js';
import { ProjectionRegistry } from './projection-registry.js';
import {
  getFileSizeBytes,
  readJsonFile,
  readJsonLines,
  type CursorStore,
} from './storage.js';

export interface IndexerStats {
  generatedAt: string;
  network: string;
  packageId: string;
  eventLog: {
    path: string;
    totalEvents: number;
    byModule: Record<string, number>;
    fileSizeBytes: number | null;
  };
  cursors: {
    path: string;
    modulesTracked: number;
    positions: CursorStore;
  };
  projections: {
    services: string[];
    guilds: {
      path: string;
      count: number;
      publicCount: number;
      fileSizeBytes: number | null;
    };
    recovery: {
      path: string;
      count: number;
      openCount: number;
      resolvedCount: number;
      fileSizeBytes: number | null;
    };
    passportTimelines: {
      path: string;
      passportCount: number;
      totalEntries: number;
      fileSizeBytes: number | null;
    };
    appeals: {
      path: string;
      count: number;
      openCount: number;
      resolvedCount: number;
      fileSizeBytes: number | null;
    };
    jury: {
      path: string;
      count: number;
      openCount: number;
      closedCount: number;
      fileSizeBytes: number | null;
    };
    squads: {
      path: string;
      count: number;
      totalMembers: number;
      fileSizeBytes: number | null;
    };
    profiles: {
      path: string;
      count: number;
      publicCount: number;
      fileSizeBytes: number | null;
    };
    channels: {
      path: string;
      count: number;
      publicCount: number;
      verifiedCount: number;
      fileSizeBytes: number | null;
    };
    moderation: {
      path: string;
      count: number;
      activeCount: number;
      fileSizeBytes: number | null;
    };
    badgeHistory: {
      path: string;
      count: number;
      mintedCount: number;
      issuerCount: number;
      fileSizeBytes: number | null;
    };
    boostHistory: {
      path: string;
      count: number;
      uniqueOwners: number;
      uniqueChannels: number;
      fileSizeBytes: number | null;
    };
    channelAccess: {
      path: string;
      count: number;
      npcChatEnabledCount: number;
      fileSizeBytes: number | null;
    };
    nodenameRegistry: {
      path: string;
      count: number;
      fileSizeBytes: number | null;
    };
  };
}

export async function collectIndexerStats(
  registry: ProjectionRegistry
): Promise<IndexerStats> {
  const events = await readJsonLines<IndexedNamiEvent>(config.eventLogPath);
  const byModule: Record<string, number> = {};

  for (const event of events) {
    byModule[event.module] = (byModule[event.module] ?? 0) + 1;
  }

  const cursors = await readJsonFile<CursorStore>(config.cursorPath, {});
  const guildStats = registry.guilds.getStats();
  const recoveryStats = registry.recovery.getStats();
  const timelineStats = registry.passportTimelines.getStats();
  const appealStats = registry.appeals.getStats();
  const juryStats = registry.jury.getStats();
  const squadStats = registry.squads.getStats();
  const profileStats = registry.profiles.getStats();
  const channelStats = registry.channels.getStats();
  const moderationStats = registry.moderation.getStats();
  const badgeHistoryStats = registry.badgeHistory.getStats();
  const boostHistoryStats = registry.boostHistory.getStats();
  const channelAccessStats = registry.channelAccess.getStats();
  const nodenameRegistryStats = registry.nodenameRegistry.getStats();

  return {
    generatedAt: new Date().toISOString(),
    network: config.network,
    packageId: config.packageId,
    eventLog: {
      path: config.eventLogPath,
      totalEvents: events.length,
      byModule,
      fileSizeBytes: await getFileSizeBytes(config.eventLogPath),
    },
    cursors: {
      path: config.cursorPath,
      modulesTracked: Object.keys(cursors).length,
      positions: cursors,
    },
    projections: {
      services: registry.getServiceNames(),
      guilds: {
        path: registry.guilds.getProjectionPath(),
        count: guildStats.count,
        publicCount: guildStats.publicCount,
        fileSizeBytes: await getFileSizeBytes(registry.guilds.getProjectionPath()),
      },
      recovery: {
        path: registry.recovery.getProjectionPath(),
        count: recoveryStats.count,
        openCount: recoveryStats.openCount,
        resolvedCount: recoveryStats.resolvedCount,
        fileSizeBytes: await getFileSizeBytes(registry.recovery.getProjectionPath()),
      },
      passportTimelines: {
        path: registry.passportTimelines.getProjectionPath(),
        passportCount: timelineStats.passportCount,
        totalEntries: timelineStats.totalEntries,
        fileSizeBytes: await getFileSizeBytes(
          registry.passportTimelines.getProjectionPath()
        ),
      },
      appeals: {
        path: registry.appeals.getProjectionPath(),
        count: appealStats.count,
        openCount: appealStats.openCount,
        resolvedCount: appealStats.resolvedCount,
        fileSizeBytes: await getFileSizeBytes(registry.appeals.getProjectionPath()),
      },
      jury: {
        path: registry.jury.getProjectionPath(),
        count: juryStats.count,
        openCount: juryStats.openCount,
        closedCount: juryStats.closedCount,
        fileSizeBytes: await getFileSizeBytes(registry.jury.getProjectionPath()),
      },
      squads: {
        path: registry.squads.getProjectionPath(),
        count: squadStats.count,
        totalMembers: squadStats.totalMembers,
        fileSizeBytes: await getFileSizeBytes(registry.squads.getProjectionPath()),
      },
      profiles: {
        path: registry.profiles.getProjectionPath(),
        count: profileStats.count,
        publicCount: profileStats.publicCount,
        fileSizeBytes: await getFileSizeBytes(registry.profiles.getProjectionPath()),
      },
      channels: {
        path: registry.channels.getProjectionPath(),
        count: channelStats.count,
        publicCount: channelStats.publicCount,
        verifiedCount: channelStats.verifiedCount,
        fileSizeBytes: await getFileSizeBytes(registry.channels.getProjectionPath()),
      },
      moderation: {
        path: registry.moderation.getProjectionPath(),
        count: moderationStats.count,
        activeCount: moderationStats.activeCount,
        fileSizeBytes: await getFileSizeBytes(registry.moderation.getProjectionPath()),
      },
      badgeHistory: {
        path: registry.badgeHistory.getProjectionPath(),
        count: badgeHistoryStats.count,
        mintedCount: badgeHistoryStats.mintedCount,
        issuerCount: badgeHistoryStats.issuerCount,
        fileSizeBytes: await getFileSizeBytes(registry.badgeHistory.getProjectionPath()),
      },
      boostHistory: {
        path: registry.boostHistory.getProjectionPath(),
        count: boostHistoryStats.count,
        uniqueOwners: boostHistoryStats.uniqueOwners,
        uniqueChannels: boostHistoryStats.uniqueChannels,
        fileSizeBytes: await getFileSizeBytes(registry.boostHistory.getProjectionPath()),
      },
      channelAccess: {
        path: registry.channelAccess.getProjectionPath(),
        count: channelAccessStats.count,
        npcChatEnabledCount: channelAccessStats.npcChatEnabledCount,
        fileSizeBytes: await getFileSizeBytes(registry.channelAccess.getProjectionPath()),
      },
      nodenameRegistry: {
        path: registry.nodenameRegistry.getProjectionPath(),
        count: nodenameRegistryStats.count,
        fileSizeBytes: await getFileSizeBytes(registry.nodenameRegistry.getProjectionPath()),
      },
    },
  };
}

export function formatIndexerStats(stats: IndexerStats): string {
  const moduleSummary = Object.entries(stats.eventLog.byModule)
    .sort((left, right) => right[1] - left[1])
    .map(([module, count]) => `${module}:${count}`)
    .join(', ');

  return [
    `[nami-indexer] stats @ ${stats.generatedAt}`,
    `[nami-indexer] event log: ${stats.eventLog.totalEvents} event(s) @ ${stats.eventLog.path}`,
    moduleSummary.length > 0
      ? `[nami-indexer] event modules: ${moduleSummary}`
      : '[nami-indexer] event modules: (none indexed yet)',
    `[nami-indexer] cursors: ${stats.cursors.modulesTracked} module(s) tracked`,
    `[nami-indexer] projections: ${stats.projections.guilds.count} guild(s), ${stats.projections.recovery.count} recovery (${stats.projections.recovery.openCount} open), ${stats.projections.appeals.count} appeal(s) (${stats.projections.appeals.openCount} open), ${stats.projections.jury.count} jury case(s) (${stats.projections.jury.openCount} open), ${stats.projections.squads.count} squad(s), ${stats.projections.profiles.count} profile(s), ${stats.projections.channels.count} channel(s), ${stats.projections.channelAccess.count} access policy/policies, ${stats.projections.moderation.count} moderation record(s), ${stats.projections.badgeHistory.count} badge event(s), ${stats.projections.boostHistory.count} boost event(s), ${stats.projections.passportTimelines.passportCount} timeline(s)`,
    `[nami-indexer] services: ${stats.projections.services.join(', ')}`,
  ].join('\n');
}