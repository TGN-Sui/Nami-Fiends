// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const playHubSuperBannerQueue = vi.hoisted(() => vi.fn(async () => undefined));
const playTutorialIfPending = vi.hoisted(() => vi.fn(async () => false));
const consumeTutorialReplaySkipBanners = vi.hoisted(() => vi.fn(() => false));

vi.mock('./hub-super-banner-queue.js', () => ({
  playHubSuperBannerQueue,
}));

vi.mock('./tutorial-queue.js', () => ({
  consumeTutorialReplaySkipBanners,
  playTutorialIfPending,
}));

describe('playHubEntrySequence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeTutorialReplaySkipBanners.mockReturnValue(false);
    vi.resetModules();
  });

  it('plays super banners then tutorial on a normal hub entry', async () => {
    const { playHubEntrySequence } = await import('./hub-entry-orchestrator.js');

    await playHubEntrySequence('0xabc');

    expect(playHubSuperBannerQueue).toHaveBeenCalledWith('0xabc');
    expect(playTutorialIfPending).toHaveBeenCalledWith('0xabc');
  });

  it('reuses the in-flight sequence for concurrent hub entries', async () => {
    let resolveQueue!: () => void;
    const queueGate = new Promise<void>((resolve) => {
      resolveQueue = resolve;
    });

    playHubSuperBannerQueue.mockImplementationOnce(async () => queueGate);

    const { playHubEntrySequence } = await import('./hub-entry-orchestrator.js');

    const first = playHubEntrySequence('0xabc');
    const second = playHubEntrySequence('0xabc');

    resolveQueue();

    await Promise.all([first, second]);

    expect(playHubSuperBannerQueue).toHaveBeenCalledTimes(1);
    expect(playTutorialIfPending).toHaveBeenCalledTimes(1);
  });

  it('skips super banners but still plays tutorial after settings replay', async () => {
    consumeTutorialReplaySkipBanners.mockReturnValue(true);

    const { playHubEntrySequence } = await import('./hub-entry-orchestrator.js');

    await playHubEntrySequence('0xabc');

    expect(playHubSuperBannerQueue).not.toHaveBeenCalled();
    expect(playTutorialIfPending).toHaveBeenCalledWith('0xabc');
  });
});