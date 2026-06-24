import { readJsonFile, writeJsonFile } from '../storage.js';

import { savePlatformOwnerAssetUpload } from './media-upload.service.js';

export type PlatformOwnerAssetsProjection = {
  assets: Record<string, string>;
  updatedAtMs: number;
};

const PROJECTION_PATH = 'data/projections/platform-owner-assets.json';

const DATA_URL_PATTERN = /^data:((?:image|video)\/[a-z0-9.+-]+);base64,(.+)$/i;
const SCENE_SLOT_IDS = new Set(['arcade-background', 'arcade-stage-background']);
const MAX_SCENE_ASSET_BYTES = 48 * 1024 * 1024;

function emptyProjection(): PlatformOwnerAssetsProjection {
  return {
    assets: {},
    updatedAtMs: Date.now(),
  };
}

function safeSlotId(slotId: string): string | null {
  const trimmed = slotId.trim();

  if (!trimmed || trimmed !== slotId.replace(/[^a-zA-Z0-9._-]/g, '')) {
    return null;
  }

  return trimmed;
}

function isPersistedAssetValue(value: string): boolean {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:image/') ||
    value.startsWith('channel-media://')
  );
}

function sanitizeAssets(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([slotId, assetValue]) => {
      if (typeof assetValue !== 'string' || !isPersistedAssetValue(assetValue)) {
        return [];
      }

      const safeId = safeSlotId(slotId);

      return safeId ? [[safeId, assetValue]] : [];
    })
  );
}

async function readProjection(): Promise<PlatformOwnerAssetsProjection> {
  const stored = await readJsonFile<PlatformOwnerAssetsProjection>(PROJECTION_PATH, emptyProjection());

  return {
    assets: sanitizeAssets(stored.assets),
    updatedAtMs: typeof stored.updatedAtMs === 'number' ? stored.updatedAtMs : Date.now(),
  };
}

async function writeProjection(projection: PlatformOwnerAssetsProjection): Promise<void> {
  await writeJsonFile(PROJECTION_PATH, {
    assets: projection.assets,
    updatedAtMs: Date.now(),
  });
}

export async function getPlatformOwnerAssets(): Promise<PlatformOwnerAssetsProjection> {
  return readProjection();
}

async function resolveAssetValue(
  owner: string,
  slotId: string,
  value: string
): Promise<string> {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('channel-media://')) {
    throw new Error('invalid_asset_value');
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const match = trimmed.match(DATA_URL_PATTERN);
  const contentType = match?.[1];
  const dataBase64 = match?.[2];

  if (!contentType || !dataBase64) {
    throw new Error('invalid_asset_value');
  }

  const uploadInput = {
    owner,
    slotId,
    contentType,
    dataBase64,
  };

  const uploaded = await savePlatformOwnerAssetUpload(
    SCENE_SLOT_IDS.has(slotId)
      ? { ...uploadInput, maxBytes: MAX_SCENE_ASSET_BYTES }
      : uploadInput
  );

  return uploaded.url;
}

export async function syncPlatformOwnerAssets(input: {
  owner: string;
  assets: Record<string, string>;
}): Promise<PlatformOwnerAssetsProjection> {
  const existing = await readProjection();
  const resolvedAssets: Record<string, string> = { ...existing.assets };

  for (const [slotId, value] of Object.entries(input.assets)) {
    const safeId = safeSlotId(slotId);

    if (!safeId || typeof value !== 'string') {
      continue;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      delete resolvedAssets[safeId];
      continue;
    }

    resolvedAssets[safeId] = await resolveAssetValue(input.owner, safeId, trimmed);
  }

  const projection: PlatformOwnerAssetsProjection = {
    assets: resolvedAssets,
    updatedAtMs: Date.now(),
  };

  await writeProjection(projection);
  return projection;
}