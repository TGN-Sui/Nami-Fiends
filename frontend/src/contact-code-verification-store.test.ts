import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearContactCodeVerification,
  contactFieldBlocksContinue,
  isContactVerified,
  sendContactVerificationCode,
  verifyContactCode,
} from './contact-code-verification-store.js';

vi.mock('./app-config.js', () => ({
  shouldUseDevFixtures: () => true,
}));

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

describe('contact-code-verification-store', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    clearContactCodeVerification();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('blocks continue when contact text is present but unverified', () => {
    expect(contactFieldBlocksContinue('', false)).toBe(false);
    expect(contactFieldBlocksContinue('+1 555 0100', false)).toBe(true);
    expect(contactFieldBlocksContinue('+1 555 0100', true)).toBe(false);
  });

  it('verifies email after sending and entering the dev code', () => {
    const sendResult = sendContactVerificationCode('email', 'Studio@Example.com');

    expect(sendResult.ok).toBe(true);

    const badVerify = verifyContactCode('email', 'studio@example.com', '000000');
    expect(badVerify.ok).toBe(false);

    const verifyResult = verifyContactCode('email', 'studio@example.com', '123456');
    expect(verifyResult.ok).toBe(true);
    expect(isContactVerified('email', 'studio@example.com')).toBe(true);
  });

  it('verifies phone after sending and entering the dev code', () => {
    const sendResult = sendContactVerificationCode('phone', '+1 555 0100');

    expect(sendResult.ok).toBe(true);

    const verifyResult = verifyContactCode('phone', '+1 555 0100', '123456');
    expect(verifyResult.ok).toBe(true);
    expect(isContactVerified('phone', '+1 555 0100')).toBe(true);
  });
});