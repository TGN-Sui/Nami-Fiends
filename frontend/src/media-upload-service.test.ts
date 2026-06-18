import { describe, expect, it } from 'vitest';

import { validateMediaFile } from './media-upload-service.js';

function createFile(input: { type: string; size: number }): File {
  const buffer = new Uint8Array(input.size);

  return new File([buffer], 'upload.png', { type: input.type });
}

describe('media-upload-service', () => {
  it('rejects unsupported image types', () => {
    const file = createFile({ type: 'image/gif', size: 1024 });

    expect(validateMediaFile(file, 'avatar')).toBe('Use a PNG, JPG, or WebP image.');
  });

  it('enforces avatar size limits', () => {
    const file = createFile({ type: 'image/png', size: 2 * 1024 * 1024 + 1 });

    expect(validateMediaFile(file, 'avatar')).toBe('Image must be 2 MB or smaller.');
  });

  it('enforces channel cover size limits', () => {
    const file = createFile({ type: 'image/png', size: 4 * 1024 * 1024 + 1 });

    expect(validateMediaFile(file, 'channel-cover')).toBe(
      'Cover image must be 4 MB or smaller.'
    );
  });

  it('accepts supported files within limits', () => {
    const file = createFile({ type: 'image/webp', size: 512 * 1024 });

    expect(validateMediaFile(file, 'studio-logo')).toBeNull();
  });
});