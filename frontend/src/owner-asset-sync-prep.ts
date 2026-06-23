import {
  CHANNEL_MEDIA_REF_PREFIX,
  resolveChannelMediaRef,
} from './channel-owner-media-store.js';
import {
  ensureChannelMediaHydratedForKey,
  readChannelMediaDataUrl,
} from './channel-media-persistence.js';
import type { OwnerAssetMap } from './nami-owner-assets-store.js';

async function externalizeChannelMediaRef(value: string): Promise<string> {
  const key = value.slice(CHANNEL_MEDIA_REF_PREFIX.length);

  if (!key) {
    throw new Error('invalid_channel_media_ref');
  }

  await ensureChannelMediaHydratedForKey(key);

  const dataUrl = await readChannelMediaDataUrl(key);

  if (dataUrl) {
    return dataUrl;
  }

  const resolvedUrl = resolveChannelMediaRef(value);

  if (resolvedUrl.startsWith('blob:') || resolvedUrl.startsWith('data:')) {
    return resolvedUrl;
  }

  throw new Error('channel_media_not_hydrated');
}

export async function externalizeOwnerAssetValue(value: string): Promise<string> {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith(CHANNEL_MEDIA_REF_PREFIX)) {
    return externalizeChannelMediaRef(trimmed);
  }

  return trimmed;
}

export async function prepareOwnerAssetsForServerSync(assets: OwnerAssetMap): Promise<OwnerAssetMap> {
  const entries = await Promise.all(
    Object.entries(assets).map(async ([slotId, value]) => {
      try {
        return [slotId, await externalizeOwnerAssetValue(value)] as const;
      } catch {
        return [slotId, value] as const;
      }
    })
  );

  return Object.fromEntries(entries.filter(([, assetValue]) => assetValue.trim() !== ''));
}