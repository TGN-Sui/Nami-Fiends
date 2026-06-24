import {
  CHANNEL_MEDIA_REF_PREFIX,
  resolveChannelMediaRef,
} from './channel-owner-media-store.js';
import {
  ensureChannelMediaHydratedForKey,
  readChannelMediaDataUrl,
} from './channel-media-persistence.js';
import type { OwnerAssetMap } from './nami-owner-assets-store.js';

const SCENE_SLOT_IDS = new Set(['arcade-background', 'arcade-stage-background']);
const MAX_SYNC_ASSET_BYTES = 6 * 1024 * 1024;

function estimateDataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',');

  if (commaIndex < 0) {
    return dataUrl.length;
  }

  const base64 = dataUrl.slice(commaIndex + 1);
  return Math.ceil(base64.length * 0.75);
}

function assertSyncableAssetValue(slotId: string, value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (
    trimmed.startsWith(CHANNEL_MEDIA_REF_PREFIX) ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('channel-media://')
  ) {
    throw new Error('channel_media_not_hydrated:' + slotId);
  }

  if (trimmed.startsWith('data:') && estimateDataUrlBytes(trimmed) > MAX_SYNC_ASSET_BYTES) {
    if (SCENE_SLOT_IDS.has(slotId)) {
      throw new Error('scene_asset_too_large:' + slotId);
    }

    throw new Error('asset_too_large:' + slotId);
  }

  return trimmed;
}

async function externalizeChannelMediaRef(slotId: string, value: string): Promise<string> {
  const key = value.slice(CHANNEL_MEDIA_REF_PREFIX.length);

  if (!key) {
    throw new Error('invalid_channel_media_ref:' + slotId);
  }

  await ensureChannelMediaHydratedForKey(key);

  const dataUrl = await readChannelMediaDataUrl(key);

  if (dataUrl) {
    return assertSyncableAssetValue(slotId, dataUrl);
  }

  const resolvedUrl = resolveChannelMediaRef(value);

  if (resolvedUrl.startsWith('blob:') || resolvedUrl.startsWith('data:')) {
    return assertSyncableAssetValue(slotId, resolvedUrl);
  }

  throw new Error('channel_media_not_hydrated:' + slotId);
}

export async function externalizeOwnerAssetValue(slotId: string, value: string): Promise<string> {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith(CHANNEL_MEDIA_REF_PREFIX)) {
    return externalizeChannelMediaRef(slotId, trimmed);
  }

  return assertSyncableAssetValue(slotId, trimmed);
}

export async function prepareOwnerAssetsForServerSync(assets: OwnerAssetMap): Promise<OwnerAssetMap> {
  const entries = await Promise.all(
    Object.entries(assets).map(async ([slotId, value]) => {
      return [slotId, await externalizeOwnerAssetValue(slotId, value)] as const;
    })
  );

  return Object.fromEntries(entries.filter(([, assetValue]) => assetValue.trim() !== ''));
}