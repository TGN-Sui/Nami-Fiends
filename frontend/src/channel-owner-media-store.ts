import { useSyncExternalStore } from 'react';

import {
  CHANNEL_MEDIA_HYDRATED_EVENT,
  clearChannelMediaValue,
  ensureChannelMediaHydratedForKey,
  migrateLegacyLocalStorageMedia,
  readChannelMediaPersistenceVersion,
  readChannelMediaUrl,
  saveChannelMediaValue,
} from './channel-media-persistence.js';

const NEWS_BANNER_PREFIX = 'nami.channel.news-banner.';
const HERO_BACKGROUND_PREFIX = 'nami.channel.hero-background.';
const TRAILER_PREFIX = 'nami.channel.trailer.';
export const PARTNER_CAROUSEL_COVER_PREFIX = 'nami.channel.partner-carousel-cover.';
export const SUPER_BANNER_COVER_PREFIX = 'nami.channel.super-banner-cover.';

export const CHANNEL_MEDIA_REF_PREFIX = 'channel-media://';

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
  const key = storageKey(prefix, channelId);
  void ensureChannelMediaHydratedForKey(key);
  return readChannelMediaUrl(key);
}

async function saveOverride(prefix: string, channelId: string, value: string | Blob): Promise<void> {
  const key = storageKey(prefix, channelId);
  await migrateLegacyLocalStorageMedia(key);
  await saveChannelMediaValue(key, value);
  dispatchMediaChange();
}

async function clearOverride(prefix: string, channelId: string): Promise<void> {
  const key = storageKey(prefix, channelId);
  await clearChannelMediaValue(key);
  dispatchMediaChange();
}

export function partnerCarouselCoverStorageKey(channelId: string): string {
  return storageKey(PARTNER_CAROUSEL_COVER_PREFIX, channelId);
}

export function superBannerCoverStorageKey(channelId: string): string {
  return storageKey(SUPER_BANNER_COVER_PREFIX, channelId);
}

export function toChannelMediaRef(storageKeyValue: string): string {
  return CHANNEL_MEDIA_REF_PREFIX + storageKeyValue;
}

export function resolveChannelMediaRef(storedUrl: string): string {
  if (!storedUrl.startsWith(CHANNEL_MEDIA_REF_PREFIX)) {
    return storedUrl;
  }

  const key = storedUrl.slice(CHANNEL_MEDIA_REF_PREFIX.length);
  void ensureChannelMediaHydratedForKey(key);
  return readChannelMediaUrl(key) ?? '';
}

export async function externalizePromotionCoverUrl(
  channelId: string,
  coverUrl: string,
  slotPrefix: string,
): Promise<string> {
  const trimmed = coverUrl.trim();

  if (!trimmed) {
    return '';
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith(CHANNEL_MEDIA_REF_PREFIX)
  ) {
    return trimmed;
  }

  const key = storageKey(slotPrefix, channelId);
  await saveChannelMediaValue(key, trimmed);
  return toChannelMediaRef(key);
}

export function readPartnerCarouselCoverUrl(channelId: string): string | null {
  return readOverride(PARTNER_CAROUSEL_COVER_PREFIX, channelId);
}

export function readChannelNewsBannerOverride(channelId: string): string | null {
  return readOverride(NEWS_BANNER_PREFIX, channelId);
}

export function saveChannelNewsBannerOverride(channelId: string, dataUrl: string): void {
  void saveOverride(NEWS_BANNER_PREFIX, channelId, dataUrl).catch(() => {
    dispatchMediaChange();
  });
}

export function clearChannelNewsBannerOverride(channelId: string): void {
  void clearOverride(NEWS_BANNER_PREFIX, channelId);
}

export function readChannelHeroBackgroundOverride(channelId: string): string | null {
  return readOverride(HERO_BACKGROUND_PREFIX, channelId);
}

export function saveChannelHeroBackgroundOverride(channelId: string, dataUrl: string): void {
  void saveOverride(HERO_BACKGROUND_PREFIX, channelId, dataUrl).catch(() => {
    dispatchMediaChange();
  });
}

export function clearChannelHeroBackgroundOverride(channelId: string): void {
  void clearOverride(HERO_BACKGROUND_PREFIX, channelId);
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

export function saveChannelTrailerOverride(channelId: string, file: File): Promise<void> {
  return saveOverride(TRAILER_PREFIX, channelId, file);
}

export function clearChannelTrailerOverride(channelId: string): void {
  void clearOverride(TRAILER_PREFIX, channelId);
}

function subscribeOwnerMedia(listener: () => void): () => void {
  function onChange(): void {
    listener();
  }

  window.addEventListener('nami-channel-owner-media-changed', onChange);
  window.addEventListener(CHANNEL_MEDIA_HYDRATED_EVENT, onChange);

  return () => {
    window.removeEventListener('nami-channel-owner-media-changed', onChange);
    window.removeEventListener(CHANNEL_MEDIA_HYDRATED_EVENT, onChange);
  };
}

function readOwnerMediaVersion(): number {
  return mediaVersion + readChannelMediaPersistenceVersion();
}

export function useChannelOwnerMediaVersion(): number {
  return useSyncExternalStore(subscribeOwnerMedia, readOwnerMediaVersion, () => 0);
}