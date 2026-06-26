import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const syncEquippedChatOverlayToServer = vi.fn();

vi.mock('./member-cosmetic-equips-store.js', () => ({
  syncEquippedChatOverlayToServer: (...args: unknown[]) => syncEquippedChatOverlayToServer(...args),
  readMemberCosmeticEquipSyncOwner: () => null,
  readEquippedChatOverlayIdForMember: () => '',
}));

const pushNamiToast = vi.fn();
const isEquipSyncAuthReady = vi.fn(() => true);

vi.mock('./nami-toast-store.js', () => ({
  pushNamiToast: (...args: unknown[]) => pushNamiToast(...args),
}));

vi.mock('./wallet-auth.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./wallet-auth.js')>();

  return {
    ...actual,
    isEquipSyncAuthReady: (...args: unknown[]) => isEquipSyncAuthReady(...args),
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

describe('member-cosmetic-equip-retry-queue', () => {
  beforeEach(() => {
    vi.resetModules();
    syncEquippedChatOverlayToServer.mockReset();
    pushNamiToast.mockReset();
    isEquipSyncAuthReady.mockReset();
    isEquipSyncAuthReady.mockReturnValue(true);
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

  it('keeps retrying when no wallet owner is available yet', async () => {
    syncEquippedChatOverlayToServer.mockResolvedValue({ ok: false, error: 'no_owner' });

    const queue = await import('./member-cosmetic-equip-retry-queue.js');

    queue.enqueueEquippedChatOverlaySync('m1', 'overlay-wave-frame', null);
    await queue.processEquippedChatOverlaySyncQueue();

    expect(pushNamiToast).toHaveBeenCalledWith(
      expect.stringContaining('Connect your wallet'),
      'error'
    );
    expect(queue.readPendingEquippedChatOverlaySync()).not.toBeNull();
  });

  it('retries immediately after a wallet owner becomes available', async () => {
    syncEquippedChatOverlayToServer
      .mockResolvedValueOnce({ ok: false, error: 'no_owner' })
      .mockResolvedValueOnce({ ok: true });

    const queue = await import('./member-cosmetic-equip-retry-queue.js');

    queue.enqueueEquippedChatOverlaySync('m1', 'overlay-wave-frame', null);
    await queue.processEquippedChatOverlaySyncQueue();

    queue.refreshEquippedChatOverlaySyncOwner('0xabc');
    await queue.processEquippedChatOverlaySyncQueue();

    expect(syncEquippedChatOverlayToServer).toHaveBeenCalledTimes(2);
    expect(syncEquippedChatOverlayToServer.mock.calls[1]?.[2]).toBe('0xabc');
    expect(queue.readPendingEquippedChatOverlaySync()).toBeNull();
  });

  it('suppresses error toasts for background equip sync on sign-in', async () => {
    syncEquippedChatOverlayToServer.mockResolvedValue({ ok: false, error: 'wallet_auth_unavailable' });

    const queue = await import('./member-cosmetic-equip-retry-queue.js');

    queue.enqueueEquippedChatOverlaySync('m1', 'overlay-wave-frame', '0xabc', {
      userInitiated: false,
    });
    await queue.processEquippedChatOverlaySyncQueue();

    expect(syncEquippedChatOverlayToServer).toHaveBeenCalledTimes(1);
    expect(pushNamiToast).not.toHaveBeenCalled();
    expect(queue.readPendingEquippedChatOverlaySync()?.userInitiated).toBe(false);
  });

  it('defers sync until wallet auth is ready without showing a toast', async () => {
    const startedAt = Date.parse('2026-06-25T12:00:00.000Z');
    vi.setSystemTime(startedAt);

    isEquipSyncAuthReady.mockReturnValue(false);
    syncEquippedChatOverlayToServer.mockResolvedValue({ ok: true });

    const queue = await import('./member-cosmetic-equip-retry-queue.js');

    queue.enqueueEquippedChatOverlaySync('m1', 'overlay-wave-frame', '0xabc', {
      userInitiated: false,
    });
    await queue.processEquippedChatOverlaySyncQueue();

    expect(syncEquippedChatOverlayToServer).not.toHaveBeenCalled();
    expect(pushNamiToast).not.toHaveBeenCalled();

    isEquipSyncAuthReady.mockReturnValue(true);
    vi.setSystemTime(startedAt + 500);

    await queue.processEquippedChatOverlaySyncQueue();

    expect(syncEquippedChatOverlayToServer).toHaveBeenCalledTimes(1);
    expect(queue.readPendingEquippedChatOverlaySync()).toBeNull();
  });

  it('retries after auth becomes ready and clears prior user-initiated flag on owner refresh', async () => {
    syncEquippedChatOverlayToServer
      .mockResolvedValueOnce({ ok: false, error: 'wallet_auth_unavailable' })
      .mockResolvedValueOnce({ ok: true });

    const queue = await import('./member-cosmetic-equip-retry-queue.js');

    queue.enqueueEquippedChatOverlaySync('m1', 'overlay-wave-frame', '0xabc');
    await queue.processEquippedChatOverlaySyncQueue();

    expect(pushNamiToast).toHaveBeenCalledTimes(1);

    pushNamiToast.mockClear();
    queue.refreshEquippedChatOverlaySyncOwner('0xabc');
    queue.notifyEquipSyncAuthReady();
    await queue.processEquippedChatOverlaySyncQueue();

    expect(pushNamiToast).not.toHaveBeenCalled();
    expect(syncEquippedChatOverlayToServer).toHaveBeenCalledTimes(2);
    expect(queue.readPendingEquippedChatOverlaySync()).toBeNull();
  });
});