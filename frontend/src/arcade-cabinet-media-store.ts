import {
  clearChannelMediaValue,
  ensureChannelMediaHydratedForKey,
  saveChannelMediaValue,
} from './channel-media-persistence.js';
import {
  resolveChannelMediaRef,
  toChannelMediaRef,
} from './channel-owner-media-store.js';
import { DEFAULT_ARCADE_BACKGROUND_URL } from './arcade-background.js';
import { DEFAULT_ARCADE_STAGE_BACKGROUND_URL } from './arcade-stage-background.js';
import { readArcadeCabinetById } from './arcade-cabinets.js';
import {
  arcadeCabinetMediaStorageKey,
  parseArcadeCabinetMediaSlotId,
  readArcadeCabinetDefaultMediaUrl,
  type ArcadeCabinetMediaKind,
} from './arcade-cabinet-media.js';
import { prepareOwnerAssetImage, validateOwnerAssetFile } from './nami-owner-assets-store.js';
import {
  ARCADE_STAGE_BACKGROUND_VIDEO_ACCEPTED_TYPES,
  ARCADE_STAGE_BACKGROUND_VIDEO_MAX_BYTES,
  type ArcadeStageBackgroundMedia,
} from './arcade-stage-background-store.js';

export function validateArcadeCabinetIntroFile(file: File): string | null {
  if (!ARCADE_STAGE_BACKGROUND_VIDEO_ACCEPTED_TYPES.has(file.type)) {
    return 'Cabinet walk-up intro must be an MP4 or WebM video.';
  }

  if (file.size > ARCADE_STAGE_BACKGROUND_VIDEO_MAX_BYTES) {
    return 'Cabinet walk-up intro must be 48 MB or smaller.';
  }

  return null;
}

export function validateArcadeCabinetStageFile(file: File): string | null {
  if (ARCADE_STAGE_BACKGROUND_VIDEO_ACCEPTED_TYPES.has(file.type)) {
    if (file.size > ARCADE_STAGE_BACKGROUND_VIDEO_MAX_BYTES) {
      return 'Cabinet stage video must be 48 MB or smaller.';
    }

    return null;
  }

  return validateOwnerAssetFile(file, 'scene');
}

export function validateArcadeCabinetViewportFile(file: File): string | null {
  if (ARCADE_STAGE_BACKGROUND_VIDEO_ACCEPTED_TYPES.has(file.type)) {
    if (file.size > ARCADE_STAGE_BACKGROUND_VIDEO_MAX_BYTES) {
      return 'Cabinet viewport video must be 48 MB or smaller.';
    }

    return null;
  }

  return validateOwnerAssetFile(file, 'scene');
}

export function validateArcadeCabinetMediaFile(slotId: string, file: File): string | null {
  const parsed = parseArcadeCabinetMediaSlotId(slotId);

  if (!parsed) {
    return 'Unknown arcade cabinet media slot.';
  }

  if (parsed.kind === 'intro') {
    return validateArcadeCabinetIntroFile(file);
  }

  if (parsed.kind === 'stage') {
    return validateArcadeCabinetStageFile(file);
  }

  return validateArcadeCabinetViewportFile(file);
}

export async function prepareArcadeCabinetMediaUpload(slotId: string, file: File): Promise<string> {
  const parsed = parseArcadeCabinetMediaSlotId(slotId);

  if (!parsed) {
    throw new Error('Unknown arcade cabinet media slot: ' + slotId);
  }

  const validationError = validateArcadeCabinetMediaFile(slotId, file);

  if (validationError) {
    throw new Error(validationError);
  }

  if (parsed.kind === 'intro' || ARCADE_STAGE_BACKGROUND_VIDEO_ACCEPTED_TYPES.has(file.type)) {
    const mediaKey = arcadeCabinetMediaStorageKey(parsed.cabinetId, parsed.kind);
    await saveChannelMediaValue(mediaKey, file);
    return toChannelMediaRef(mediaKey);
  }

  return prepareOwnerAssetImage(file, 'scene');
}

export async function clearArcadeCabinetMedia(slotId: string): Promise<void> {
  const parsed = parseArcadeCabinetMediaSlotId(slotId);

  if (!parsed) {
    return;
  }

  await clearChannelMediaValue(arcadeCabinetMediaStorageKey(parsed.cabinetId, parsed.kind));
}

