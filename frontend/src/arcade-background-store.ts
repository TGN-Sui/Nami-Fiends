import {
  clearChannelMediaValue,
  ensureChannelMediaHydratedForKey,
  saveChannelMediaValue,
} from './channel-media-persistence.js';
import {
  resolveChannelMediaRef,
  toChannelMediaRef,
} from './channel-owner-media-store.js';
import {
  ARCADE_BACKGROUND_SLOT_ID,
  DEFAULT_ARCADE_BACKGROUND_URL,
} from './arcade-background.js';
import { prepareOwnerAssetImage, validateOwnerAssetFile } from './nami-owner-assets-store.js';

export const ARCADE_BACKGROUND_MEDIA_KEY = 'nami.owner.arcade-background';
export const ARCADE_BACKGROUND_VIDEO_ACCEPTED_LABEL = 'MP4 or WebM';
export const ARCADE_BACKGROUND_VIDEO_ACCEPTED_TYPES = new Set(['video/mp4', 'video/webm']);
export const ARCADE_BACKGROUND_VIDEO_MAX_BYTES = 48 * 1024 * 1024;

export type ArcadeBackgroundMediaKind = 'default' | 'image' | 'video';

export type ArcadeBackgroundMedia = {
  kind: ArcadeBackgroundMediaKind;
  url: string;
};

export function isArcadeBackgroundVideoRef(storedValue: string): boolean {
  return (
    storedValue.startsWith('channel-media://') ||
    storedValue.startsWith('data:video/')
  );
}

export function validateArcadeBackgroundFile(file: File): string | null {
  if (ARCADE_BACKGROUND_VIDEO_ACCEPTED_TYPES.has(file.type)) {
    if (file.size > ARCADE_BACKGROUND_VIDEO_MAX_BYTES) {
      return 'Arcade background video must be 48 MB or smaller.';
    }

    return null;
  }

  return validateOwnerAssetFile(file, 'scene');
}

export async function prepareArcadeBackgroundUpload(file: File): Promise<string> {
  if (ARCADE_BACKGROUND_VIDEO_ACCEPTED_TYPES.has(file.type)) {
    const validationError = validateArcadeBackgroundFile(file);

    if (validationError) {
      throw new Error(validationError);
    }

    await saveChannelMediaValue(ARCADE_BACKGROUND_MEDIA_KEY, file);

    return toChannelMediaRef(ARCADE_BACKGROUND_MEDIA_KEY);
  }

  return prepareOwnerAssetImage(file, 'scene');
}

export async function clearArcadeBackgroundMedia(): Promise<void> {
  await clearChannelMediaValue(ARCADE_BACKGROUND_MEDIA_KEY);
}

function isRemoteVideoUrl(value: string): boolean {
  return (
    (value.startsWith('http://') || value.startsWith('https://')) &&
    /\.(mp4|webm)(\?|#|$)/i.test(value)
  );
}

export function resolveArcadeBackgroundMedia(
  storedValue: string | null | undefined,
): ArcadeBackgroundMedia {
  const trimmed = storedValue?.trim();

  if (!trimmed) {
    return { kind: 'default', url: DEFAULT_ARCADE_BACKGROUND_URL };
  }

  if (isRemoteVideoUrl(trimmed)) {
    return { kind: 'video', url: trimmed };
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { kind: 'image', url: trimmed };
  }

  if (trimmed.startsWith('channel-media://')) {
    if (isArcadeBackgroundVideoRef(trimmed)) {
      const mediaKey = trimmed.slice('channel-media://'.length);

      if (mediaKey) {
        void ensureChannelMediaHydratedForKey(mediaKey);
      }

      const resolvedUrl = resolveChannelMediaRef(trimmed);

      if (resolvedUrl) {
        return { kind: 'video', url: resolvedUrl };
      }
    }

    return { kind: 'default', url: DEFAULT_ARCADE_BACKGROUND_URL };
  }

  if (isArcadeBackgroundVideoRef(trimmed)) {
    const mediaKey = trimmed.startsWith('channel-media://')
      ? trimmed.slice('channel-media://'.length)
      : '';

    if (mediaKey) {
      void ensureChannelMediaHydratedForKey(mediaKey);
    }

    const resolvedUrl = trimmed.startsWith('channel-media://')
      ? resolveChannelMediaRef(trimmed)
      : trimmed;

    if (resolvedUrl) {
      return { kind: 'video', url: resolvedUrl };
    }

    return { kind: 'default', url: DEFAULT_ARCADE_BACKGROUND_URL };
  }

  return { kind: 'image', url: trimmed };
}

export function arcadeBackgroundAcceptAttribute(): string {
  return (
    'image/png,image/jpeg,image/webp,image/gif,' +
    Array.from(ARCADE_BACKGROUND_VIDEO_ACCEPTED_TYPES).join(',')
  );
}

export { ARCADE_BACKGROUND_SLOT_ID };