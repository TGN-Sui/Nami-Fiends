import { useSyncExternalStore } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';

const CUSTOM_EMOJIS_KEY = 'nami.owner.custom-emojis';
const MAX_EMOJI_COUNT = 64;
const MAX_EMOJI_FILE_BYTES = 512 * 1024;

export type NamiCustomEmoji = {
  id: string;
  shortcode: string;
  label: string;
  imageUrl: string;
  uploadedAt: string;
};

export type NamiCustomEmojiResult =
  | { ok: true; emoji: NamiCustomEmoji }
  | { ok: false; reason: string };

export type ParsedEmojiSegment =
  | { type: 'text'; value: string }
  | { type: 'emoji'; emoji: NamiCustomEmoji; raw: string };

const listeners = new Set<() => void>();
let cachedSnapshot: NamiCustomEmoji[] | null = null;

function emit(): void {
  cachedSnapshot = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readEmojis(): NamiCustomEmoji[] {
  try {
    const stored = window.localStorage.getItem(CUSTOM_EMOJIS_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as NamiCustomEmoji[]) : [];
  } catch {
    return [];
  }
}

function writeEmojis(emojis: NamiCustomEmoji[]): void {
  window.localStorage.setItem(CUSTOM_EMOJIS_KEY, JSON.stringify(emojis.slice(0, MAX_EMOJI_COUNT)));
  emit();
}

function getSnapshot(): NamiCustomEmoji[] {
  if (!cachedSnapshot) {
    cachedSnapshot = readEmojis();
  }

  return cachedSnapshot;
}

export function useNamiCustomEmojis(): NamiCustomEmoji[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function readNamiCustomEmojis(): NamiCustomEmoji[] {
  return readEmojis();
}

export function emojiShortcodeToken(shortcode: string): string {
  return ':' + normalizeEmojiShortcode(shortcode) + ':';
}

export function normalizeEmojiShortcode(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^:+|:+$/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

export function suggestEmojiShortcodeFromLabel(label: string): string {
  const normalized = normalizeEmojiShortcode(label.replace(/\.[a-z0-9]+$/i, ''));

  return normalized || 'emoji';
}

function shortcodeInUse(shortcode: string, ignoreId?: string): boolean {
  const normalized = normalizeEmojiShortcode(shortcode);

  return readEmojis().some(
    (emoji) => emoji.shortcode === normalized && emoji.id !== ignoreId
  );
}

export function addNamiCustomEmojisBatch(input: {
  items: Array<{ label: string; shortcode: string; imageUrl: string }>;
  actorOwner: string | null;
}): { uploaded: NamiCustomEmoji[]; errors: string[] } {
  const uploaded: NamiCustomEmoji[] = [];
  const errors: string[] = [];

  for (const item of input.items) {
    const result = addNamiCustomEmoji({
      ...item,
      actorOwner: input.actorOwner,
    });

    if (result.ok) {
      uploaded.push(result.emoji);
      continue;
    }

    errors.push(result.reason);
  }

  return { uploaded, errors };
}

export function addNamiCustomEmoji(input: {
  label: string;
  shortcode: string;
  imageUrl: string;
  actorOwner: string | null;
}): NamiCustomEmojiResult {
  if (!isOfficialOwner(input.actorOwner)) {
    return { ok: false, reason: 'Only the Nami Official owner can upload chat emojis.' };
  }

  const emojis = readEmojis();

  if (emojis.length >= MAX_EMOJI_COUNT) {
    return { ok: false, reason: 'Emoji library is full (' + MAX_EMOJI_COUNT + ' max).' };
  }

  const shortcode = normalizeEmojiShortcode(input.shortcode);

  if (!shortcode) {
    return { ok: false, reason: 'Choose a shortcode using letters, numbers, hyphens, or underscores.' };
  }

  if (shortcodeInUse(shortcode)) {
    return { ok: false, reason: 'Shortcode :' + shortcode + ': is already in use.' };
  }

  if (!input.imageUrl.startsWith('data:image/')) {
    return { ok: false, reason: 'Emoji image must be a PNG, JPG, WebP, or GIF upload.' };
  }

  const emoji: NamiCustomEmoji = {
    id: 'emoji-' + Date.now(),
    shortcode,
    label: input.label.trim() || shortcode,
    imageUrl: input.imageUrl,
    uploadedAt: new Date().toISOString(),
  };

  writeEmojis([emoji, ...emojis]);

  return { ok: true, emoji };
}

export function removeNamiCustomEmoji(emojiId: string, actorOwner: string | null): boolean {
  if (!isOfficialOwner(actorOwner)) {
    return false;
  }

  const next = readEmojis().filter((emoji) => emoji.id !== emojiId);

  if (next.length === readEmojis().length) {
    return false;
  }

  writeEmojis(next);
  return true;
}

export function validateEmojiUploadFile(file: File): string | null {
  const accepted = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

  if (!accepted.has(file.type)) {
    return 'Use a PNG, JPG, WebP, or GIF image.';
  }

  if (file.size > MAX_EMOJI_FILE_BYTES) {
    return 'Emoji image must be 512 KB or smaller.';
  }

  return null;
}

export function lookupCustomEmoji(shortcode: string): NamiCustomEmoji | undefined {
  const normalized = normalizeEmojiShortcode(shortcode);

  return readEmojis().find((emoji) => emoji.shortcode === normalized);
}

export function parseCustomEmojiSegments(text: string): ParsedEmojiSegment[] {
  const emojis = readEmojis();

  if (emojis.length === 0) {
    return [{ type: 'text', value: text }];
  }

  const shortcodeMap = new Map(emojis.map((emoji) => [emoji.shortcode, emoji]));
  const segments: ParsedEmojiSegment[] = [];
  const pattern = /:([a-zA-Z0-9_-]+):/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = pattern.exec(text);

  while (match) {
    const start = match.index;
    const raw = match[0]!;
    const shortcode = normalizeEmojiShortcode(match[1] ?? '');
    const emoji = shortcodeMap.get(shortcode);

    if (start > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, start) });
    }

    if (emoji) {
      segments.push({ type: 'emoji', emoji, raw });
    } else {
      segments.push({ type: 'text', value: raw });
    }

    lastIndex = start + raw.length;
    match = pattern.exec(text);
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: text }];
}

export const NAMI_EMOJI_ACCEPTED_FORMATS = 'PNG, JPG, WebP, GIF';