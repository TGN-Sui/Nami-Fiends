import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { NamiChannel } from './domain/types.js';

function createChannel(id: string, handle: string): NamiChannel {
  return {
    id,
    surfaceType: 'game',
    name: id,
    handle,
    owner: 'Studio',
    developerId: 'dev-' + id,
    developerName: 'Studio',
    developerLogoSeed: 'ST',
    coverArtSeed: id,
    coverArtStyle: 'neon',
    verifiedGame: true,
    genre: 'Indie',
    platforms: ['PC'],
    subscribers: 10,
    verified: true,
    partner: false,
    signal: 'Green',
    tagline: 'Tagline',
    banner: 'Banner',
    theme: 'blue',
    modules: [],
    officialBadges: [],
    customBadges: [],
    verifiedLinks: [],
    announcements: [],
  };
}

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

describe('bubble-discovery-entries', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('returns one bubble per unique channel sorted by weekly boost power', async () => {
    const { boostChannel } = await import('./channel-boost-store.js');
    const { buildGameBubbleDiscoveryEntries } = await import('./bubble-discovery-entries.js');

    const alpha = createChannel('alpha', '@alpha');
    const beta = createChannel('beta', '@beta');
    const adventurer = {
      id: 'm1',
      surfaceType: 'member' as const,
      name: 'Tester',
      avatarSeed: 'TE',
      signal: 'Green' as const,
      tier: 'Adventurer' as const,
      badge: 'Builder',
    };

    boostChannel('beta', adventurer);
    boostChannel('beta', adventurer);
    boostChannel('beta', adventurer);
    boostChannel('alpha', adventurer);

    const entries = buildGameBubbleDiscoveryEntries([alpha, beta, alpha, beta], 10);

    expect(entries).toHaveLength(2);
    expect(entries[0]?.channel.id).toBe('beta');
    expect(entries[0]?.weeklyScale).toBeGreaterThan(entries[1]?.weeklyScale ?? 0);
  });

  it('prefers indexed discovery scores over local boost power when provided', async () => {
    const { boostChannel } = await import('./channel-boost-store.js');
    const { buildGameBubbleDiscoveryEntries } = await import('./bubble-discovery-entries.js');

    const alpha = createChannel('alpha', '@alpha');
    const beta = createChannel('beta', '@beta');
    const adventurer = {
      id: 'm1',
      surfaceType: 'member' as const,
      name: 'Tester',
      avatarSeed: 'TE',
      signal: 'Green' as const,
      tier: 'Adventurer' as const,
      badge: 'Builder',
    };

    boostChannel('beta', adventurer);
    boostChannel('beta', adventurer);
    boostChannel('beta', adventurer);

    const entries = buildGameBubbleDiscoveryEntries(
      [alpha, beta],
      10,
      new Map([
        ['alpha', 500],
        ['beta', 120],
      ]),
    );

    expect(entries[0]?.channel.id).toBe('alpha');
  });
});