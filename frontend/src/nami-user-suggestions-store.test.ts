import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  countPendingUserSuggestions,
  resetUserSuggestionsStoreForTests,
  submitUserSuggestion,
  updateUserSuggestionStatus,
} from './nami-user-suggestions-store.js';

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

describe('nami-user-suggestions-store', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetUserSuggestionsStoreForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects suggestions shorter than 10 characters', () => {
    const result = submitUserSuggestion('too short');

    expect(result.ok).toBe(false);
  });

  it('stores suggestions for Nami Officials review', () => {
    const result = submitUserSuggestion('Please add a compact mode for genre chats.');

    expect(result.ok).toBe(true);
    expect(countPendingUserSuggestions()).toBe(1);
  });

  it('updates suggestion status for officials', () => {
    const result = submitUserSuggestion('Please add a compact mode for genre chats.');

    if (!result.ok) {
      throw new Error('Expected suggestion submission to succeed.');
    }

    const updated = updateUserSuggestionStatus(result.suggestion.id, 'reviewed', 'nami-official');

    expect(updated?.status).toBe('reviewed');
    expect(countPendingUserSuggestions()).toBe(0);
  });
});