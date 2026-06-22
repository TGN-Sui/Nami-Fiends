import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('sidebar-vertical-collapse-store', () => {
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

  it('persists vertical collapse preference', async () => {
    const {
      readSidebarVerticallyCollapsed,
      resetSidebarVerticalCollapseStoreForTests,
      saveSidebarVerticallyCollapsed,
      toggleSidebarVerticallyCollapsed,
    } = await import('./sidebar-vertical-collapse-store.js');

    resetSidebarVerticalCollapseStoreForTests();
    expect(readSidebarVerticallyCollapsed()).toBe(false);

    saveSidebarVerticallyCollapsed(true);
    expect(readSidebarVerticallyCollapsed()).toBe(true);

    expect(toggleSidebarVerticallyCollapsed()).toBe(false);
    expect(readSidebarVerticallyCollapsed()).toBe(false);
  });
});