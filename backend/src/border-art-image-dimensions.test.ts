import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertBorderArtCanvasDimensions,
  BORDER_ART_CANVAS_SIZE,
  readBorderArtImageDimensions,
} from './border-art-image-dimensions.js';

/** 1×1 PNG */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

describe('border-art-image-dimensions', () => {
  it('reads PNG dimensions', () => {
    assert.deepEqual(readBorderArtImageDimensions(TINY_PNG, 'image/png'), {
      width: 1,
      height: 1,
    });
  });

  it('rejects non-square canvas sizes', () => {
    assert.throws(
      () => assertBorderArtCanvasDimensions(TINY_PNG, 'image/png', BORDER_ART_CANVAS_SIZE),
      /invalid_art_dimensions/
    );
  });
});