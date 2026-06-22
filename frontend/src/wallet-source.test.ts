import { beforeEach, describe, expect, it, vi } from 'vitest';

let testLaunch = false;

vi.mock('./app-config.js', () => ({
  isTestLaunchMode: () => testLaunch,
}));

import { resolveTrustWalletSource } from './wallet-source.js';

describe('wallet-source', () => {
  beforeEach(() => {
    testLaunch = false;
  });

  it('blocks demo wallet source during test launch', () => {
    testLaunch = true;

    expect(resolveTrustWalletSource('demo', true)).toBeNull();
    expect(resolveTrustWalletSource('zklogin', true)).toBe('zklogin');
  });

  it('allows demo fallback in dev fixture mode', () => {
    testLaunch = false;

    expect(resolveTrustWalletSource(null, true)).toBe('demo');
  });
});