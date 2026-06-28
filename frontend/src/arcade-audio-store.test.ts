import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  readArcadeAudioPreferences,
  resetArcadeAudioPreferencesForTests,
  setArcadeAudioMuted,
  setArcadeAudioVolume,
  toggleArcadeAudioMuted,
} from './arcade-audio-store.js';

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

describe('arcade-audio-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetArcadeAudioPreferencesForTests();
  });

  afterEach(() => {
    resetArcadeAudioPreferencesForTests();
    vi.unstubAllGlobals();
  });

  it('starts with default volume and unmuted state', () => {
    expect(readArcadeAudioPreferences()).toEqual({
      volume: 0.72,
      muted: false,
    });
  });

  it('persists volume changes and unmutes when adjusting the slider', () => {
    setArcadeAudioMuted(true);
    setArcadeAudioVolume(0.4);

    expect(readArcadeAudioPreferences()).toEqual({
      volume: 0.4,
      muted: false,
    });
  });

  it('toggles mute without changing the stored volume', () => {
    setArcadeAudioVolume(0.55);
    expect(toggleArcadeAudioMuted()).toBe(true);
    expect(readArcadeAudioPreferences()).toEqual({
      volume: 0.55,
      muted: true,
    });
    expect(toggleArcadeAudioMuted()).toBe(false);
    expect(readArcadeAudioPreferences().volume).toBe(0.55);
  });
});