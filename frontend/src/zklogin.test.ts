import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./nami.js', () => ({
  getConfiguredNetwork: () => 'testnet',
}));

vi.mock('./zklogin-config.js', () => ({
  readZkLoginEnvConfig: () => ({
    clientId: 'test-client-id',
    redirectUrl: 'http://localhost:5173/',
    saltUrl: 'https://salt.api.mystenlabs.com/get_salt',
  }),
}));

import {
  clearZkLoginSession,
  getZkLoginSession,
  isZkLoginSessionSignable,
  reconcileZkLoginSessionOnLoad,
  type ZkLoginSession,
} from './zklogin.js';

const SESSION_KEY = 'nami.zklogin.session';

function createStorageMock(): Storage {
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

function saveSession(session: Partial<ZkLoginSession>): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

describe('zklogin session helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createStorageMock(),
      sessionStorage: createStorageMock(),
      location: {
        hash: '',
        origin: 'http://localhost:5173',
        pathname: '/',
        search: '',
      },
      history: {
        replaceState: vi.fn(),
      },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    clearZkLoginSession();
  });

  afterEach(() => {
    clearZkLoginSession();
    vi.unstubAllGlobals();
  });

  it('treats sessions without an ephemeral key as not signable', () => {
    saveSession({
      address: '0xabc123',
      maxEpoch: 99,
      provider: 'google',
      createdAtMs: Date.now(),
    });

    expect(isZkLoginSessionSignable()).toBe(false);
  });

  it('clears incomplete sessions on load reconciliation', () => {
    saveSession({
      address: '0xabc123',
      maxEpoch: 99,
      provider: 'google',
      createdAtMs: Date.now(),
    });

    expect(reconcileZkLoginSessionOnLoad()).toBeNull();
    expect(getZkLoginSession()).toBeNull();
  });

  it('keeps signable sessions during reconciliation', () => {
    const session: ZkLoginSession = {
      address: '0xabc123',
      maxEpoch: 99,
      provider: 'google',
      createdAtMs: Date.now(),
      ephemeralSecretKey: 'ephemeral-secret',
    };

    saveSession(session);

    expect(reconcileZkLoginSessionOnLoad()).toEqual(session);
    expect(getZkLoginSession()).toEqual(session);
  });
});