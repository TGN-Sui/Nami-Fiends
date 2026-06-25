// @vitest-environment happy-dom

import { cleanup, fireEvent, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

function renderSettingsScreen(): ReturnType<typeof render> {
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

  return render(createElement(NamiWalletProvider, null, createElement(SettingsScreen)));
}

describe('SettingsScreen account section', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the v2 settings shell without owner-only Border Art for members', () => {
    const view = renderSettingsScreen();

    expect(view.container.querySelector('[data-settings-shell="v2"]')).toBeTruthy();
    expect(view.getByText('Member mode')).toBeTruthy();
    expect(view.queryByRole('button', { name: /Border Art/i })).toBeNull();
  });

  it('renders account tab for game channel owners without crashing', () => {
    const view = renderSettingsScreen();

    fireEvent.click(
      view.getByRole('button', { name: /Account Sign-in, passport, profile, platforms/i })
    );

    expect(view.getByText('Account Sign-In')).toBeTruthy();
    expect(view.getByText('Platform Linking')).toBeTruthy();
  });
});