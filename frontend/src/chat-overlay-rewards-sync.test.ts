import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchChatOverlayRewardsCatalog = vi.fn();

vi.mock('./chat-overlay-rewards-api.js', () => ({
  fetchChatOverlayRewardsCatalog: (...args: unknown[]) => fetchChatOverlayRewardsCatalog(...args),
  isChatOverlayRewardsApiAvailable: () => true,
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

describe('chatOverlayRewardsSyncErrorMessage', () => {
  it('maps wallet auth errors to reconnect guidance', async () => {
    const { chatOverlayRewardsSyncErrorMessage } = await import('./chat-overlay-rewards-sync.js');

    expect(chatOverlayRewardsSyncErrorMessage('wallet_auth_unavailable')).toContain('Reconnect zkLogin');
  });

  it('maps invalid art values to re-upload guidance', async () => {
    const { chatOverlayRewardsSyncErrorMessage } = await import('./chat-overlay-rewards-sync.js');

    expect(chatOverlayRewardsSyncErrorMessage('invalid_art_value')).toContain('Re-upload');
  });
});

describe('hydrateChatOverlayRewardsFromServer', () => {
  beforeEach(() => {
    vi.resetModules();
    fetchChatOverlayRewardsCatalog.mockReset();

    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps local default presets when the server catalog is empty', async () => {
    fetchChatOverlayRewardsCatalog.mockResolvedValue({
      rewards: [],
      updatedAtMs: Date.now(),
    });

    const { hydrateChatOverlayRewardsFromServer } = await import('./chat-overlay-rewards-sync.js');
    const { readOfficialChatOverlayRewards, resetOfficialChatOverlayRewardsForTests } = await import(
      './official-chat-overlay-rewards-store.js'
    );

    resetOfficialChatOverlayRewardsForTests();
    const before = readOfficialChatOverlayRewards().map((reward) => reward.id);

    const hydrated = await hydrateChatOverlayRewardsFromServer();

    expect(hydrated).toBe(false);
    expect(readOfficialChatOverlayRewards().map((reward) => reward.id)).toEqual(before);
  });

  it('hydrates server catalog rewards when the projection is populated', async () => {
    fetchChatOverlayRewardsCatalog.mockResolvedValue({
      rewards: [
        {
          id: 'overlay-server-only',
          name: 'Server Halo',
          description: 'Seeded on the receiving server.',
          borderStyle: 'signal-glow',
          motion: 'static',
          accent: 'cyan',
          staticArtUrl: null,
          animatedArtUrl: null,
          artSliceInsets: { top: 56, right: 32, bottom: 24, left: 32 },
          displayWidths: { top: 28, right: 16, bottom: 12, left: 16 },
          condition: { type: 'verified' },
          enabled: true,
          updatedAtMs: Date.now(),
        },
      ],
      updatedAtMs: Date.now(),
    });

    const { hydrateChatOverlayRewardsFromServer } = await import('./chat-overlay-rewards-sync.js');
    const { readOfficialChatOverlayRewards, resetOfficialChatOverlayRewardsForTests } = await import(
      './official-chat-overlay-rewards-store.js'
    );

    resetOfficialChatOverlayRewardsForTests();

    const hydrated = await hydrateChatOverlayRewardsFromServer();

    expect(hydrated).toBe(true);
    expect(readOfficialChatOverlayRewards().some((reward) => reward.id === 'overlay-server-only')).toBe(
      true
    );
  });
});