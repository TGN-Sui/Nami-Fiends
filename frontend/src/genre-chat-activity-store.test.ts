import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('genre-chat-activity-store', () => {
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

  it('tracks unique weekly chatters per genre lounge', async () => {
    const { recordGenreWeeklyChatter, getGenreWeeklyActiveChatters } = await import(
      './genre-chat-activity-store.js'
    );
    const weekId = 1_700_000_000_000;

    recordGenreWeeklyChatter('genre-shooter', 'm1', weekId);
    recordGenreWeeklyChatter('genre-shooter', 'm2', weekId);
    recordGenreWeeklyChatter('genre-shooter', 'm1', weekId);

    expect(getGenreWeeklyActiveChatters('genre-shooter', weekId)).toBe(2);
  });

  it('resets chatter counts when the discovery week changes', async () => {
    const { recordGenreWeeklyChatter, getGenreWeeklyActiveChatters } = await import(
      './genre-chat-activity-store.js'
    );

    recordGenreWeeklyChatter('genre-moba', 'm1', 100);
    recordGenreWeeklyChatter('genre-moba', 'm2', 200);

    expect(getGenreWeeklyActiveChatters('genre-moba', 100)).toBe(1);
    expect(getGenreWeeklyActiveChatters('genre-moba', 200)).toBe(1);
  });
});