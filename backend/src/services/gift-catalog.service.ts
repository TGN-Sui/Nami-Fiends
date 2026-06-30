import { config } from '../config.js';
import { readJsonFile, writeJsonFile } from '../storage.js';

import { savePlatformOwnerAssetUpload } from './media-upload.service.js';

export type GiftTier = 'common' | 'rare' | 'legendary';

export type GiftCatalogEntry = {
  id: string;
  label: string;
  tier: GiftTier;
  emoji: string;
  iconUrl: string | null;
  priceUsd: number;
  goonAmount: number;
  animationClass: string;
  enabled: boolean;
};

export type GiftCatalogProjection = {
  entries: GiftCatalogEntry[];
  updatedAtMs: number;
};

const PROJECTION_PATH = `${config.dataDir}/projections/gift-catalog.json`;
const DATA_URL_PATTERN = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i;
const GOON_USD_RATE = 0.1;

export const DEFAULT_OFFICIAL_GIFT_CATALOG: GiftCatalogEntry[] = [
  {
    id: 'goon-pop',
    label: 'Goon Pop',
    tier: 'common',
    emoji: '🎈',
    iconUrl: null,
    priceUsd: 1,
    goonAmount: 10,
    animationClass: 'gift-burst-common',
    enabled: true,
  },
  {
    id: 'goon-clap',
    label: 'Goon Clap',
    tier: 'common',
    emoji: '👏',
    iconUrl: null,
    priceUsd: 2,
    goonAmount: 20,
    animationClass: 'gift-float-common',
    enabled: true,
  },
  {
    id: 'goon-heart',
    label: 'Goon Heart',
    tier: 'common',
    emoji: '💚',
    iconUrl: null,
    priceUsd: 3,
    goonAmount: 30,
    animationClass: 'gift-sparkle-common',
    enabled: true,
  },
  {
    id: 'goon-fire',
    label: 'Goon Fire',
    tier: 'rare',
    emoji: '🔥',
    iconUrl: null,
    priceUsd: 5,
    goonAmount: 50,
    animationClass: 'gift-burst-rare',
    enabled: true,
  },
  {
    id: 'goon-star',
    label: 'Goon Star',
    tier: 'rare',
    emoji: '⭐',
    iconUrl: null,
    priceUsd: 8,
    goonAmount: 80,
    animationClass: 'gift-float-rare',
    enabled: true,
  },
  {
    id: 'goon-crown',
    label: 'Goon Crown',
    tier: 'rare',
    emoji: '👑',
    iconUrl: null,
    priceUsd: 12,
    goonAmount: 120,
    animationClass: 'gift-sparkle-rare',
    enabled: true,
  },
  {
    id: 'goon-legend',
    label: 'Goon Legend',
    tier: 'legendary',
    emoji: '🏆',
    iconUrl: null,
    priceUsd: 25,
    goonAmount: 250,
    animationClass: 'gift-burst-legendary',
    enabled: true,
  },
  {
    id: 'goon-mega',
    label: 'Goon Mega',
    tier: 'legendary',
    emoji: '💎',
    iconUrl: null,
    priceUsd: 50,
    goonAmount: 500,
    animationClass: 'gift-sparkle-legendary',
    enabled: true,
  },
];

const DEFAULT_BY_ID = new Map(DEFAULT_OFFICIAL_GIFT_CATALOG.map((entry) => [entry.id, entry]));

function emptyProjection(): GiftCatalogProjection {
  return {
    entries: [],
    updatedAtMs: 0,
  };
}

function roundUsd(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function goonAmountToUsd(goonAmount: number): number {
  return roundUsd(goonAmount * GOON_USD_RATE);
}

function isGiftTier(value: unknown): value is GiftTier {
  return value === 'common' || value === 'rare' || value === 'legendary';
}

function safeGiftId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || !DEFAULT_BY_ID.has(trimmed)) {
    return null;
  }

  return trimmed;
}

function isPersistedIconUrl(value: string): boolean {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:image/') ||
    value.startsWith('channel-media://')
  );
}

async function readProjection(): Promise<GiftCatalogProjection> {
  const stored = await readJsonFile<GiftCatalogProjection>(PROJECTION_PATH, emptyProjection());

  return {
    entries: Array.isArray(stored.entries) ? stored.entries : [],
    updatedAtMs: typeof stored.updatedAtMs === 'number' ? stored.updatedAtMs : 0,
  };
}

async function writeProjection(projection: GiftCatalogProjection): Promise<void> {
  await writeJsonFile(PROJECTION_PATH, {
    entries: projection.entries,
    updatedAtMs: Date.now(),
  });
}

