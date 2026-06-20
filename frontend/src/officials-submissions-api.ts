import { isIndexerLive, isTestLaunchMode, readAppConfig } from './app-config.js';
import { readIndexerUrl } from './protocol-env.js';

export type OfficialsSubmissionsProjection = {
  suggestions: unknown[];
  gameTickets: unknown[];
  partnerBanners: unknown[];
  nodenameClaims: unknown[];
  updatedAtMs: number;
};

function apiBase(): string | null {
  const url = readIndexerUrl();

  if (!url) {
    return null;
  }

  return url.replace(/\/$/, '');
}

/** Server-backed officials queue — required on official testnet builds. */
export function isOfficialsSubmissionsApiAvailable(): boolean {
  if (!isIndexerLive(readAppConfig())) {
    return false;
  }

  return isTestLaunchMode();
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = apiBase();

  if (!base) {
    throw new Error('Officials submissions API is not configured. Set VITE_NAMI_INDEXER_URL.');
  }

  const response = await fetch(base + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error('Officials submissions API request failed (' + response.status + ').');
  }

  return (await response.json()) as T;
}

export async function fetchOfficialsSubmissions(): Promise<OfficialsSubmissionsProjection> {
  const payload = await fetchJson<{ submissions: OfficialsSubmissionsProjection }>(
    '/api/officials/submissions'
  );

  return payload.submissions;
}

export type SyncOfficialsSubmissionsInput = {
  suggestions?: unknown[];
  gameTickets?: unknown[];
  partnerBanners?: unknown[];
  nodenameClaims?: unknown[];
};

export async function syncOfficialsSubmissions(
  input: SyncOfficialsSubmissionsInput
): Promise<OfficialsSubmissionsProjection> {
  const payload = await fetchJson<{ submissions: OfficialsSubmissionsProjection }>(
    '/api/officials/submissions/sync',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );

  return payload.submissions;
}