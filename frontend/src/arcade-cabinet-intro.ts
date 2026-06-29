import { readArcadeCabinetPublicMediaUrl } from './arcade-cabinet-media.js';
import { resolveArcadeCabinetMedia } from './arcade-cabinet-media-store.js';
import type { ArcadeStageBackgroundMedia } from './arcade-stage-background-store.js';

export const ARCADE_CABINET_INTRO_LOADING_TIMEOUT_MS = 2_500;
export const ARCADE_CABINET_INTRO_STALL_TIMEOUT_MS = 3_500;

export function resolveArcadeCabinetIntroMedia(
  cabinetId: string,
  storedValue: string | null | undefined,
  preferPublicFallback = false,
): ArcadeStageBackgroundMedia {
  const resolved = resolveArcadeCabinetMedia(cabinetId, 'intro', storedValue);

  if (resolved.kind !== 'loading' && !preferPublicFallback) {
    return resolved;
  }

  return {
    kind: 'video',
    url: readArcadeCabinetPublicMediaUrl(cabinetId, 'intro'),
  };
}