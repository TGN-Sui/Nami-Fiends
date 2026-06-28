import { afterEach, describe, expect, it, vi } from 'vitest';

const { autoSeedEnabled, officialEmojis } = vi.hoisted(() => ({
  autoSeedEnabled: { value: true },
  officialEmojis: { value: [] as Array<{
    id: string;
    shortcode: string;
    label: string;
    imageUrl: string;
    uploadedAt: string;
  }> },
}));

vi.mock('./member-access.js', () => ({
  canSendChatMessages: () => true,
}));

vi.mock('./app-config.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./app-config.js')>();

  return {
    ...actual,
    shouldAutoSeedLocalData: () => autoSeedEnabled.value,
  };
});

vi.mock('./nami-custom-emojis-store.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./nami-custom-emojis-store.js')>();

  return {
    ...actual,
    readNamiCustomEmojis: () => officialEmojis.value,
  };
});

import { mergeQualifiedChatEmojis } from './chat-composer-emojis.js';

describe('chat-composer-emojis', () => {
  afterEach(() => {
    autoSeedEnabled.value = true;
    officialEmojis.value = [];
  });

  it('bootstraps showcase emojis for local dev when the official library is empty', () => {
    const emojis = mergeQualifiedChatEmojis();

    expect(emojis.length).toBeGreaterThan(0);
    expect(emojis.some((emoji) => emoji.shortcode === 'wave')).toBe(true);
  });

  it('prefers uploaded official emojis over bootstrap seeds', () => {
    officialEmojis.value = [
      {
        id: 'official-emoji-1',
        shortcode: 'nami',
        label: 'Nami',
        imageUrl: 'data:image/png;base64,abc',
        uploadedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    const emojis = mergeQualifiedChatEmojis();

    expect(emojis).toHaveLength(1);
    expect(emojis[0]?.shortcode).toBe('nami');
  });
});