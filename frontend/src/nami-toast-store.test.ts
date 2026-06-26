import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  dismissNamiToast,
  pushNamiToast,
  readNamiToasts,
  resetNamiToastsForTests,
} from './nami-toast-store.js';

describe('nami-toast-store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetNamiToastsForTests();
  });

  afterEach(() => {
    resetNamiToastsForTests();
    vi.useRealTimers();
  });

  it('queues and dismisses toasts', () => {
    const id = pushNamiToast('Border equipped locally.', 'error');

    expect(readNamiToasts()).toEqual([
      expect.objectContaining({ id, message: 'Border equipped locally.', tone: 'error' }),
    ]);

    dismissNamiToast(id);

    expect(readNamiToasts()).toEqual([]);
  });

  it('auto-dismisses toasts after their duration', () => {
    pushNamiToast('Synced to server.', 'success', 1000);

    expect(readNamiToasts()).toHaveLength(1);

    vi.advanceTimersByTime(1000);

    expect(readNamiToasts()).toEqual([]);
  });
});