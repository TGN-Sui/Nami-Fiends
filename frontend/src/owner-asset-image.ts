import type { OwnerAssetCategory } from './owner-asset-validation.js';

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Could not read that image.'));
    };

    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

const OUTPUT_LIMITS: Record<OwnerAssetCategory, { maxEdge: number; maxBytes: number }> = {
  brand: { maxEdge: 512, maxBytes: 280_000 },
  profile: { maxEdge: 512, maxBytes: 280_000 },
  badge: { maxEdge: 256, maxBytes: 140_000 },
  button: { maxEdge: 256, maxBytes: 140_000 },
  scene: { maxEdge: 1920, maxBytes: 900_000 },
};

function estimateDataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',');

  if (commaIndex < 0) {
    return dataUrl.length;
  }

  const base64 = dataUrl.slice(commaIndex + 1);
  return Math.ceil(base64.length * 0.75);
}

function compressCanvasToDataUrl(
  canvas: HTMLCanvasElement,
  maxBytes: number
): string | null {
  const qualities = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5];

  for (const quality of qualities) {
    const webp = canvas.toDataURL('image/webp', quality);

    if (estimateDataUrlBytes(webp) <= maxBytes) {
      return webp;
    }
  }

  for (const quality of qualities) {
    const jpeg = canvas.toDataURL('image/jpeg', quality);

    if (estimateDataUrlBytes(jpeg) <= maxBytes) {
      return jpeg;
    }
  }

  const smallest = canvas.toDataURL('image/jpeg', 0.42);
  return estimateDataUrlBytes(smallest) <= maxBytes ? smallest : null;
}

export async function prepareOwnerAssetImage(
  file: File,
  category: OwnerAssetCategory = 'brand'
): Promise<string> {
  if (file.type === 'image/gif' || typeof document === 'undefined') {
    return readImageFileAsDataUrl(file);
  }

  const limits = OUTPUT_LIMITS[category];
  const bitmap = await createImageBitmap(file);
  const largestEdge = Math.max(bitmap.width, bitmap.height, 1);
  const scale = Math.min(1, limits.maxEdge / largestEdge);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) {
    bitmap.close();
    return readImageFileAsDataUrl(file);
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const compressed = compressCanvasToDataUrl(canvas, limits.maxBytes);

  if (compressed) {
    return compressed;
  }

  return readImageFileAsDataUrl(file);
}