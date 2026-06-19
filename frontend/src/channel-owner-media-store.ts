import { useSyncExternalStore } from 'react';

const NEWS_BANNER_PREFIX = 'nami.channel.news-banner.';
const HERO_BACKGROUND_PREFIX = 'nami.channel.hero-background.';

let mediaVersion = 0;

function storageKey(prefix: string, channelId: string): string {
  return prefix + channelId;
}

function dispatchMediaChange(): void {
  mediaVersion += 1;
  window.dispatchEvent(new CustomEvent('nami-channel-owner-media-changed'));
}

function readOverride(prefix: string, channelId: string): string | null {
  try {
    const stored = window.localStorage.getItem(storageKey(prefix, channelId));

    if (!stored || stored.trim() === '') {
      return null;
    }

    return stored;
  } catch {
    return null;
  }
}

function saveOverride(prefix: string, channelId: string, dataUrl: string): void {
  window.localStorage.setItem(storageKey(prefix, channelId), dataUrl);
  dispatchMediaChange();
}

function clearOverride(prefix: string, channelId: string): void {
  window.localStorage.removeItem(storageKey(prefix, channelId));
  dispatchMediaChange();
}

export function readChannelNewsBannerOverride(channelId: string): string | null {
  return readOverride(NEWS_BANNER_PREFIX, channelId);
}

export function saveChannelNewsBannerOverride(channelId: string, dataUrl: string): void {
  saveOverride(NEWS_BANNER_PREFIX, channelId, dataUrl);
}

export function clearChannelNewsBannerOverride(channelId: string): void {
  clearOverride(NEWS_BANNER_PREFIX, channelId);
}

export function readChannelHeroBackgroundOverride(channelId: string): string | null {
  return readOverride(HERO_BACKGROUND_PREFIX, channelId);
}

export function saveChannelHeroBackgroundOverride(channelId: string, dataUrl: string): void {
  saveOverride(HERO_BACKGROUND_PREFIX, channelId, dataUrl);
}

export function clearChannelHeroBackgroundOverride(channelId: string): void {
  clearOverride(HERO_BACKGROUND_PREFIX, channelId);
}

function subscribeOwnerMedia(listener: () => void): () => void {
  function onChange(): void {
    listener();
  }

  window.addEventListener('nami-channel-owner-media-changed', onChange);

  return () => {
    window.removeEventListener('nami-channel-owner-media-changed', onChange);
  };
}

function readOwnerMediaVersion(): number {
  return mediaVersion;
}

export function useChannelOwnerMediaVersion(): number {
  return useSyncExternalStore(subscribeOwnerMedia, readOwnerMediaVersion, () => 0);
}