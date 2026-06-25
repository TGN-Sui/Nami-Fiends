import { beforeEach, describe, expect, it, vi } from 'vitest';

function createSessionStorageMock(): Storage {
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

import {
  consumeSettingsNavFocus,
  requestOwnerAdvancedTab,
  requestSettingsNav,
  settingsNavLabel,
} from './settings-navigation.js';

describe('settings-navigation', () => {
  beforeEach(() => {
    const sessionStorage = createSessionStorageMock();

    vi.stubGlobal('sessionStorage', sessionStorage);
    vi.stubGlobal('window', { sessionStorage });
  });

  it('maps border art deep links to a flat nav id', () => {
    requestOwnerAdvancedTab('borders');

    expect(consumeSettingsNavFocus()).toBe('owner-border-art');
  });

  it('labels border art for sidebar display', () => {
    expect(settingsNavLabel('owner-border-art')).toBe('Border Art');
  });

  it('persists explicit nav focus', () => {
    requestSettingsNav('owner-emojis');

    expect(consumeSettingsNavFocus()).toBe('owner-emojis');
  });
});