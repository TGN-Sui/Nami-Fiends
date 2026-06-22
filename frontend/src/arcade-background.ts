export const ARCADE_BACKGROUND_SLOT_ID = 'arcade-background';

export const DEFAULT_ARCADE_BACKGROUND_URL = new URL(
  './assets/arcade-alley-background.svg',
  import.meta.url,
).href;

export const ARCADE_BACKGROUND_SPEC = {
  slotId: ARCADE_BACKGROUND_SLOT_ID,
  label: 'Arcade background',
  recommendedPixels: '1920 × 1080 px',
  aspectRatio: '16:9',
  usage:
    'Full background inside the Nami Arcade cabinet viewport. Upload a still image or looping MP4/WebM video.',
} as const;

export { resolveArcadeBackgroundMedia } from './arcade-background-store.js';