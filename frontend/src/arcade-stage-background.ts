export const ARCADE_STAGE_BACKGROUND_SLOT_ID = 'arcade-stage-background';

export const DEFAULT_ARCADE_STAGE_BACKGROUND_URL = new URL(
  './assets/arcade-stage-grid-placeholder.svg',
  import.meta.url,
).href;

export const ARCADE_STAGE_BACKGROUND_SPEC = {
  slotId: ARCADE_STAGE_BACKGROUND_SLOT_ID,
  label: 'Arcade stage background',
  recommendedPixels: '1920 × 1080 px',
  aspectRatio: '16:9',
  usage:
    'Full-page backdrop behind the Nami Arcade cabinet (replaces the platform grid on the Arcade route). Upload a still image or looping MP4/WebM video.',
} as const;

export { resolveArcadeStageBackgroundMedia } from './arcade-stage-background-store.js';