import type { OwnerAssetMap } from './nami-owner-assets-store.js';
import { persistOwnerAssets } from './owner-assets-persistence.js';
import {
  fetchPlatformOwnerAssets,
  isPlatformOwnerAssetsApiAvailable,
  syncPlatformOwnerAssets,
} from './platform-owner-assets-api.js';

export type PlatformOwnerAssetsSyncError =
  | 'not_configured'
  | 'no_owner'
  | 'request_failed';

let lastSyncError: PlatformOwnerAssetsSyncError | null = null;

export function readLastPlatformOwnerAssetsSyncError(): PlatformOwnerAssetsSyncError | null {
  return lastSyncError;
}

export function platformOwnerAssetsSyncErrorMessage(error: PlatformOwnerAssetsSyncError): string {
  if (error === 'not_configured') {
    return 'Receiving server is not configured. Set VITE_NAMI_INDEXER_URL on your deploy.';
  }

  if (error === 'no_owner') {
    return 'Connect your official owner wallet or zkLogin session, then save again.';
  }

  return 'Could not sync artwork to the receiving server. Check your connection and try again.';
}

function readSyncedAssetMap(projection: { assets?: Record<string, string> }): OwnerAssetMap {
  return projection.assets ?? {};
}

export async function hydratePlatformOwnerAssetsFromServer(): Promise<boolean> {
  if (!isPlatformOwnerAssetsApiAvailable()) {
    return false;
  }

  try {
    const projection = await fetchPlatformOwnerAssets();
    const serverAssets = readSyncedAssetMap(projection);

    if (Object.keys(serverAssets).length === 0) {
      return false;
    }

    await persistOwnerAssets(serverAssets);
    return true;
  } catch {
    return false;
  }
}

export async function syncPlatformOwnerAssetsToServer(
  assets: OwnerAssetMap,
  owner: string | null
): Promise<{ ok: true } | { ok: false; error: PlatformOwnerAssetsSyncError }> {
  if (!isPlatformOwnerAssetsApiAvailable()) {
    return { ok: false, error: 'not_configured' };
  }

  if (!owner?.startsWith('0x')) {
    return { ok: false, error: 'no_owner' };
  }

  try {
    const projection = await syncPlatformOwnerAssets(assets, owner);
    await persistOwnerAssets(readSyncedAssetMap(projection));
    lastSyncError = null;
    return { ok: true };
  } catch {
    lastSyncError = 'request_failed';
    return { ok: false, error: 'request_failed' };
  }
}