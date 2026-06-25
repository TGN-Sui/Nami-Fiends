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

export async function publishHubSuperBanner(
  input: PublishHubSuperBannerInput,
  now = Date.now(),
): Promise<HubSuperBannerCampaign> {
  const headline = input.headline.trim();
  const body = input.body.trim();

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
    coverUrl: input.coverUrl?.trim() ?? '',
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

