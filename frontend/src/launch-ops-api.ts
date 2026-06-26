import { isIndexerLive, readAppConfig } from './app-config.js';
import { readIndexerUrl } from './protocol-env.js';

export type LaunchOpsOfficialsPending = {
  suggestions: number;
  game_tickets: number;
  partner_banners: number;
  nodename_claims: number;
  total: number;
};

export type LaunchOpsPaymentReadiness = {
  treasury_configured: boolean;
  stripe_configured: boolean;
  paypal_configured: boolean;
  crypto_checkout_enabled: boolean;
  card_checkout_enabled: boolean;
  paypal_checkout_enabled: boolean;
};

export type LaunchOpsWalrusBorderArtReadiness = {
  configured: boolean;
  network: string | null;
  aggregator_url: string;
  publisher_url: string;
  border_art_required: boolean;
  storage_epochs: number;
  catalog_quilt_blob_id: string | null;
  catalog_version_ms: number | null;
  catalog_patch_count: number;
  catalog_last_publish_ms: number | null;
  catalog_attestation_status: string | null;
  catalog_attestation_tx_digest: string | null;
};

export type LaunchOpsExitGates = {
  core_policy_ready: boolean;
  card_checkout_ready: boolean;
  crypto_checkout_ready: boolean;
  phase_8_launch_ready: boolean;
};

export type LaunchOpsSummary = {
  generated_at_ms: number;
  network: string;
  test_launch: boolean;
  payment_allow_mock: boolean;
  package_id: string;
  official_owner_configured: boolean;
  payment_readiness: LaunchOpsPaymentReadiness;
  walrus_border_art: LaunchOpsWalrusBorderArtReadiness;
  exit_gates: LaunchOpsExitGates;
  pending_actions: string[];
  officials_pending: LaunchOpsOfficialsPending;
  discovery: {
    engine_version: string;
    week_id: number;
    featured_channels: number;
    top_channel_id: string | null;
    top_guild_id: string | null;
    category_count: number;
  };
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
};

function apiBase(): string | null {
  const url = readIndexerUrl();

  if (!url) {
    return null;
  }

  return url.replace(/\/$/, '');
}

export async function fetchLaunchOpsSummary(): Promise<LaunchOpsSummary | null> {
  if (!isIndexerLive(readAppConfig())) {
    return null;
  }

  const baseUrl = apiBase();

  if (!baseUrl) {
    return null;
  }
  const response = await fetch(baseUrl + '/api/ops/launch-summary');

  if (!response.ok) {
    throw new Error('Launch ops summary request failed with HTTP ' + response.status);
  }

  return (await response.json()) as LaunchOpsSummary;
}