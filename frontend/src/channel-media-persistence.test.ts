// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  bootstrapChannelMediaPersistence,
  readChannelMediaUrl,
  resetChannelMediaDiskForTests,
  resetChannelMediaPersistenceForTests,
  saveChannelMediaValue,
} from './channel-media-persistence.js';

describe('channel-media-persistence', () => {
  beforeEach(() => {
    resetChannelMediaDiskForTests();
    resetChannelMediaPersistenceForTests();
  });

  afterEach(() => {
    resetChannelMediaDiskForTests();
    resetChannelMediaPersistenceForTests();
  });

  it('restores saved channel media after a simulated page refresh', async () => {
    const key = 'nami.channel.cover.owner-game-test';
    const dataUrl = 'data:image/png;base64,refresh-test';

    await saveChannelMediaValue(key, dataUrl);
    resetChannelMediaPersistenceForTests();

    expect(readChannelMediaUrl(key)).toBeNull();

    await bootstrapChannelMediaPersistence();

    expect(readChannelMediaUrl(key)).toBe(dataUrl);
  });
});