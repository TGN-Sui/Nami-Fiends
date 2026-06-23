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
  ARCADE_STAGE_BACKGROUND_SLOT_ID,
  DEFAULT_ARCADE_STAGE_BACKGROUND_URL,
} from './arcade-stage-background.js';
import { prepareOwnerAssetImage, validateOwnerAssetFile } from './nami-owner-assets-store.js';

export const ARCADE_STAGE_BACKGROUND_MEDIA_KEY = 'nami.owner.arcade-stage-background';
export const ARCADE_STAGE_BACKGROUND_VIDEO_ACCEPTED_LABEL = 'MP4 or WebM';
export const ARCADE_STAGE_BACKGROUND_VIDEO_ACCEPTED_TYPES = new Set(['video/mp4', 'video/webm']);
export const ARCADE_STAGE_BACKGROUND_VIDEO_MAX_BYTES = 48 * 1024 * 1024;

export type ArcadeStageBackgroundMediaKind = 'default' | 'image' | 'video';

export type ArcadeStageBackgroundMedia = {
  kind: ArcadeStageBackgroundMediaKind;
  url: string;
};

export function isArcadeStageBackgroundVideoRef(storedValue: string): boolean {
  return (
    storedValue.startsWith('channel-media://') ||
    storedValue.startsWith('data:video/')
  );
}

export function validateArcadeStageBackgroundFile(file: File): string | null {
  if (ARCADE_STAGE_BACKGROUND_VIDEO_ACCEPTED_TYPES.has(file.type)) {
    if (file.size > ARCADE_STAGE_BACKGROUND_VIDEO_MAX_BYTES) {
      return 'Arcade stage background video must be 48 MB or smaller.';
    }

    return null;
  }

  return validateOwnerAssetFile(file, 'scene');
}

export async function prepareArcadeStageBackgroundUpload(file: File): Promise<string> {
  if (ARCADE_STAGE_BACKGROUND_VIDEO_ACCEPTED_TYPES.has(file.type)) {
    const validationError = validateArcadeStageBackgroundFile(file);

    if (validationError) {
      throw new Error(validationError);
    }

    await saveChannelMediaValue(ARCADE_STAGE_BACKGROUND_MEDIA_KEY, file);

    return toChannelMediaRef(ARCADE_STAGE_BACKGROUND_MEDIA_KEY);
  }

  return prepareOwnerAssetImage(file, 'scene');
}

export async function clearArcadeStageBackgroundMedia(): Promise<void> {
  await clearChannelMediaValue(ARCADE_STAGE_BACKGROUND_MEDIA_KEY);
}

function isRemoteVideoUrl(value: string): boolean {
  return (
    (value.startsWith('http://') || value.startsWith('https://')) &&
    /\.(mp4|webm)(\?|#|$)/i.test(value)
  );
}

export function resolveArcadeStageBackgroundMedia(
  storedValue: string | null | undefined,
): ArcadeStageBackgroundMedia {
  const trimmed = storedValue?.trim();

  if (!trimmed) {
    return { kind: 'default', url: DEFAULT_ARCADE_STAGE_BACKGROUND_URL };
  }

  if (isRemoteVideoUrl(trimmed)) {
    return { kind: 'video', url: trimmed };
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { kind: 'image', url: trimmed };
  }

  if (trimmed.startsWith('channel-media://')) {
    if (isArcadeStageBackgroundVideoRef(trimmed)) {
      const mediaKey = trimmed.slice('channel-media://'.length);

      if (mediaKey) {
        void ensureChannelMediaHydratedForKey(mediaKey);
      }

      const resolvedUrl = resolveChannelMediaRef(trimmed);

      if (resolvedUrl) {
        return { kind: 'video', url: resolvedUrl };
      }
    }

    return { kind: 'default', url: DEFAULT_ARCADE_STAGE_BACKGROUND_URL };
  }

  if (isArcadeStageBackgroundVideoRef(trimmed)) {
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

    return { kind: 'default', url: DEFAULT_ARCADE_STAGE_BACKGROUND_URL };
  }

  return { kind: 'image', url: trimmed };
}

export function arcadeStageBackgroundAcceptAttribute(): string {
  return (
    'image/png,image/jpeg,image/webp,image/gif,' +
    Array.from(ARCADE_STAGE_BACKGROUND_VIDEO_ACCEPTED_TYPES).join(',')
  );
}

export { ARCADE_STAGE_BACKGROUND_SLOT_ID };