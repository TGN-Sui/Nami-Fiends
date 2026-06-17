import { useSyncExternalStore } from 'react';

import { type NamiChannel } from './uiMockData.js';

const COVER_STORAGE_PREFIX = 'nami.channel.cover.';

function coverStorageKey(channelId: string): string {
  return COVER_STORAGE_PREFIX + channelId;
}

let coverVersion = 0;

function dispatchCoverChange(): void {
  coverVersion += 1;
  window.dispatchEvent(new CustomEvent('nami-channel-cover-changed'));
}

export function readChannelCoverOverride(channelId: string): string | null {
  try {
    const stored = window.localStorage.getItem(coverStorageKey(channelId));

    if (!stored || stored.trim() === '') {
      return null;
    }

    return stored;
  } catch {
    return null;
  }
}

export function saveChannelCoverOverride(channelId: string, dataUrl: string): void {
  window.localStorage.setItem(coverStorageKey(channelId), dataUrl);
  dispatchCoverChange();
}

export function clearChannelCoverOverride(channelId: string): void {
  window.localStorage.removeItem(coverStorageKey(channelId));
  dispatchCoverChange();
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

  return () => {
    window.removeEventListener('nami-channel-cover-changed', handleChange);
  };
}

function getCoverVersionSnapshot(): number {
  return coverVersion;
}

export function useChannelCoverVersion(): number {
  return useSyncExternalStore(subscribeChannelCovers, getCoverVersionSnapshot, () => 0);
}