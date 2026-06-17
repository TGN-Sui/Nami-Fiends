import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import {
  fetchGuildCards,
  fetchOwnerHistory,
  fetchPassportView,
  fetchSquadCards,
  type ProtocolContext,
} from './protocol.js';
import { useProtocolOwner, type ProtocolOwnerSource } from './wallet.js';

export type ProtocolLoadState = 'idle' | 'loading' | 'ready' | 'error';

export function protocolConnectHint(): string {
  return 'Connect a wallet, zkLogin, or set VITE_NAMI_DEMO_OWNER to load protocol data.';
}

export function protocolChainHint(): string {
  return 'Configure VITE_NAMI_PACKAGE_ID to load on-chain protocol reads.';
}

export function protocolIndexerHint(): string {
  return 'Configure VITE_NAMI_INDEXER_URL to load indexed protocol projections.';
}

interface ProtocolQueryOptions {
  requiresChain?: boolean;
  requiresIndexer?: boolean;
  requiresOwner?: boolean;
  staleTimeMs?: number;
}

function resolveLoadState(
  enabled: boolean,
  isLoading: boolean,
  isError: boolean
): ProtocolLoadState {
  if (!enabled) {
    return 'ready';
  }

  if (isLoading) {
    return 'loading';
  }

  if (isError) {
    return 'error';
  }

  return 'ready';
}

function isQueryEnabled(
  context: ProtocolContext,
  owner: string | null,
  options: ProtocolQueryOptions
): boolean {
  if (options.requiresChain !== false && context.chain === null) {
    return false;
  }

  if (options.requiresIndexer && context.indexer === null) {
    return false;
  }

  if (options.requiresOwner !== false && owner === null) {
    return false;
  }

  return true;
}

/**
 * Owner-scoped protocol read with React Query deduplication.
 * Query key: ['protocol', owner, resource]
 */
export function useProtocolQuery<T>(
  resource: string,
  queryFn: (context: ProtocolContext, owner: string) => Promise<T>,
  options: ProtocolQueryOptions = {}
): {
  data: T | undefined;
  loadState: ProtocolLoadState;
  owner: string | null;
  source: ProtocolOwnerSource;
  context: ProtocolContext;
} {
  const { owner, source, context } = useProtocolOwner();
  const enabled = isQueryEnabled(context, owner, options);

  const query = useQuery({
    queryKey: ['protocol', owner, resource],
    queryFn: () => queryFn(context, owner!),
    enabled,
    staleTime: options.staleTimeMs ?? 30_000,
  });

  const loadState = resolveLoadState(enabled, query.isLoading, query.isError);

  return {
    data: query.data,
    loadState,
    owner,
    source,
    context,
  };
}

/**
 * Indexer/global protocol read (no owner). Query key: ['protocol', 'global', resource]
 */
export function useProtocolIndexerQuery<T>(
  resource: string,
  queryFn: (context: ProtocolContext) => Promise<T>,
  options: { staleTimeMs?: number } = {}
): {
  data: T | undefined;
  loadState: ProtocolLoadState;
  context: ProtocolContext;
} {
  const { context } = useProtocolOwner();
  const enabled = context.indexer !== null;

  const query = useQuery({
    queryKey: ['protocol', 'global', resource],
    queryFn: () => queryFn(context),
    enabled,
    staleTime: options.staleTimeMs ?? 30_000,
  });

  return {
    data: query.data,
    loadState: resolveLoadState(enabled, query.isLoading, query.isError),
    context,
  };
}

export function ProtocolQueryStatus(props: {
  loadState: ProtocolLoadState;
  loadingMessage?: string;
  errorMessage?: string;
}): ReactElement | null {
  if (props.loadState === 'loading') {
    return <p className="protocol-hint">{props.loadingMessage ?? 'Loading…'}</p>;
  }

  if (props.loadState === 'error') {
    return <p className="protocol-hint">{props.errorMessage ?? 'Could not load protocol data.'}</p>;
  }

  return null;
}

export function useOwnerHistoryQuery() {
  return useProtocolQuery('owner-history', fetchOwnerHistory, { requiresIndexer: true });
}

export function usePassportQuery() {
  return useProtocolQuery('passport', fetchPassportView, { requiresChain: true });
}

export function useGuildCardsQuery() {
  return useProtocolQuery('guilds', fetchGuildCards, { requiresIndexer: true });
}

export function useSquadCardsQuery() {
  return useProtocolQuery('squads', fetchSquadCards, { requiresChain: true });
}