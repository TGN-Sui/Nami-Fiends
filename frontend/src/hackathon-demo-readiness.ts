import { isChainConfigured, isIndexerLive, isTestLaunchMode, readAppConfig } from './app-config.js';
import type { LaunchOpsSummary } from './launch-ops-api.js';
import { readChatOverlayCatalogAttestation } from './official-chat-overlay-rewards-store.js';

export type HackathonDemoStep = {
  id: string;
  title: string;
  detail: string;
  navTarget?: 'hub' | 'appearance' | 'owner-demo' | 'owner-border-art' | 'owner-data' | 'membership';
};

export type HackathonReadinessCheck = {
  id: string;
  label: string;
  status: 'ready' | 'warn' | 'blocked';
  detail: string;
};

export const HACKATHON_DEMO_STEPS: HackathonDemoStep[] = [
  {
    id: 'identity',
    title: 'Portable identity',
    detail:
      'Enter Nami with Google zkLogin, or use Settings → Membership → Dashboard Perspectives (Pro / Elite) to preview member tiers without wallet friction.',
    navTarget: 'membership',
  },
  {
    id: 'hub',
    title: 'Genre lounges & discovery',
    detail:
      'Open the Hub, browse genre bubbles, and open a game channel profile — Nami is a protocol surface, not a single chat room.',
    navTarget: 'hub',
  },
  {
    id: 'chat-borders',
    title: 'Chat border cosmetics',
    detail:
      'Settings → Look & feel → equip a border. Presets render with CSS classes; Walrus-backed art appears when catalog patch refs are live.',
    navTarget: 'appearance',
  },
  {
    id: 'owner-walrus',
    title: 'Border Art on Walrus (BA-14)',
    detail:
      'Official owner → Hackathon demo / Border Art studio. Quilt publish stores bytes on Walrus; the receiving server only coordinates catalog JSON.',
    navTarget: 'owner-border-art',
  },
  {
    id: 'protocol-reads',
    title: 'Indexed protocol data',
    detail:
      'Owner console → Indexed data shows discovery rankings, channels, guilds, and safety projections synced from your submitted Move package.',
    navTarget: 'owner-data',
  },
  {
    id: 'frozen-package',
    title: 'Frozen package (hackathon)',
    detail:
      'On-chain catalog attestation stays off until post-hackathon upgrade. Judges should treat Walrus + projection as the media source of truth.',
    navTarget: 'owner-demo',
  },
];

export function buildHackathonReadinessChecks(
  summary: LaunchOpsSummary | null
): HackathonReadinessCheck[] {
  const config = readAppConfig();
  const attestation = readChatOverlayCatalogAttestation();
  const checks: HackathonReadinessCheck[] = [];

  checks.push({
    id: 'chain',
    label: 'Sui package wired',
    status: isChainConfigured(config) ? 'ready' : 'blocked',
    detail: isChainConfigured(config)
      ? 'Frontend reads the submitted testnet package.'
      : 'Set VITE_NAMI_PACKAGE_ID on the deploy build.',
  });

  checks.push({
    id: 'indexer',
    label: 'Receiving server',
    status: isIndexerLive(config) ? 'ready' : 'blocked',
    detail: isIndexerLive(config)
      ? 'Live projections and launch summary reachable.'
      : 'Set VITE_NAMI_INDEXER_URL to your Render backend.',
  });

  checks.push({
    id: 'test-launch',
    label: 'Test-launch policy',
    status:
      isTestLaunchMode(config) && summary?.test_launch
        ? 'ready'
        : isTestLaunchMode(config)
          ? 'warn'
          : 'warn',
    detail:
      summary?.exit_gates.core_policy_ready === true
        ? 'Demo owner policy and mock payments are locked down.'
        : 'Confirm VITE_NAMI_TEST_LAUNCH=true and official owner env on Vercel.',
  });

  checks.push({
    id: 'walrus-sites',
    label: 'Walrus Sites SPA (Phase 9.1)',
    status: summary?.walrus_sites?.configured ? 'ready' : 'warn',
    detail: summary?.walrus_sites?.configured
      ? 'Static host on Walrus Sites — object ' +
        (summary.walrus_sites.site_object_id?.slice(0, 12) ?? '') +
        '…'
      : 'Vercel still hosts the SPA — run scripts/deploy-walrus-sites.mjs when site-builder is ready.',
  });

  checks.push({
    id: 'walrus',
    label: 'Walrus border art',
    status: summary?.walrus_border_art.configured ? 'ready' : 'warn',
    detail: summary?.walrus_border_art.configured
      ? 'Quilt publisher + aggregator configured on Render (' +
        (summary.walrus_border_art.network ?? 'custom') +
        ').'
      : 'Set NAMI_WALRUS_NETWORK=testnet on Render for full BA-14 demo.',
  });

  const patchCount = summary?.walrus_border_art.catalog_patch_count ?? attestation?.patchCount ?? 0;

  checks.push({
    id: 'catalog-patches',
    label: 'Catalog Walrus refs',
    status: patchCount > 0 ? 'ready' : 'warn',
    detail:
      patchCount > 0
        ? String(patchCount) + ' patch ref(s) in the live catalog projection.'
        : 'CSS border presets still demo fine — run local Walrus smoke or owner publish when zkLogin is ready.',
  });

  checks.push({
    id: 'attest-off',
    label: 'On-chain attestation deferred',
    status:
      summary?.walrus_border_art.catalog_attestation_status === 'on-chain'
        ? 'ready'
        : summary?.walrus_border_art.catalog_attestation_status === 'skipped' ||
            !summary?.walrus_border_art.catalog_attestation_status
          ? 'ready'
          : 'warn',
    detail:
      'NAMI_CATALOG_ATTEST_ENABLED=false preserves the frozen hackathon package. Enable after Move upgrade.',
  });

  return checks;
}

export function hackathonDemoReadyScore(checks: HackathonReadinessCheck[]): {
  ready: number;
  warn: number;
  blocked: number;
} {
  return checks.reduce(
    (score, check) => {
      score[check.status] += 1;
      return score;
    },
    { ready: 0, warn: 0, blocked: 0 }
  );
}