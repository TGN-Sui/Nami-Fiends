import { describe, expect, it, vi } from 'vitest';

vi.mock('./app-config.js', () => ({
  readAppConfig: () => ({
    packageId: '0xabc',
    indexerUrl: 'https://example.test',
    testLaunch: true,
  }),
  isChainConfigured: () => true,
  isIndexerLive: () => true,
  isTestLaunchMode: () => true,
}));

vi.mock('./official-chat-overlay-rewards-store.js', () => ({
  readChatOverlayCatalogAttestation: () => null,
}));

import {
  buildHackathonReadinessChecks,
  HACKATHON_DEMO_STEPS,
  hackathonDemoReadyScore,
} from './hackathon-demo-readiness.js';
import type { LaunchOpsSummary } from './launch-ops-api.js';

function minimalSummary(overrides: Partial<LaunchOpsSummary> = {}): LaunchOpsSummary {
  return {
    generated_at_ms: Date.now(),
    network: 'testnet',
    test_launch: true,
    payment_allow_mock: false,
    package_id: '0xabc',
    official_owner_configured: true,
    payment_readiness: {
      treasury_configured: true,
      stripe_configured: false,
      paypal_configured: false,
      crypto_checkout_enabled: true,
      card_checkout_enabled: false,
      paypal_checkout_enabled: false,
    },
    seal_privacy: {
      enabled: false,
      key_configured: false,
      sealed_count: 0,
      policies_in_use: [],
      stack_note: 'disabled',
    },
    walrus_sites: {
      configured: false,
      site_object_id: null,
      network: 'testnet',
      storage_epochs: null,
      last_deploy_ms: null,
      last_renew_ms: null,
      renewal_due: false,
      expires_at_ms: null,
      epochs_remaining_approx: null,
      portal_note: 'Not deployed',
      ws_resources_present: true,
    },
    walrus_border_art: {
      configured: true,
      network: 'testnet',
      aggregator_url: 'https://aggregator.walrus-testnet.walrus.space',
      publisher_url: 'https://publisher.walrus-testnet.walrus.space',
      border_art_required: false,
      storage_epochs: 5,
      catalog_quilt_blob_id: null,
      catalog_version_ms: null,
      catalog_patch_count: 0,
      catalog_last_publish_ms: null,
      catalog_attestation_status: 'skipped',
      catalog_attestation_tx_digest: null,
    },
    exit_gates: {
      core_policy_ready: true,
      card_checkout_ready: false,
      crypto_checkout_ready: true,
      phase_8_launch_ready: false,
    },
    security_review: {
      backup_holder_configured: true,
      mock_payments_disabled: true,
      seal_key_configured: false,
      officials_sync_secret_server_only: true,
      security_script_last_run_ms: null,
      review_ready: true,
    },
    pending_actions: [],
    officials_pending: {
      suggestions: 0,
      game_tickets: 0,
      partner_banners: 0,
      nodename_claims: 0,
      total: 0,
    },
    discovery: {
      engine_version: 'v1',
      week_id: 1,
      featured_channels: 0,
      top_channel_id: null,
      top_guild_id: null,
      category_count: 0,
    },
    projections: {
      channels_public: 0,
      channels_verified: 0,
      guilds_public: 0,
      moderation_active: 0,
      boost_events: 0,
      appeals_open: 0,
      recovery_open: 0,
      jury_open: 0,
    },
    ...overrides,
  };
}

describe('hackathon demo readiness', () => {
  it('defines six judge-facing demo steps', () => {
    expect(HACKATHON_DEMO_STEPS).toHaveLength(6);
    expect(HACKATHON_DEMO_STEPS.some((step) => step.navTarget === 'owner-demo')).toBe(true);
  });

  it('treats deferred attestation as ready for hackathon', () => {
    const checks = buildHackathonReadinessChecks(minimalSummary());
    const attest = checks.find((check) => check.id === 'attest-off');

    expect(attest?.status).toBe('ready');
  });

  it('warns when catalog patch refs are missing', () => {
    const checks = buildHackathonReadinessChecks(
      minimalSummary({
        walrus_border_art: {
          ...minimalSummary().walrus_border_art,
          catalog_patch_count: 0,
        },
      })
    );
    const patches = checks.find((check) => check.id === 'catalog-patches');

    expect(patches?.status).toBe('warn');
  });

  it('scores readiness buckets', () => {
    const checks = buildHackathonReadinessChecks(minimalSummary());
    const score = hackathonDemoReadyScore(checks);

    expect(score.ready + score.warn + score.blocked).toBe(checks.length);
    expect(score.ready).toBeGreaterThan(0);
  });
});