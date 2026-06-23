import { isIndexerLive, isTestLaunchMode, readAppConfig } from './app-config.js';
import { readIndexerUrl } from './protocol-env.js';
import { createWalletAuthPayload, readWalletAuthOwner } from './wallet-auth.js';

export type PlatformOwnerAssetsProjection = {
  assets: Record<string, string>;
  updatedAtMs: number;
};

function apiBase(): string | null {
  const url = readIndexerUrl();

  if (!url) {
    return null;
  }

  return url.replace(/\/$/, '');
}

/** Server-backed platform artwork — required on official testnet builds. */
export function isPlatformOwnerAssetsApiAvailable(): boolean {
  if (!isIndexerLive(readAppConfig())) {
    return false;
  }

  return isTestLaunchMode();
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = apiBase();

  if (!base) {
    throw new Error('Platform owner assets API is not configured. Set VITE_NAMI_INDEXER_URL.');
  }

  const response = await fetch(base + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error('Platform owner assets API request failed (' + response.status + ').');
  }

  return (await response.json()) as T;
}

export async function fetchPlatformOwnerAssets(): Promise<PlatformOwnerAssetsProjection> {
  const payload = await fetchJson<{ assets: PlatformOwnerAssetsProjection }>('/api/platform/owner-assets');
  return payload.assets;
}

export async function syncPlatformOwnerAssets(
  assets: Record<string, string>,
  ownerOverride?: string | null
): Promise<PlatformOwnerAssetsProjection> {
  const owner = ownerOverride ?? readWalletAuthOwner();

  if (!owner?.startsWith('0x')) {
    throw new Error('Platform owner assets sync requires a connected wallet or zkLogin session.');
  }

  const auth = await createWalletAuthPayload(owner);
  const payload = await fetchJson<{ assets: PlatformOwnerAssetsProjection }>(
    '/api/platform/owner-assets/sync',
    {
      method: 'POST',
      body: JSON.stringify({
        owner,
        assets,
        auth,
      }),
    }
  );

  return payload.assets;
}