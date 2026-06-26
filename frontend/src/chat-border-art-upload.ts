import { CHAT_BORDER_ART_CANVAS_SIZE } from './chat-border-art-specs.js';
import { readFileAsDataUrl } from './media-upload-service.js';

const STATIC_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const ANIMATED_TYPES = new Set(['image/gif', 'image/webp']);

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not decode border art dimensions.'));
    };

    image.src = objectUrl;
  });
}

async function validateBorderArtCanvas(file: File): Promise<string | null> {
  try {
    const dimensions = await readImageDimensions(file);

    if (
      dimensions.width !== CHAT_BORDER_ART_CANVAS_SIZE ||
      dimensions.height !== CHAT_BORDER_ART_CANVAS_SIZE
    ) {
      return (
        'Border art must be exactly ' +
        CHAT_BORDER_ART_CANVAS_SIZE +
        '×' +
        CHAT_BORDER_ART_CANVAS_SIZE +
        ' px (got ' +
        dimensions.width +
        '×' +
        dimensions.height +
        ').'
      );
    }
  } catch {
    return 'Could not read border art dimensions. Upload a valid PNG, JPG, WebP, or GIF.';
  }

  return null;
}

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

export async function validateChatBorderStaticArtUpload(file: File): Promise<string | null> {
  const baseError = validateChatBorderStaticArt(file);

  if (baseError) {
    return baseError;
  }

  return validateBorderArtCanvas(file);
}

export async function validateChatBorderAnimatedArtUpload(file: File): Promise<string | null> {
  const baseError = validateChatBorderAnimatedArt(file);

  if (baseError) {
    return baseError;
  }

  return validateBorderArtCanvas(file);
}

export function readChatBorderArtDataUrl(file: File): Promise<string> {
  return readFileAsDataUrl(file);
}