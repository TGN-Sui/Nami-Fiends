import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OFFICIAL_OWNER = '0xofficialowner';
const OTHER_OWNER = '0xothermember';

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

vi.mock('./nami-capabilities.js', () => ({
  isOfficialOwner: (owner: string | null) => owner?.toLowerCase() === OFFICIAL_OWNER,
}));

import {
  addNamiCustomEmoji,
  addNamiCustomEmojisBatch,
  readNamiCustomEmojis,
  removeNamiCustomEmoji,
} from './nami-custom-emojis-store.js';

const STORAGE_KEY = 'nami.owner.custom-emojis';
const TEST_IMAGE = 'data:image/png;base64,abc';

describe('nami-custom-emojis-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', { localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects emoji uploads from non-official owners', () => {
    const result = addNamiCustomEmoji({
      label: 'Wave',
      shortcode: 'wave',
      imageUrl: TEST_IMAGE,
      actorOwner: OTHER_OWNER,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.reason).toContain('Official owner');
    }

    expect(readNamiCustomEmojis()).toHaveLength(0);
  });

  it('lets the official owner upload multiple emojis', () => {
    const batch = addNamiCustomEmojisBatch({
      actorOwner: OFFICIAL_OWNER,
      items: [
        { label: 'Wave', shortcode: 'wave', imageUrl: TEST_IMAGE },
        { label: 'Fire', shortcode: 'fire', imageUrl: TEST_IMAGE },
      ],
    });

    expect(batch.errors).toHaveLength(0);
    expect(batch.uploaded).toHaveLength(2);
    expect(readNamiCustomEmojis()).toHaveLength(2);
    expect(globalThis.localStorage.getItem(STORAGE_KEY)).toContain('wave');
  });

  it('only lets the official owner remove emojis', () => {
    addNamiCustomEmoji({
      label: 'Wave',
      shortcode: 'wave',
      imageUrl: TEST_IMAGE,
      actorOwner: OFFICIAL_OWNER,
    });

    const emojiId = readNamiCustomEmojis()[0]!.id;

    expect(removeNamiCustomEmoji(emojiId, OTHER_OWNER)).toBe(false);
    expect(readNamiCustomEmojis()).toHaveLength(1);
    expect(removeNamiCustomEmoji(emojiId, OFFICIAL_OWNER)).toBe(true);
    expect(readNamiCustomEmojis()).toHaveLength(0);
  });
});