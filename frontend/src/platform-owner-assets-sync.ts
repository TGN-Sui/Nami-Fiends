import type { OwnerAssetMap } from './nami-owner-assets-store.js';
import { persistOwnerAssets } from './owner-assets-persistence.js';
import {
  fetchPlatformOwnerAssets,
  isPlatformOwnerAssetsApiAvailable,
  syncPlatformOwnerAssets,
} from './platform-owner-assets-api.js';

export async function hydratePlatformOwnerAssetsFromServer(): Promise<boolean> {
  if (!isPlatformOwnerAssetsApiAvailable()) {
    return false;
  }

  try {
    const projection = await fetchPlatformOwnerAssets();
    const serverAssets = projection.assets ?? {};

    if (Object.keys(serverAssets).length === 0) {
      return false;
    }

    await persistOwnerAssets(serverAssets);
    return true;
  } catch {
    return false;
  }
}

export async function syncPlatformOwnerAssetsToServer(assets: OwnerAssetMap): Promise<boolean> {
  if (!isPlatformOwnerAssetsApiAvailable()) {
    return false;
  }

  try {
    const projection = await syncPlatformOwnerAssets(assets);
    await persistOwnerAssets(projection.assets ?? assets);
    return true;
  } catch {
    return false;
  }
}