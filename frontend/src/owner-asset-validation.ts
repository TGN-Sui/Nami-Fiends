export type OwnerAssetCategory = 'brand' | 'profile' | 'badge' | 'button' | 'scene';

const MAX_LOGO_BYTES = 1024 * 1024;
const MAX_ICON_BYTES = 512 * 1024;
const MAX_SCENE_BYTES = 2 * 1024 * 1024;

export function validateOwnerAssetFile(
  file: File,
  category: OwnerAssetCategory = 'brand',
): string | null {
  const accepted = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

  if (!accepted.has(file.type)) {
    return 'Use a PNG, JPG, WebP, or GIF image.';
  }

  const maxBytes =
    category === 'scene'
      ? MAX_SCENE_BYTES
      : category === 'brand' || category === 'profile'
        ? MAX_LOGO_BYTES
        : MAX_ICON_BYTES;

  if (file.size > maxBytes) {
    if (category === 'scene') {
      return 'Image must be 2 MB or smaller.';
    }

    return category === 'brand' || category === 'profile'
      ? 'Image must be 1 MB or smaller.'
      : 'Image must be 512 KB or smaller.';
  }

  return null;
}