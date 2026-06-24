import type { OwnerAssetMap } from './nami-owner-assets-store.js';
import { prepareOwnerAssetsForServerSync } from './owner-asset-sync-prep.js';
import { persistOwnerAssets } from './owner-assets-persistence.js';
import {
  fetchPlatformOwnerAssets,
  isPlatformOwnerAssetsApiAvailable,
  PlatformOwnerAssetsApiError,
  type PlatformOwnerAssetsApiErrorCode,
  syncPlatformOwnerAssets,
} from './platform-owner-assets-api.js';

export type PlatformOwnerAssetsSyncError = PlatformOwnerAssetsApiErrorCode | 'no_owner';

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

  if (error === 'wallet_auth_unavailable') {
    return 'Reconnect zkLogin or your official owner wallet to authorize artwork uploads, then save again.';
  }

  if (error === 'wallet_auth_required' || error === 'wallet_auth_invalid') {
    return 'Wallet signature was rejected. Reconnect zkLogin or your wallet extension, then save again.';
  }

  if (error === 'official_owner_required') {
    return 'This deploy only accepts artwork from the configured official owner wallet.';
  }

  if (error === 'invalid_file_size') {
    return 'One of the artwork files is too large for the receiving server. Upload a smaller image or video.';
  }

  if (error === 'channel_media_not_hydrated' || error === 'invalid_asset_value') {
    return 'One of the artwork slots still points at local-only media. Re-upload that slot, then save again.';
  }

  return 'Could not sync artwork to the receiving server. Check your connection and try again.';
}

function readSyncedAssetMap(projection: { assets?: Record<string, string> }): OwnerAssetMap {
  return projection.assets ?? {};
}

function mapSyncError(error: unknown): PlatformOwnerAssetsSyncError {
  if (error instanceof PlatformOwnerAssetsApiError) {
    return error.code;
  }

  if (error instanceof Error) {
    if (error.message.startsWith('channel_media_not_hydrated')) {
      return 'channel_media_not_hydrated';
    }

    if (error.message.startsWith('scene_asset_too_large')) {
      return 'invalid_file_size';
    }

    if (error.message.startsWith('asset_too_large')) {
      return 'invalid_file_size';
    }
  }

  return 'request_failed';
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
    lastSyncError = 'not_configured';
    return { ok: false, error: 'not_configured' };
  }

  if (!owner?.startsWith('0x')) {
    lastSyncError = 'no_owner';
    return { ok: false, error: 'no_owner' };
  }

  try {
    const preparedAssets = await prepareOwnerAssetsForServerSync(assets);
    const projection = await syncPlatformOwnerAssets(preparedAssets, owner);
    await persistOwnerAssets(readSyncedAssetMap(projection));
    lastSyncError = null;
    return { ok: true };
  } catch (error) {
    lastSyncError = mapSyncError(error);
    return { ok: false, error: lastSyncError };
  }
}