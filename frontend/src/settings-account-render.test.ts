// @vitest-environment happy-dom

import { fireEvent, render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SettingsScreen } from './SettingsScreen.js';
import { NamiWalletProvider } from './wallet.js';

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>([
    ['nami.user.surface-role', 'channel-owner'],
    ['nami.viewing-as-channel-owner', 'true'],
  ]);

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

describe('SettingsScreen account section', () => {
  it('renders account tab for game channel owners without crashing', () => {
    const localStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('sessionStorage', createLocalStorageMock());
    vi.stubGlobal('window', {
      localStorage,
      sessionStorage: createLocalStorageMock(),
      location: { hash: '', pathname: '/', search: '' },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scrollTo: vi.fn(),
      setInterval: (handler: () => void) => setInterval(handler, 60_000),
      clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id),
    });

    const view = render(
      createElement(NamiWalletProvider, null, createElement(SettingsScreen)),
    );

    fireEvent.click(view.getByRole('button', { name: 'Account' }));

    expect(view.getByText('Account Sign-In')).toBeTruthy();
    expect(view.getByText('Platform Linking')).toBeTruthy();
  });
});