function mergeCatalogEntry(
  defaults: GiftCatalogEntry,
  override: Partial<GiftCatalogEntry> | undefined
): GiftCatalogEntry {
  if (!override) {
    return { ...defaults };
  }

  const goonAmount =
    typeof override.goonAmount === 'number' && override.goonAmount > 0
      ? Math.round(override.goonAmount)
      : defaults.goonAmount;

  const label =
    typeof override.label === 'string' && override.label.trim()
      ? override.label.trim().slice(0, 48)
      : defaults.label;

  const emoji =
    typeof override.emoji === 'string' && override.emoji.trim()
      ? override.emoji.trim().slice(0, 8)
      : defaults.emoji;

  const iconUrl =
    typeof override.iconUrl === 'string' && override.iconUrl.trim()
      ? override.iconUrl.trim()
      : override.iconUrl === null
        ? null
        : defaults.iconUrl;

  return {
    id: defaults.id,
    label,
    tier: defaults.tier,
    emoji,
    iconUrl: iconUrl && isPersistedIconUrl(iconUrl) ? iconUrl : iconUrl === null ? null : defaults.iconUrl,
    priceUsd: goonAmountToUsd(goonAmount),
    goonAmount,
    animationClass: defaults.animationClass,
    enabled: override.enabled === false ? false : true,
  };
}

export function mergeGiftCatalog(overrides: GiftCatalogEntry[]): GiftCatalogEntry[] {
  const overrideById = new Map(
    overrides
      .filter((entry) => DEFAULT_BY_ID.has(entry.id))
      .map((entry) => [entry.id, entry])
  );

  return DEFAULT_OFFICIAL_GIFT_CATALOG.map((defaults) =>
    mergeCatalogEntry(defaults, overrideById.get(defaults.id))
  ).filter((entry) => entry.enabled);
}

export async function getGiftCatalog(): Promise<GiftCatalogEntry[]> {
  const projection = await readProjection();
  return mergeGiftCatalog(projection.entries);
}

export function getGiftCatalogSync(): GiftCatalogEntry[] {
  return mergeGiftCatalog([]);
}

export async function findGiftCatalogEntry(giftId: string): Promise<GiftCatalogEntry | null> {
  const catalog = await getGiftCatalog();
  return catalog.find((entry) => entry.id === giftId) ?? null;
}

export function findGiftCatalogEntrySync(giftId: string): GiftCatalogEntry | null {
  return getGiftCatalogSync().find((entry) => entry.id === giftId) ?? null;
}

async function resolveIconUrl(
  owner: string,
  giftId: string,
  value: string | null | undefined
): Promise<string | null> {
  if (value === null || value === undefined || value.trim() === '') {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('channel-media://')) {
    return trimmed;
  }

  const match = trimmed.match(DATA_URL_PATTERN);

  if (!match?.[1] || !match?.[2]) {
    throw new Error('invalid_gift_icon');
  }

  const uploaded = await savePlatformOwnerAssetUpload({
    owner,
    slotId: 'gift-icon-' + giftId,
    contentType: match[1],
    dataBase64: match[2],
  });

  return uploaded.url;
}

export type GiftCatalogSyncInput = {
  owner: string;
  entries: Array<{
    id: string;
    label?: string;
    emoji?: string;
    goonAmount?: number;
    iconUrl?: string | null;
    enabled?: boolean;
  }>;
};

export async function syncGiftCatalog(input: GiftCatalogSyncInput): Promise<GiftCatalogProjection> {
  const resolvedEntries: GiftCatalogEntry[] = [];

  for (const draft of input.entries) {
    const giftId = safeGiftId(draft.id);

    if (!giftId) {
      continue;
    }

    const defaults = DEFAULT_BY_ID.get(giftId)!;
    const iconUrl = await resolveIconUrl(input.owner, giftId, draft.iconUrl);

    const goonAmount =
      typeof draft.goonAmount === 'number' && draft.goonAmount > 0
        ? Math.round(draft.goonAmount)
        : defaults.goonAmount;

    resolvedEntries.push({
      id: giftId,
      label:
        typeof draft.label === 'string' && draft.label.trim()
          ? draft.label.trim().slice(0, 48)
          : defaults.label,
      tier: defaults.tier,
      emoji:
        typeof draft.emoji === 'string' && draft.emoji.trim()
          ? draft.emoji.trim().slice(0, 8)
          : defaults.emoji,
      iconUrl,
      priceUsd: goonAmountToUsd(goonAmount),
      goonAmount,
      animationClass: defaults.animationClass,
      enabled: draft.enabled === false ? false : true,
    });
  }

  const projection: GiftCatalogProjection = {
    entries: resolvedEntries,
    updatedAtMs: Date.now(),
  };

  await writeProjection(projection);

  return {
    entries: mergeGiftCatalog(resolvedEntries),
    updatedAtMs: projection.updatedAtMs,
  };
}

export async function getGiftCatalogProjection(): Promise<GiftCatalogProjection> {
  const projection = await readProjection();

  return {
    entries: mergeGiftCatalog(projection.entries),
    updatedAtMs: projection.updatedAtMs,
  };
}