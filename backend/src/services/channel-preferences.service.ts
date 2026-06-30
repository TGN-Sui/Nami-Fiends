import { config } from '../config.js';
import { readJsonFile, writeJsonFile } from '../storage.js';
import { assertChannelOwnerWallet } from './channel-ownership.service.js';

export type ChannelPreferences = {
  channelId: string;
  owner: string;
  coverUrl: string | null;
  updatedAtMs: number;
};

type ChannelPreferencesStore = {
  channels: ChannelPreferences[];
};

const CHANNEL_PREFERENCES_PATH = `${config.dataDir}/projections/channel-preferences.json`;

function emptyStore(): ChannelPreferencesStore {
  return { channels: [] };
}

async function readStore(): Promise<ChannelPreferencesStore> {
  return readJsonFile<ChannelPreferencesStore>(CHANNEL_PREFERENCES_PATH, emptyStore());
}

async function writeStore(store: ChannelPreferencesStore): Promise<void> {
  await writeJsonFile(CHANNEL_PREFERENCES_PATH, store);
}

function normalizeOwner(owner: string): string {
  return owner.trim().toLowerCase();
}

export async function getChannelPreferences(channelId: string): Promise<ChannelPreferences | null> {
  const store = await readStore();

  return store.channels.find((row) => row.channelId === channelId) ?? null;
}

export type UpsertChannelPreferencesInput = {
  channelId: string;
  owner: string;
  coverUrl?: string | null;
};

export async function upsertChannelPreferences(
  input: UpsertChannelPreferencesInput
): Promise<ChannelPreferences> {
  if (!input.owner.startsWith('0x') || !input.channelId.trim()) {
    throw new Error('invalid_payload');
  }

  await assertChannelOwnerWallet(input.channelId, input.owner);

  const owner = normalizeOwner(input.owner);
  const store = await readStore();
  const index = store.channels.findIndex((row) => row.channelId === input.channelId);
  const existing =
    index >= 0
      ? store.channels[index]!
      : {
          channelId: input.channelId,
          owner,
          coverUrl: null,
          updatedAtMs: Date.now(),
        };

  const next: ChannelPreferences = {
    ...existing,
    owner,
    coverUrl:
      input.coverUrl === undefined
        ? existing.coverUrl
        : input.coverUrl && input.coverUrl.trim()
          ? input.coverUrl.trim()
          : null,
    updatedAtMs: Date.now(),
  };

  if (index >= 0) {
    store.channels[index] = next;
  } else {
    store.channels.unshift(next);
  }

  await writeStore(store);
  return next;
}