import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const syncChatOverlayRewardsToServer = vi.fn();

vi.mock('./chat-overlay-rewards-sync.js', () => ({
  syncChatOverlayRewardsToServer: (...args: unknown[]) => syncChatOverlayRewardsToServer(...args),
  chatOverlayRewardsSyncErrorMessage: (error: string) => 'sync failed: ' + error,
}));

vi.mock('./chat-overlay-rewards-api.js', () => ({
  isChatOverlayRewardsApiAvailable: () => true,
}));

const pushNamiToast = vi.fn();

vi.mock('./nami-toast-store.js', () => ({
  pushNamiToast: (...args: unknown[]) => pushNamiToast(...args),
}));

vi.mock('./wallet-auth.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./wallet-auth.js')>();

  return {
    ...actual,
    hasWalletAuthSigner: () => true,
    readWalletAuthOwner: () => '0xabc',
  };
});

vi.mock('./protocol-env.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./protocol-env.js')>();

  return {
    ...actual,
    readWalletAuthRequired: () => true,
  };
});

vi.mock('./protocol-owner-resolve.js', () => ({
  readResolvedProtocolOwner: () => null,
}));

const sampleReward = {
  id: 'overlay-signal-glow',
  name: 'Signal Glow',
  description: 'Verified members earn a soft cyan glow on chat bubbles.',
  borderStyle: 'signal-glow' as const,
  motion: 'static' as const,
  accent: 'cyan' as const,
  staticArtUrl: null,
  animatedArtUrl: null,
  artSliceInsets: { top: 56, right: 32, bottom: 24, left: 32 },
  displayWidths: { top: 28, right: 16, bottom: 12, left: 16 },
  condition: { type: 'verified' as const },
  enabled: true,
  updatedAtMs: 1,
};

describe('chat-overlay-rewards-retry-queue', () => {
  beforeEach(() => {
    vi.resetModules();
    syncChatOverlayRewardsToServer.mockReset();
    pushNamiToast.mockReset();
    vi.useFakeTimers();
  });

  afterEach(async () => {
    const queue = await import('./chat-overlay-rewards-retry-queue.js');
    queue.resetChatOverlayCatalogRetryQueueForTests();
    vi.useRealTimers();
  });

  it('retries failed catalog syncs with backoff', async () => {
    const startedAt = Date.parse('2026-06-25T12:00:00.000Z');
    vi.setSystemTime(startedAt);

    syncChatOverlayRewardsToServer
      .mockResolvedValueOnce({ ok: false, error: 'request_failed' })
      .mockResolvedValueOnce({ ok: true, rewards: [sampleReward] });

    const queue = await import('./chat-overlay-rewards-retry-queue.js');

    queue.enqueueChatOverlayCatalogSync([sampleReward], '0xabc');
    await queue.processChatOverlayCatalogSyncQueue();

    expect(syncChatOverlayRewardsToServer).toHaveBeenCalledTimes(1);
    expect(pushNamiToast).toHaveBeenCalledWith('sync failed: request_failed', 'error');
    expect(queue.readPendingChatOverlayCatalogSync()?.attempts).toBe(1);

    vi.setSystemTime(startedAt + 6000);
    await queue.processChatOverlayCatalogSyncQueue();

    expect(syncChatOverlayRewardsToServer).toHaveBeenCalledTimes(2);
    expect(queue.readPendingChatOverlayCatalogSync()).toBeNull();
    expect(pushNamiToast).toHaveBeenCalledWith('Border art catalog synced to the server.', 'success');
  });

  it('does not retry official-owner validation failures', async () => {
    syncChatOverlayRewardsToServer.mockResolvedValue({ ok: false, error: 'official_owner_required' });

    const queue = await import('./chat-overlay-rewards-retry-queue.js');

    queue.enqueueChatOverlayCatalogSync([sampleReward], '0xabc');
    await queue.processChatOverlayCatalogSyncQueue();
    await vi.advanceTimersByTimeAsync(60_000);
    await queue.processChatOverlayCatalogSyncQueue();

    expect(syncChatOverlayRewardsToServer).toHaveBeenCalledTimes(1);
    expect(queue.readPendingChatOverlayCatalogSync()).toBeNull();
  });
});