import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../app-config.js', () => ({
  shouldUseTestLaunchLoungeMocks: () => {
    const testLaunch = import.meta.env.VITE_NAMI_TEST_LAUNCH;

    if (testLaunch === undefined || testLaunch === '' || testLaunch.toLowerCase() === 'false' || testLaunch === '0') {
      return false;
    }

    const loungeMocks = import.meta.env.VITE_NAMI_LOUNGE_LAYOUT_MOCKS;

    if (loungeMocks === undefined || loungeMocks === '') {
      return true;
    }

    return loungeMocks.toLowerCase() === 'true' || loungeMocks === '1';
  },
}));

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

describe('test-launch-lounge-mocks', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(() => true),
    });
    vi.stubEnv('VITE_NAMI_TEST_LAUNCH', 'true');
    vi.stubEnv('VITE_NAMI_LOUNGE_LAYOUT_MOCKS', 'true');
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('exposes a varied mock roster for lounge layout QA', async () => {
    const { testLaunchLoungeMockMembers } = await import('./test-launch-lounge-mocks.js');
    const roster = testLaunchLoungeMockMembers();

    expect(roster.length).toBeGreaterThanOrEqual(12);
    expect(new Set(roster.map((member) => member.tier)).size).toBeGreaterThan(1);
    expect(new Set(roster.map((member) => member.signal)).size).toBeGreaterThan(1);
  });

  it('bootstraps live streamers and twitch embeds once', async () => {
    const { bootstrapTestLaunchLoungeMocks, resetTestLaunchLoungeMocksForTests } = await import(
      './test-launch-lounge-mocks.js'
    );

    resetTestLaunchLoungeMocksForTests();
    bootstrapTestLaunchLoungeMocks();
    bootstrapTestLaunchLoungeMocks();

    const streaming = JSON.parse(window.localStorage.getItem('nami.member.streaming-online') ?? '{}') as Record<
      string,
      boolean
    >;

    expect(streaming.m8).toBe(true);
    expect(streaming.m16).toBe(true);
    expect(window.localStorage.getItem('nami.test-launch.lounge-mocks-v3')).toBe('done');
    expect(window.localStorage.getItem('nami.embedded-feed.links.member.m8')).toContain('twitch.tv/');
  });
});