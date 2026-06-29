import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  canSendPoke,
  readPokeReceivedCount,
  sendPoke,
} from './chat-poke-store.js';

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
      return store.get(key) ?? null;
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

describe('chat poke store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('increments lifetime received counter for the target', () => {
    const result = sendPoke('m1', 'm2');

    expect(result.ok).toBe(true);
    expect(readPokeReceivedCount('m2')).toBe(1);
    expect(readPokeReceivedCount('m1')).toBe(0);
  });

  it('blocks repeat pokes until the receiver pokes back', () => {
    sendPoke('m1', 'm2');

    expect(canSendPoke('m1', 'm2')).toBe(false);

    const blocked = sendPoke('m1', 'm2');

    expect(blocked.ok).toBe(false);
    expect(readPokeReceivedCount('m2')).toBe(1);
  });

  it('reopens the poke lane after the receiver pokes back', () => {
    sendPoke('m1', 'm2');
    sendPoke('m2', 'm1');

    expect(canSendPoke('m1', 'm2')).toBe(true);
    expect(readPokeReceivedCount('m1')).toBe(1);
    expect(readPokeReceivedCount('m2')).toBe(1);
  });
});