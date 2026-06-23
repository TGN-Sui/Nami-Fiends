import { afterEach, describe, expect, it, vi } from 'vitest';

const fetchSharedGlobalChatMessages = vi.fn(async () => []);
const postSharedGlobalChatMessage = vi.fn(async () => null);

vi.mock('./global-chat-messages-api.js', () => ({
  isGlobalChatMessagesApiAvailable: () => true,
  fetchSharedGlobalChatMessages: (...args: unknown[]) => fetchSharedGlobalChatMessages(...args),
  postSharedGlobalChatMessage: (...args: unknown[]) => postSharedGlobalChatMessage(...args),
}));

describe('global-chat-messages-sync', () => {
  afterEach(() => {
    vi.resetModules();
    fetchSharedGlobalChatMessages.mockReset();
    postSharedGlobalChatMessage.mockReset();
  });

  it('merges fetched shared messages by id', async () => {
    fetchSharedGlobalChatMessages.mockResolvedValueOnce([
      {
        id: 'gc-1',
        roomId: 'official-nami-global',
        author: 'Tester',
        body: 'Hello testnet',
        time: '12:01',
        signal: 'Green',
        createdAtMs: 1000,
      },
    ]);

    const { refreshSharedGlobalChatMessages, readSharedGlobalChatMessages } = await import(
      './global-chat-messages-sync.js'
    );

    await refreshSharedGlobalChatMessages('official-nami-global');

    expect(readSharedGlobalChatMessages('official-nami-global')).toEqual([
      expect.objectContaining({ id: 'gc-1', body: 'Hello testnet' }),
    ]);
  });
});