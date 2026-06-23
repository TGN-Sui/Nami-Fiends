import { config } from '../config.js';
import {
  buildChannelDiscoveryRankings,
  buildGuildDiscoveryRankings,
} from './discovery.service.js';
import { getOfficialsSubmissions } from './officials-submissions.service.js';
import { paymentConfig } from '../payment-config.js';
import type { ProjectionRegistry } from '../projection-registry.js';

export interface LaunchOpsOfficialsPending {
  suggestions: number;
  game_tickets: number;
  partner_banners: number;
  nodename_claims: number;
  total: number;
}

export interface LaunchOpsDiscoverySnapshot {
  engine_version: string;
  week_id: number;
  featured_channels: number;
  top_channel_id: string | null;
  top_guild_id: string | null;
  category_count: number;
}

export interface LaunchOpsSummary {
  generated_at_ms: number;
  network: string;
  test_launch: boolean;
  payment_allow_mock: boolean;
  package_id: string;
  official_owner_configured: boolean;
  officials_pending: LaunchOpsOfficialsPending;
  discovery: LaunchOpsDiscoverySnapshot;
  projections: {
    channels_public: number;
    channels_verified: number;
    guilds_public: number;
    moderation_active: number;
    boost_events: number;
    appeals_open: number;
    recovery_open: number;
    jury_open: number;
  };
}

function countPendingStatus(items: unknown[], pendingStatuses: Set<string>): number {
  if (!Array.isArray(items)) {
    return 0;
  }

  return items.filter((entry) => {
    if (entry === null || typeof entry !== 'object') {
      return false;
    }

    const status = (entry as { status?: unknown }).status;

    return typeof status === 'string' && pendingStatuses.has(status);
  }).length;
}

export async function buildLaunchOpsSummary(
  registry: ProjectionRegistry,
): Promise<LaunchOpsSummary> {
  const officials = await getOfficialsSubmissions();
  const channelDiscovery = buildChannelDiscoveryRankings(registry, {
    limit: 12,
    category: 'featured',
  });
  const guildDiscovery = buildGuildDiscoveryRankings(registry, { limit: 8 });

  const suggestions = countPendingStatus(officials.suggestions, new Set(['submitted']));
  const gameTickets = countPendingStatus(
    officials.gameTickets,
    new Set(['submitted', 'preapproved']),
  );
  const partnerBanners = countPendingStatus(officials.partnerBanners, new Set(['submitted']));
  const nodenameClaims = countPendingStatus(officials.nodenameClaims, new Set(['pending']));

  const channelStats = registry.channels.getStats();
  const guildStats = registry.guilds.getStats();
  const moderationStats = registry.moderation.getStats();
  const boostStats = registry.boostHistory.getStats();
  const appealStats = registry.appeals.getStats();
  const recoveryStats = registry.recovery.getStats();
  const juryStats = registry.jury.getStats();

  return {
    generated_at_ms: Date.now(),
    network: config.network,
    test_launch: config.testLaunch,
    payment_allow_mock: paymentConfig.allowMockProviders,
    package_id: config.packageId,
    official_owner_configured: config.officialOwner.trim() !== '',
    officials_pending: {
      suggestions,
      game_tickets: gameTickets,
      partner_banners: partnerBanners,
      nodename_claims: nodenameClaims,
      total: suggestions + gameTickets + partnerBanners + nodenameClaims,
    },
    discovery: {
      engine_version: channelDiscovery.cycle.engine_version,
      week_id: channelDiscovery.cycle.week_id,
      featured_channels: channelDiscovery.channels.length,
      top_channel_id: channelDiscovery.channels[0]?.channel_id ?? null,
      top_guild_id: guildDiscovery.guilds[0]?.guild_id ?? null,
      category_count: 9,
    },
    projections: {
      channels_public: channelStats.publicCount,
      channels_verified: channelStats.verifiedCount,
      guilds_public: guildStats.publicCount,
      moderation_active: moderationStats.activeCount,
      boost_events: boostStats.count,
      appeals_open: appealStats.openCount,
      recovery_open: recoveryStats.openCount,
      jury_open: juryStats.openCount,
    },
  };
}