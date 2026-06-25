import { readFileAsDataUrl } from './media-upload-service.js';

const STATIC_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const ANIMATED_TYPES = new Set(['image/gif', 'image/webp']);

export function validateChatBorderStaticArt(file: File): string | null {
  if (!STATIC_TYPES.has(file.type)) {
    return 'Static border art must be PNG, JPG, or WebP.';
  }

  if (file.size > 2 * 1024 * 1024) {
    return 'Static border art must be 2 MB or smaller.';
  }

  return null;
}

export function validateChatBorderAnimatedArt(file: File): string | null {
  if (!ANIMATED_TYPES.has(file.type)) {
    return 'Animated border art must be GIF or animated WebP.';
  }

  if (file.size > 4 * 1024 * 1024) {
    return 'Animated border art must be 4 MB or smaller.';
  }

  return null;
}

export function readChatBorderArtDataUrl(file: File): Promise<string> {
  return readFileAsDataUrl(file);
}