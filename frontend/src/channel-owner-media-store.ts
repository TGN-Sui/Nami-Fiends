import { useSyncExternalStore } from 'react';

const NEWS_BANNER_PREFIX = 'nami.channel.news-banner.';
const HERO_BACKGROUND_PREFIX = 'nami.channel.hero-background.';
const TRAILER_PREFIX = 'nami.channel.trailer.';

export const CHANNEL_TRAILER_ACCEPTED_TYPES = new Set(['video/mp4', 'video/webm']);
export const CHANNEL_TRAILER_ACCEPTED_LABEL = 'MP4 or WebM';
export const CHANNEL_TRAILER_MAX_BYTES = 24 * 1024 * 1024;

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

export function validateChannelTrailerFile(file: File): string | null {
  if (!CHANNEL_TRAILER_ACCEPTED_TYPES.has(file.type)) {
    return 'Use an MP4 or WebM video file.';
  }

  if (file.size > CHANNEL_TRAILER_MAX_BYTES) {
    return 'Trailer must be 24 MB or smaller.';
  }

  return null;
}

export function readChannelTrailerOverride(channelId: string): string | null {
  return readOverride(TRAILER_PREFIX, channelId);
}

export function saveChannelTrailerOverride(channelId: string, dataUrl: string): void {
  saveOverride(TRAILER_PREFIX, channelId, dataUrl);
}

export function clearChannelTrailerOverride(channelId: string): void {
  clearOverride(TRAILER_PREFIX, channelId);
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