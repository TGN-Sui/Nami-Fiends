import { config } from '../config.js';
import { readJsonFile, writeJsonFile } from '../storage.js';

export type HubSuperBannerCampaign = {
  id: string;
  channelId: string;
  coverUrl: string;
  headline: string;
  body: string;
  sentAtMs: number;
  expiresAtMs: number;
};

type HubSuperBannerStore = {
  campaigns: HubSuperBannerCampaign[];
};

const STORE_PATH = `${config.dataDir}/projections/hub-super-banners.json`;
const DEFAULT_TTL_MS = 72 * 60 * 60 * 1000;
const MAX_HEADLINE_LENGTH = 120;
const MAX_BODY_LENGTH = 600;
const MAX_COVER_URL_LENGTH = 2048;

function emptyStore(): HubSuperBannerStore {
  return { campaigns: [] };
}

async function readStore(): Promise<HubSuperBannerStore> {
  return readJsonFile<HubSuperBannerStore>(STORE_PATH, emptyStore());
}

async function writeStore(store: HubSuperBannerStore): Promise<void> {
  await writeJsonFile(STORE_PATH, store);
}

export async function listActiveHubSuperBanners(now = Date.now()): Promise<HubSuperBannerCampaign[]> {
  const store = await readStore();

  return store.campaigns
    .filter((campaign) => campaign.expiresAtMs > now)
    .sort((left, right) => right.sentAtMs - left.sentAtMs);
}

export type PublishHubSuperBannerInput = {
  channelId: string;
  coverUrl?: string;
  headline: string;
  body: string;
  ttlMs?: number;
};

function normalizeCoverUrl(coverUrl?: string): string {
  const trimmed = coverUrl?.trim() ?? '';

  if (!trimmed) {
    return '';
  }

  if (trimmed.length > MAX_COVER_URL_LENGTH) {
    throw new Error('invalid_super_banner_cover');
  }

  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) {
    throw new Error('invalid_super_banner_cover');
  }

  return trimmed;
}

export async function publishHubSuperBanner(
  input: PublishHubSuperBannerInput,
  now = Date.now(),
): Promise<HubSuperBannerCampaign> {
  const headline = input.headline.trim().slice(0, MAX_HEADLINE_LENGTH);
  const body = input.body.trim().slice(0, MAX_BODY_LENGTH);
  const coverUrl = normalizeCoverUrl(input.coverUrl);

  if (!headline || !body) {
    throw new Error('invalid_super_banner_copy');
  }

  if (!input.channelId.trim()) {
    throw new Error('invalid_channel_id');
  }

  const ttlMs = input.ttlMs && input.ttlMs > 0 ? input.ttlMs : DEFAULT_TTL_MS;
  const campaign: HubSuperBannerCampaign = {
    id: 'hub-sb-' + input.channelId + '-' + now,
    channelId: input.channelId,
    coverUrl,
    headline,
    body,
    sentAtMs: now,
    expiresAtMs: now + ttlMs,
  };

  const store = await readStore();
  store.campaigns = [campaign, ...store.campaigns.filter((row) => row.channelId !== input.channelId)].slice(
    0,
    48,
  );
  await writeStore(store);

  return campaign;
}

