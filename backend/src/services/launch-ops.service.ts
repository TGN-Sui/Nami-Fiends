import { config } from '../config.js';
import {
  buildChannelDiscoveryRankings,
  buildGuildDiscoveryRankings,
} from './discovery.service.js';
import { getOfficialsSubmissions } from './officials-submissions.service.js';
import { paymentConfig } from '../payment-config.js';
import { getPublicPaymentConfig } from './membership-payments.service.js';
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

export interface LaunchOpsPaymentReadiness {
  treasury_configured: boolean;
  stripe_configured: boolean;
  paypal_configured: boolean;
  crypto_checkout_enabled: boolean;
  card_checkout_enabled: boolean;
  paypal_checkout_enabled: boolean;
}

export interface LaunchOpsExitGates {
  core_policy_ready: boolean;
  card_checkout_ready: boolean;
  crypto_checkout_ready: boolean;
  phase_8_launch_ready: boolean;
}

export interface LaunchOpsSummary {
  generated_at_ms: number;
  network: string;
  test_launch: boolean;
  payment_allow_mock: boolean;
  package_id: string;
  official_owner_configured: boolean;
  payment_readiness: LaunchOpsPaymentReadiness;
  exit_gates: LaunchOpsExitGates;
  pending_actions: string[];
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
  const publicPayment = getPublicPaymentConfig();
  const corePolicyReady =
    config.testLaunch && !paymentConfig.allowMockProviders && config.officialOwner.trim() !== '';
  const cardCheckoutReady = publicPayment.cardEnabled && publicPayment.stripePublishableKey !== null;
  const cryptoCheckoutReady = publicPayment.cryptoEnabled;

  const pendingActions: string[] = [];

  if (!publicPayment.treasuryAddress) {
    pendingActions.push(
      'Set NAMI_PAYMENT_TREASURY_ADDRESS on Render (Sui wallet for crypto checkout + $GOON tips).',
    );
  }

  if (!publicPayment.stripePublishableKey) {
    pendingActions.push('Set STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, and STRIPE_WEBHOOK_SECRET on Render.');
  }

  if (!publicPayment.paypalClientId) {
    pendingActions.push('Optional: set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET for PayPal checkout.');
  }

  if (!process.env.NAMI_ADMIN_CAP_BACKUP_HOLDER?.trim()) {
    pendingActions.push('Assign AdminCap backup holder (see docs/admincap-custody.md).');
  }

  pendingActions.push('Legal review of privacy draft before mainnet (human step).');

  return {
    generated_at_ms: Date.now(),
    network: config.network,
    test_launch: config.testLaunch,
    payment_allow_mock: paymentConfig.allowMockProviders,
    package_id: config.packageId,
    official_owner_configured: config.officialOwner.trim() !== '',
    payment_readiness: {
      treasury_configured: publicPayment.treasuryAddress !== null,
      stripe_configured: publicPayment.stripePublishableKey !== null,
      paypal_configured: publicPayment.paypalClientId !== null,
      crypto_checkout_enabled: publicPayment.cryptoEnabled,
      card_checkout_enabled: publicPayment.cardEnabled,
      paypal_checkout_enabled: publicPayment.paypalEnabled,
    },
    exit_gates: {
      core_policy_ready: corePolicyReady,
      card_checkout_ready: cardCheckoutReady,
      crypto_checkout_ready: cryptoCheckoutReady,
      phase_8_launch_ready: corePolicyReady && cardCheckoutReady,
    },
    pending_actions: pendingActions,
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