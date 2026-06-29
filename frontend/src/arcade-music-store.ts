import {
  clearChannelMediaValue,
  ensureChannelMediaHydratedForKey,
  saveChannelMediaValue,
} from './channel-media-persistence.js';
import {
  CHANNEL_MEDIA_REF_PREFIX,
  resolveChannelMediaRef,
  toChannelMediaRef,
} from './channel-owner-media-store.js';

import { arcadeGameMusicSlotId, ARCADE_LOBBY_MUSIC_SLOT_ID } from './arcade-music.js';

export const ARCADE_LOBBY_MUSIC_MEDIA_KEY = 'nami.owner.arcade-lobby-music';
export const ARCADE_GAME_MUSIC_MEDIA_KEY_PREFIX = 'nami.owner.arcade-game-music.';

export const ARCADE_MUSIC_ACCEPTED_LABEL = 'MP3';
export const ARCADE_MUSIC_ACCEPTED_TYPES = new Set(['audio/mpeg', 'audio/mp3']);
export const ARCADE_MUSIC_MAX_BYTES = 16 * 1024 * 1024;

function storageKeyForSlot(slotId: string): string {
  if (slotId === ARCADE_LOBBY_MUSIC_SLOT_ID) {
    return ARCADE_LOBBY_MUSIC_MEDIA_KEY;
  }

  if (slotId.startsWith('arcade-game-music-')) {
    const gameId = slotId.slice('arcade-game-music-'.length);
    return ARCADE_GAME_MUSIC_MEDIA_KEY_PREFIX + gameId;
  }

  throw new Error('Unknown arcade music slot: ' + slotId);
}

export function isArcadeMusicMediaRef(storedValue: string): boolean {
  return (
    storedValue.startsWith(CHANNEL_MEDIA_REF_PREFIX) &&
    (storedValue.includes(ARCADE_LOBBY_MUSIC_MEDIA_KEY) ||
      storedValue.includes(ARCADE_GAME_MUSIC_MEDIA_KEY_PREFIX))
  );
}

export function validateArcadeMusicFile(file: File): string | null {
  const lowerName = file.name.toLowerCase();
  const isMp3 =
    ARCADE_MUSIC_ACCEPTED_TYPES.has(file.type) ||
    lowerName.endsWith('.mp3') ||
    file.type === '';

  if (!isMp3 && !lowerName.endsWith('.mp3')) {
    return 'Arcade music must be an MP3 file.';
  }

  if (file.size > ARCADE_MUSIC_MAX_BYTES) {
    return 'Arcade music must be 16 MB or smaller.';
  }

  return null;
}

export async function prepareArcadeMusicUpload(slotId: string, file: File): Promise<string> {
  const validationError = validateArcadeMusicFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const storageKey = storageKeyForSlot(slotId);
  await saveChannelMediaValue(storageKey, file);

  return toChannelMediaRef(storageKey);
}

export async function clearArcadeMusicMedia(slotId: string): Promise<void> {
  const storageKey = storageKeyForSlot(slotId);
  await clearChannelMediaValue(storageKey);
}

export function resolveArcadeMusicUrl(storedValue: string | null | undefined): string | null {
  if (!storedValue?.trim()) {
    return null;
  }

  const trimmed = storedValue.trim();

  if (trimmed.startsWith(CHANNEL_MEDIA_REF_PREFIX)) {
    const key = trimmed.slice(CHANNEL_MEDIA_REF_PREFIX.length);
    void ensureChannelMediaHydratedForKey(key);
    const resolved = resolveChannelMediaRef(trimmed);

    return resolved || null;
  }

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:audio/')) {
    return trimmed;
  }

  return null;
}

export function arcadeMusicAcceptAttribute(): string {
  return 'audio/mpeg,audio/mp3,.mp3';
}