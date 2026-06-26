export const BORDER_ART_CANVAS_SIZE = 384;

export type BorderArtImageDimensions = {
  width: number;
  height: number;
};

function readUInt16BE(bytes: Buffer, offset: number): number {
  return bytes.readUInt16BE(offset);
}

function readUInt16LE(bytes: Buffer, offset: number): number {
  return bytes.readUInt16LE(offset);
}

function readUInt32BE(bytes: Buffer, offset: number): number {
  return bytes.readUInt32BE(offset);
}

function readPngDimensions(bytes: Buffer): BorderArtImageDimensions | null {
  if (bytes.byteLength < 24 || bytes.toString('ascii', 1, 4) !== 'PNG') {
    return null;
  }

  return {
    width: readUInt32BE(bytes, 16),
    height: readUInt32BE(bytes, 20),
  };
}

function readGifDimensions(bytes: Buffer): BorderArtImageDimensions | null {
  const header = bytes.toString('ascii', 0, 6);

  if (header !== 'GIF87a' && header !== 'GIF89a') {
    return null;
  }

  if (bytes.byteLength < 10) {
    return null;
  }

  return {
    width: readUInt16LE(bytes, 6),
    height: readUInt16LE(bytes, 8),
  };
}

function readJpegDimensions(bytes: Buffer): BorderArtImageDimensions | null {
  if (bytes.byteLength < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  let offset = 2;

  while (offset + 9 < bytes.byteLength) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];

    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return {
        height: readUInt16BE(bytes, offset + 5),
        width: readUInt16BE(bytes, offset + 7),
      };
    }

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const segmentLength = readUInt16BE(bytes, offset + 2);

    if (segmentLength < 2) {
      break;
    }

    offset += 2 + segmentLength;
  }

  return null;
}

function readWebpDimensions(bytes: Buffer): BorderArtImageDimensions | null {
  if (bytes.byteLength < 30 || bytes.toString('ascii', 0, 4) !== 'RIFF') {
    return null;
  }

  if (bytes.toString('ascii', 8, 12) !== 'WEBP') {
    return null;
  }

  const chunk = bytes.toString('ascii', 12, 16);

  if (chunk === 'VP8X' && bytes.byteLength >= 30) {
    const width =
      1 +
      ((bytes[24] ?? 0) | ((bytes[25] ?? 0) << 8) | ((bytes[26] ?? 0) << 16));
    const height =
      1 +
      ((bytes[27] ?? 0) | ((bytes[28] ?? 0) << 8) | ((bytes[29] ?? 0) << 16));

    return { width, height };
  }

  if (chunk === 'VP8 ' && bytes.byteLength >= 30) {
    return {
      width: readUInt16LE(bytes, 26) & 0x3fff,
      height: readUInt16LE(bytes, 28) & 0x3fff,
    };
  }

  if (chunk === 'VP8L' && bytes.byteLength >= 25) {
    const bits =
      (bytes[21] ?? 0) |
      ((bytes[22] ?? 0) << 8) |
      ((bytes[23] ?? 0) << 16) |
      ((bytes[24] ?? 0) << 24);

    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  return null;
}

export function readBorderArtImageDimensions(
  bytes: Buffer,
  contentType: string
): BorderArtImageDimensions | null {
  const normalized = contentType.trim().toLowerCase();

  if (normalized.includes('png')) {
    return readPngDimensions(bytes);
  }

  if (normalized.includes('gif')) {
    return readGifDimensions(bytes);
  }

  if (normalized.includes('jpeg') || normalized.includes('jpg')) {
    return readJpegDimensions(bytes);
  }

  if (normalized.includes('webp')) {
    return readWebpDimensions(bytes);
  }

  return readPngDimensions(bytes) ??
    readGifDimensions(bytes) ??
    readJpegDimensions(bytes) ??
    readWebpDimensions(bytes);
}

function shouldRelaxBorderArtDimensions(): boolean {
  return process.env.NAMI_BORDER_ART_RELAX_DIMENSIONS === 'true';
}

export function assertBorderArtCanvasDimensions(
  bytes: Buffer,
  contentType: string,
  expectedSize = BORDER_ART_CANVAS_SIZE
): void {
  if (shouldRelaxBorderArtDimensions()) {
    return;
  }

  const dimensions = readBorderArtImageDimensions(bytes, contentType);

  if (!dimensions) {
    throw new Error('invalid_art_dimensions');
  }

  if (dimensions.width !== expectedSize || dimensions.height !== expectedSize) {
    throw new Error('invalid_art_dimensions');
  }
}