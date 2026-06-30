import { config } from '../config.js';
import { readJsonFile, writeJsonFile } from '../storage.js';
import { assertChannelOwnerWallet } from './channel-ownership.service.js';

type ChannelRegistryLike = {
  channels: {
    getChannel(channelId: string): { owner: string } | undefined;
  };
};

const ENTITLEMENTS_PATH = `${config.dataDir}/projections/hub-super-banner-entitlements.json`;
const SUPER_BANNER_DAILY_LIMIT = 2;
const DEFAULT_ENTITLEMENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type SuperBannerEntitlement = {
  channelId: string;
  owner: string;
  status: 'active' | 'inactive';
  activatedAtMs: number;
  expiresAtMs: number;
  sendsToday: number;
  sendWindowKey: string;
};

type EntitlementStore = {
  byChannel: Record<string, SuperBannerEntitlement>;
};

function emptyStore(): EntitlementStore {
  return { byChannel: {} };
}

async function readStore(): Promise<EntitlementStore> {
  return readJsonFile<EntitlementStore>(ENTITLEMENTS_PATH, emptyStore());
}

async function writeStore(store: EntitlementStore): Promise<void> {
  await writeJsonFile(ENTITLEMENTS_PATH, store);
}

/** Daily super-banner quota resets at 12:00 PM US Central. */
export function currentSuperBannerWindowKey(now = Date.now()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date(now));

  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '1');
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '1');
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');

  if (hour < 12) {
    const prior = new Date(Date.UTC(year, month - 1, day));
    prior.setUTCDate(prior.getUTCDate() - 1);

    return (
      prior.getUTCFullYear() +
      '-' +
      String(prior.getUTCMonth() + 1).padStart(2, '0') +
      '-' +
      String(prior.getUTCDate()).padStart(2, '0')
    );
  }

  return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

function normalizeEntitlementWindow(
  entitlement: SuperBannerEntitlement,
  now = Date.now(),
): SuperBannerEntitlement {
  const windowKey = currentSuperBannerWindowKey(now);

  if (entitlement.sendWindowKey === windowKey) {
    return entitlement;
  }

  return {
    ...entitlement,
    sendWindowKey: windowKey,
    sendsToday: 0,
  };
}

export async function getSuperBannerEntitlement(
  channelId: string,
): Promise<SuperBannerEntitlement | null> {
  const store = await readStore();
  const row = store.byChannel[channelId.trim()];

  if (!row) {
    return null;
  }

  return normalizeEntitlementWindow(row);
}

export async function activateSuperBannerEntitlement(input: {
  registry?: ChannelRegistryLike | null;
  channelId: string;
  owner: string;
  ttlMs?: number;
  now?: number;
}): Promise<SuperBannerEntitlement> {
  const channelId = input.channelId.trim();
  const owner = input.owner.trim().toLowerCase();
  const now = input.now ?? Date.now();
  const ttlMs = input.ttlMs && input.ttlMs > 0 ? input.ttlMs : DEFAULT_ENTITLEMENT_TTL_MS;

  await assertChannelOwnerWallet(channelId, owner, input.registry ?? null);

  const store = await readStore();
  const windowKey = currentSuperBannerWindowKey(now);
  const existing = store.byChannel[channelId];
  const normalized = existing ? normalizeEntitlementWindow(existing, now) : null;

  const entitlement: SuperBannerEntitlement = {
    channelId,
    owner,
    status: 'active',
    activatedAtMs: now,
    expiresAtMs: now + ttlMs,
    sendsToday: normalized?.sendsToday ?? 0,
    sendWindowKey: windowKey,
  };

  store.byChannel[channelId] = entitlement;
  await writeStore(store);

  return entitlement;
}

export async function assertCanPublishSuperBanner(input: {
  registry?: ChannelRegistryLike | null;
  channelId: string;
  owner: string;
  now?: number;
}): Promise<SuperBannerEntitlement> {
  const channelId = input.channelId.trim();
  const owner = input.owner.trim().toLowerCase();
  const now = input.now ?? Date.now();

  await assertChannelOwnerWallet(channelId, owner, input.registry ?? null);

  const store = await readStore();
  const row = store.byChannel[channelId];

  if (!row || row.status !== 'active') {
    throw new Error('super_banner_not_entitled');
  }

  if (row.expiresAtMs <= now) {
    throw new Error('super_banner_entitlement_expired');
  }

  if (row.owner.toLowerCase() !== owner) {
    throw new Error('not_channel_owner');
  }

  const entitlement = normalizeEntitlementWindow(row, now);

  if (entitlement.sendsToday >= SUPER_BANNER_DAILY_LIMIT) {
    throw new Error('super_banner_daily_limit');
  }

  return entitlement;
}

export async function recordSuperBannerSend(channelId: string, now = Date.now()): Promise<void> {
  const store = await readStore();
  const row = store.byChannel[channelId.trim()];

  if (!row) {
    return;
  }

  const entitlement = normalizeEntitlementWindow(row, now);
  entitlement.sendsToday += 1;

  store.byChannel[channelId.trim()] = entitlement;
  await writeStore(store);
}

export const superBannerDailyLimit = SUPER_BANNER_DAILY_LIMIT;