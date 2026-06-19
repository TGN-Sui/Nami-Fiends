import { useSyncExternalStore } from 'react';

import { ownsGameChannel } from './channel-owner-access.js';
import {
  emojiShortcodeToken,
  normalizeEmojiShortcode,
  suggestEmojiShortcodeFromLabel,
  validateEmojiUploadFile,
  type NamiCustomEmoji,
} from './nami-custom-emojis-store.js';

export type ChannelCustomEmoji = NamiCustomEmoji & {
  channelId: string;
};

export type ChannelCustomEmojiResult =
  | { ok: true; emoji: ChannelCustomEmoji }
  | { ok: false; reason: string };

const STORAGE_PREFIX = 'nami.channel.custom-emojis.';
const MAX_EMOJI_COUNT = 48;

const listeners = new Set<() => void>();
let cachedByChannel: Record<string, ChannelCustomEmoji[]> | null = null;
let emojiVersion = 0;

function storageKey(channelId: string): string {
  return STORAGE_PREFIX + channelId;
}

function emit(): void {
  emojiVersion += 1;
  cachedByChannel = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readChannelEmojisUncached(channelId: string): ChannelCustomEmoji[] {
  try {
    const stored = window.localStorage.getItem(storageKey(channelId));

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry): entry is ChannelCustomEmoji =>
        !!entry &&
        typeof entry === 'object' &&
        typeof (entry as ChannelCustomEmoji).id === 'string' &&
        typeof (entry as ChannelCustomEmoji).shortcode === 'string' &&
        typeof (entry as ChannelCustomEmoji).imageUrl === 'string' &&
        typeof (entry as ChannelCustomEmoji).channelId === 'string',
    );
  } catch {
    return [];
  }
}

function readAllChannelEmojis(): Record<string, ChannelCustomEmoji[]> {
  if (cachedByChannel) {
    return cachedByChannel;
  }

  const grouped: Record<string, ChannelCustomEmoji[]> = {};

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (!key || !key.startsWith(STORAGE_PREFIX)) {
        continue;
      }

      const channelId = key.slice(STORAGE_PREFIX.length);
      grouped[channelId] = readChannelEmojisUncached(channelId);
    }
  } catch {
    cachedByChannel = {};
    return cachedByChannel;
  }

  cachedByChannel = grouped;
  return grouped;
}

function writeChannelEmojis(channelId: string, emojis: ChannelCustomEmoji[]): void {
  window.localStorage.setItem(storageKey(channelId), JSON.stringify(emojis.slice(0, MAX_EMOJI_COUNT)));
  emit();
}

function readEmojiVersion(): number {
  return emojiVersion;
}

export function useChannelCustomEmojis(channelId: string): ChannelCustomEmoji[] {
  useSyncExternalStore(subscribe, readEmojiVersion, () => 0);
  return readChannelCustomEmojis(channelId);
}

export function useChannelEmojiLibraryVersion(): number {
  return useSyncExternalStore(subscribe, readEmojiVersion, () => 0);
}

export function readChannelCustomEmojis(channelId: string): ChannelCustomEmoji[] {
  return readAllChannelEmojis()[channelId] ?? readChannelEmojisUncached(channelId);
}

function shortcodeInUse(channelId: string, shortcode: string, ignoreId?: string): boolean {
  const normalized = normalizeEmojiShortcode(shortcode);

  return readChannelCustomEmojis(channelId).some(
    (emoji) => emoji.shortcode === normalized && emoji.id !== ignoreId,
  );
}

export function addChannelCustomEmoji(input: {
  channelId: string;
  label: string;
  shortcode: string;
  imageUrl: string;
}): ChannelCustomEmojiResult {
  if (!ownsGameChannel(input.channelId)) {
    return { ok: false, reason: 'Only the game channel owner can upload channel emojis.' };
  }

  const emojis = readChannelCustomEmojis(input.channelId);

  if (emojis.length >= MAX_EMOJI_COUNT) {
    return { ok: false, reason: 'Channel emoji library is full (' + MAX_EMOJI_COUNT + ' max).' };
  }

  const shortcode = normalizeEmojiShortcode(input.shortcode);

  if (!shortcode) {
    return { ok: false, reason: 'Choose a shortcode using letters, numbers, hyphens, or underscores.' };
  }

  if (shortcodeInUse(input.channelId, shortcode)) {
    return { ok: false, reason: 'Shortcode :' + shortcode + ': is already in use for this channel.' };
  }

  if (!input.imageUrl.startsWith('data:image/')) {
    return { ok: false, reason: 'Emoji image must be a PNG, JPG, WebP, or GIF upload.' };
  }

  const emoji: ChannelCustomEmoji = {
    id: 'channel-emoji-' + input.channelId + '-' + Date.now(),
    channelId: input.channelId,
    shortcode,
    label: input.label.trim() || shortcode,
    imageUrl: input.imageUrl,
    uploadedAt: new Date().toISOString(),
  };

  writeChannelEmojis(input.channelId, [emoji, ...emojis]);

  return { ok: true, emoji };
}

export function addChannelCustomEmojisBatch(input: {
  channelId: string;
  items: Array<{ label: string; shortcode: string; imageUrl: string }>;
}): { uploaded: ChannelCustomEmoji[]; errors: string[] } {
  const uploaded: ChannelCustomEmoji[] = [];
  const errors: string[] = [];

  for (const item of input.items) {
    const result = addChannelCustomEmoji({
      channelId: input.channelId,
      ...item,
    });

    if (result.ok) {
      uploaded.push(result.emoji);
      continue;
    }

    errors.push(result.reason);
  }

  return { uploaded, errors };
}

export function removeChannelCustomEmoji(channelId: string, emojiId: string): boolean {
  if (!ownsGameChannel(channelId)) {
    return false;
  }

  const emojis = readChannelCustomEmojis(channelId);
  const next = emojis.filter((emoji) => emoji.id !== emojiId);

  if (next.length === emojis.length) {
    return false;
  }

  writeChannelEmojis(channelId, next);
  return true;
}

export function resolveChatEmojisForChannel(channelId: string): ChannelCustomEmoji[] {
  return readChannelCustomEmojis(channelId);
}

export {
  emojiShortcodeToken,
  normalizeEmojiShortcode,
  suggestEmojiShortcodeFromLabel,
  validateEmojiUploadFile,
};

export const CHANNEL_EMOJI_MAX_COUNT = MAX_EMOJI_COUNT;
export const CHANNEL_EMOJI_ACCEPTED_FORMATS = 'PNG, JPG, WebP, GIF';