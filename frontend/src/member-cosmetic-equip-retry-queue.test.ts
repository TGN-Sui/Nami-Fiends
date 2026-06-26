import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const syncEquippedChatOverlayToServer = vi.fn();

vi.mock('./member-cosmetic-equips-store.js', () => ({
  syncEquippedChatOverlayToServer: (...args: unknown[]) => syncEquippedChatOverlayToServer(...args),
}));

const pushNamiToast = vi.fn();

vi.mock('./nami-toast-store.js', () => ({
  pushNamiToast: (...args: unknown[]) => pushNamiToast(...args),
}));

describe('member-cosmetic-equip-retry-queue', () => {
  beforeEach(() => {
    vi.resetModules();
    syncEquippedChatOverlayToServer.mockReset();
    pushNamiToast.mockReset();
    vi.useFakeTimers();
  });

  afterEach(async () => {
    const queue = await import('./member-cosmetic-equip-retry-queue.js');
    queue.resetEquippedChatOverlayRetryQueueForTests();
    vi.useRealTimers();
  });

  it('retries failed equip syncs with backoff', async () => {
    const startedAt = Date.parse('2026-06-25T12:00:00.000Z');
    vi.setSystemTime(startedAt);

    syncEquippedChatOverlayToServer
      .mockResolvedValueOnce({ ok: false, error: 'request_failed' })
      .mockResolvedValueOnce({ ok: true });

    const queue = await import('./member-cosmetic-equip-retry-queue.js');

    queue.enqueueEquippedChatOverlaySync('m1', 'overlay-wave-frame', '0xabc');

    await queue.processEquippedChatOverlaySyncQueue();

    expect(syncEquippedChatOverlayToServer).toHaveBeenCalledTimes(1);
    expect(pushNamiToast).toHaveBeenCalledWith(
      expect.stringContaining('keep retrying'),
      'error'
    );

    vi.setSystemTime(startedAt + 6000);

    await queue.processEquippedChatOverlaySyncQueue();

    expect(syncEquippedChatOverlayToServer).toHaveBeenCalledTimes(2);
    expect(pushNamiToast).toHaveBeenCalledWith(
      'Chat border equip synced to the server.',
      'success'
    );
    expect(queue.readPendingEquippedChatOverlaySync()).toBeNull();
  });

  it('shows a local-only toast when no wallet owner is available', async () => {
    syncEquippedChatOverlayToServer.mockResolvedValueOnce({ ok: false, error: 'no_owner' });

    const queue = await import('./member-cosmetic-equip-retry-queue.js');

    queue.enqueueEquippedChatOverlaySync('m1', 'overlay-wave-frame', null);
    await queue.processEquippedChatOverlaySyncQueue();

    expect(pushNamiToast).toHaveBeenCalledWith(
      expect.stringContaining('Connect your wallet'),
      'error'
    );
    expect(queue.readPendingEquippedChatOverlaySync()).toBeNull();
  });
});