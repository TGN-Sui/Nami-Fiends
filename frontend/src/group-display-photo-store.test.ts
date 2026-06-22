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

describe('group-display-photo-store', () => {
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
    vi.unstubAllGlobals();
  });

  it('saves and resolves guild display photos by id', async () => {
    const {
      clearGroupDisplayPhoto,
      readGroupDisplayPhoto,
      resolveGroupDisplayPhotoUrl,
      saveGroupDisplayPhoto,
    } = await import('./group-display-photo-store.js');

    expect(resolveGroupDisplayPhotoUrl('guild', 'guild-test')).toBeUndefined();

    saveGroupDisplayPhoto('guild', 'guild-test', 'data:image/png;base64,abc');

    expect(readGroupDisplayPhoto('guild', 'guild-test')).toBe('data:image/png;base64,abc');
    expect(resolveGroupDisplayPhotoUrl('guild', 'guild-test')).toBe('data:image/png;base64,abc');

    clearGroupDisplayPhoto('guild', 'guild-test');

    expect(resolveGroupDisplayPhotoUrl('guild', 'guild-test')).toBeUndefined();
  });

  it('keeps squad photos separate from guild photos', async () => {
    const { resolveGroupDisplayPhotoUrl, saveGroupDisplayPhoto } = await import(
      './group-display-photo-store.js'
    );

    saveGroupDisplayPhoto('guild', 'group-1', 'data:image/png;base64,guild');
    saveGroupDisplayPhoto('squad', 'group-1', 'data:image/png;base64,squad');

    expect(resolveGroupDisplayPhotoUrl('guild', 'group-1')).toBe('data:image/png;base64,guild');
    expect(resolveGroupDisplayPhotoUrl('squad', 'group-1')).toBe('data:image/png;base64,squad');
  });
});