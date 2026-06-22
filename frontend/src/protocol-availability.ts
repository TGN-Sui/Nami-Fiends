import { isChainConfigured, isIndexerLive, isTestLaunchMode, readAppConfig } from './app-config.js';
import type { ProtocolContext } from './protocol.js';
import type { ProtocolOwnerSource } from './wallet.js';

export type ProtocolConnectionBadge = 'Connected' | 'Online' | 'Preview' | 'Setup';

export type ProtocolConnectionState = {
  badge: ProtocolConnectionBadge;
  detail: string;
  isProtocolReady: boolean;
  usesFixtureFallback: boolean;
};

export function protocolConnectHint(): string {
  return 'Sign in from Settings to sync your passport, membership, and preferences.';
}

export function protocolChainHint(): string {
  return 'Configure VITE_NAMI_PACKAGE_ID to enable on-chain passport reads.';
}

export function protocolIndexerHint(): string {
  return 'Configure VITE_NAMI_INDEXER_URL to enable the receiving server and live projections.';
}

export function resolveProtocolConnectionState(
  context: ProtocolContext,
  owner: string | null,
  source: ProtocolOwnerSource
): ProtocolConnectionState {
  const config = readAppConfig();
  const chainReady = isChainConfigured(config) && context.chain !== null;
  const indexerReady = isIndexerLive(config) && context.indexer !== null;
  const usesFixtureFallback = config.devFixtures && !indexerReady;

  if (!chainReady) {
    return {
      badge: 'Setup',
      detail: protocolChainHint(),
      isProtocolReady: false,
      usesFixtureFallback,
    };
  }

  if (!owner) {
    return {
      badge: 'Setup',
      detail: protocolConnectHint(),
      isProtocolReady: false,
      usesFixtureFallback,
    };
  }

  if (source === 'demo' && !isTestLaunchMode(config)) {
    const detail = indexerReady
      ? 'Preview wallet active · activity feed connected'
      : 'Preview wallet active · fixture data until receiving server is live';

    return {
      badge: 'Preview',
      detail,
      isProtocolReady: chainReady,
      usesFixtureFallback,
    };
  }

  const ownerLabel = owner.slice(0, 10) + '…';

  if (indexerReady) {
    return {
      badge: 'Connected',
      detail: 'Profile sync active · account ' + ownerLabel + ' · activity feed connected',
      isProtocolReady: true,
      usesFixtureFallback: false,
    };
  }

  return {
    badge: 'Online',
    detail:
      'Profile sync active · account ' +
      ownerLabel +
      ' · fixture data until receiving server is live',
    isProtocolReady: chainReady,
    usesFixtureFallback,
  };
}