function isVideoRefForKind(storedValue: string, kind: ArcadeCabinetMediaKind): boolean {
  if (storedValue.startsWith('data:video/')) {
    return true;
  }

  if (
    (storedValue.startsWith('http://') || storedValue.startsWith('https://')) &&
    /\.(mp4|webm)(\?|#|$)/i.test(storedValue)
  ) {
    return true;
  }

  if (!storedValue.startsWith('channel-media://')) {
    return false;
  }

  const mediaKey = storedValue.slice('channel-media://'.length);
  return mediaKey.includes(`.${kind}`);
}

function defaultFallbackUrl(kind: ArcadeCabinetMediaKind): string {
  if (kind === 'viewport') {
    return DEFAULT_ARCADE_BACKGROUND_URL;
  }

  return DEFAULT_ARCADE_STAGE_BACKGROUND_URL;
}

export function resolveArcadeCabinetMedia(
  cabinetId: string,
  kind: ArcadeCabinetMediaKind,
  storedValue: string | null | undefined,
): ArcadeStageBackgroundMedia {
  const cabinet = readArcadeCabinetById(cabinetId);
  const fallbackUrl = cabinet
    ? readArcadeCabinetDefaultMediaUrl(cabinet, kind)
    : defaultFallbackUrl(kind);
  const trimmed = storedValue?.trim();

  if (!trimmed) {
    if (kind === 'viewport') {
      return { kind: 'default', url: fallbackUrl };
    }

    return { kind: 'video', url: fallbackUrl };
  }

  if (
    (trimmed.startsWith('http://') || trimmed.startsWith('https://')) &&
    /\.(mp4|webm)(\?|#|$)/i.test(trimmed)
  ) {
    return { kind: 'video', url: trimmed };
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { kind: 'image', url: trimmed };
  }

  if (trimmed.startsWith('channel-media://')) {
    if (isVideoRefForKind(trimmed, kind)) {
      const mediaKey = trimmed.slice('channel-media://'.length);

      if (mediaKey) {
        void ensureChannelMediaHydratedForKey(mediaKey);
      }

      const resolvedUrl = resolveChannelMediaRef(trimmed);

      if (resolvedUrl) {
        return { kind: 'video', url: resolvedUrl };
      }

      return { kind: 'loading', url: '' };
    }

    return kind === 'viewport'
      ? { kind: 'default', url: fallbackUrl }
      : { kind: 'video', url: fallbackUrl };
  }

  if (trimmed.startsWith('data:video/') || (kind !== 'viewport' && isVideoRefForKind(trimmed, kind))) {
    const resolvedUrl = trimmed.startsWith('channel-media://')
      ? resolveChannelMediaRef(trimmed)
      : trimmed;

    if (resolvedUrl) {
      return { kind: 'video', url: resolvedUrl };
    }
  }

  return { kind: 'image', url: trimmed };
}

export function resolveArcadeCabinetIntroUrl(
  cabinetId: string,
  storedValue: string | null | undefined,
): string {
  return resolveArcadeCabinetMedia(cabinetId, 'intro', storedValue).url;
}

export function resolveArcadeCabinetStageMedia(
  cabinetId: string,
  storedValue: string | null | undefined,
): ArcadeStageBackgroundMedia {
  return resolveArcadeCabinetMedia(cabinetId, 'stage', storedValue);
}

export function resolveArcadeCabinetViewportMedia(
  cabinetId: string,
  storedValue: string | null | undefined,
): ArcadeStageBackgroundMedia {
  const media = resolveArcadeCabinetMedia(cabinetId, 'viewport', storedValue);

  if (media.kind === 'default') {
    return { kind: 'default', url: DEFAULT_ARCADE_BACKGROUND_URL };
  }

  return media;
}

export function isArcadeCabinetMediaVideoRef(slotId: string, storedValue: string): boolean {
  const parsed = parseArcadeCabinetMediaSlotId(slotId);

  if (!parsed) {
    return false;
  }

  return isVideoRefForKind(storedValue, parsed.kind);
}

export function arcadeCabinetMediaAcceptAttribute(slotId: string): string {
  const parsed = parseArcadeCabinetMediaSlotId(slotId);

  if (!parsed) {
    return 'image/png,image/jpeg,image/webp,image/gif';
  }

  if (parsed.kind === 'intro') {
    return Array.from(ARCADE_STAGE_BACKGROUND_VIDEO_ACCEPTED_TYPES).join(',');
  }

  return (
    'image/png,image/jpeg,image/webp,image/gif,' +
    Array.from(ARCADE_STAGE_BACKGROUND_VIDEO_ACCEPTED_TYPES).join(',')
  );
}