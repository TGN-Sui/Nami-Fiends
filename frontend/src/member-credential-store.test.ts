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

describe('member-credential-store', () => {
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
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('rejects short passwords', async () => {
    const { validatePasswordSetup } = await import('./member-credential-store.js');

    expect(validatePasswordSetup('short', 'short').ok).toBe(false);
  });

  it('stores and verifies signup passwords', async () => {
    const {
      memberHasPasswordCredential,
      saveMemberPasswordCredential,
      verifyMemberPasswordCredential,
    } = await import('./member-credential-store.js');

    saveMemberPasswordCredential('river@example.com', 'secure-pass');

    expect(memberHasPasswordCredential('river@example.com')).toBe(true);
    expect(verifyMemberPasswordCredential('river@example.com', 'secure-pass')).toBe(true);
    expect(verifyMemberPasswordCredential('river@example.com', 'wrong-pass')).toBe(false);
  });
});