import { useSyncExternalStore } from 'react';

import {
  CHANNEL_MEDIA_HYDRATED_EVENT,
  ensureChannelMediaHydratedForKey,
  migrateLegacyLocalStorageMedia,
  readChannelMediaPersistenceVersion,
  readChannelMediaUrl,
  saveChannelMediaValue,
  clearChannelMediaValue,
} from './channel-media-persistence.js';
import {
  isChannelPreferencesApiAvailable,
  syncChannelPreferencesToBackend,
} from './channel-preferences-api.js';
import { type NamiChannel } from './uiMockData.js';

const COVER_STORAGE_PREFIX = 'nami.channel.cover.';

function coverStorageKey(channelId: string): string {
  return COVER_STORAGE_PREFIX + channelId;
}

let coverVersion = 0;
let channelPreferencesSyncOwner: string | null = null;

export function setChannelPreferencesSyncOwner(owner: string | null): void {
  channelPreferencesSyncOwner = owner?.startsWith('0x') ? owner : null;
}

function pushChannelCoverToBackend(channelId: string, coverUrl: string | null): void {
  if (!channelPreferencesSyncOwner || !isChannelPreferencesApiAvailable()) {
    return;
  }

  void syncChannelPreferencesToBackend({
    owner: channelPreferencesSyncOwner,
    channelId,
    coverUrl,
  }).catch(() => {
    // Channel preference sync is best-effort during demo wiring.
  });
}

function dispatchCoverChange(): void {
  coverVersion += 1;
  window.dispatchEvent(new CustomEvent('nami-channel-cover-changed'));
}

export function readChannelCoverOverride(channelId: string): string | null {
  const key = coverStorageKey(channelId);
  void ensureChannelMediaHydratedForKey(key);
  const stored = readChannelMediaUrl(key);

  if (!stored || stored.trim() === '') {
    return null;
  }

  return stored;
}

export function hydrateChannelCoverOverride(channelId: string, coverUrl: string): void {
  const key = coverStorageKey(channelId);

  void saveChannelMediaValue(key, coverUrl).then(() => {
    dispatchCoverChange();
  });
}

export function saveChannelCoverOverride(channelId: string, coverUrl: string): void {
  const key = coverStorageKey(channelId);

  void (async () => {
    await migrateLegacyLocalStorageMedia(key);
    await saveChannelMediaValue(key, coverUrl);
    dispatchCoverChange();
    pushChannelCoverToBackend(channelId, coverUrl);
  })();
}

export function clearChannelCoverOverride(channelId: string): void {
  const key = coverStorageKey(channelId);

  void clearChannelMediaValue(key).then(() => {
    dispatchCoverChange();
    pushChannelCoverToBackend(channelId, null);
  });
}

export function resolveChannelCoverUrl(channel: NamiChannel): string | undefined {
  const override = readChannelCoverOverride(channel.id);

  if (override) {
    return override;
  }

  return channel.coverImageUrl;
}

export function withChannelCover(channel: NamiChannel): NamiChannel {
  const coverImageUrl = resolveChannelCoverUrl(channel);

  if (!coverImageUrl || coverImageUrl === channel.coverImageUrl) {
    return channel;
  }

  return {
    ...channel,
    coverImageUrl,
  };
}

function subscribeChannelCovers(onStoreChange: () => void): () => void {
  function handleChange(): void {
    onStoreChange();
  }

  window.addEventListener('nami-channel-cover-changed', handleChange);
  window.addEventListener(CHANNEL_MEDIA_HYDRATED_EVENT, handleChange);

  return () => {
    window.removeEventListener('nami-channel-cover-changed', handleChange);
    window.removeEventListener(CHANNEL_MEDIA_HYDRATED_EVENT, handleChange);
  };
}

function getCoverVersionSnapshot(): number {
  return coverVersion + readChannelMediaPersistenceVersion();
}

export function useChannelCoverVersion(): number {
  return useSyncExternalStore(subscribeChannelCovers, getCoverVersionSnapshot, () => 0);
}