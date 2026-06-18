import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  canPromptWalletSignature,
  createWalletAuthPayload,
  registerWalletAuthSigner,
  resetWalletAuthStateForTests,
  setWalletAuthContext,
} from './wallet-auth.js';

const TEST_OWNER = '0xabc123';

vi.mock('./protocol-env.js', () => ({
  readWalletAuthRequired: vi.fn(() => true),
}));

import { readWalletAuthRequired } from './protocol-env.js';

const readWalletAuthRequiredMock = vi.mocked(readWalletAuthRequired);

function setVerifiedWalletContext(owner: string = TEST_OWNER): void {
  setWalletAuthContext({
    owner,
    source: 'wallet',
    memberVerified: true,
  });
}

describe('wallet-auth', () => {
  beforeEach(() => {
    resetWalletAuthStateForTests();
    readWalletAuthRequiredMock.mockReturnValue(true);
  });

  afterEach(() => {
    resetWalletAuthStateForTests();
    vi.clearAllMocks();
  });

  it('never prompts when wallet auth is not required', async () => {
    readWalletAuthRequiredMock.mockReturnValue(false);
    const signer = vi.fn(async () => ({
      signature: 'sig',
      timestampMs: Date.now(),
    }));

    registerWalletAuthSigner(signer);
    setVerifiedWalletContext();

    const payload = await createWalletAuthPayload(TEST_OWNER);

    expect(payload).toBeNull();
    expect(signer).not.toHaveBeenCalled();
    expect(canPromptWalletSignature(TEST_OWNER)).toBe(false);
  });

  it('never prompts for demo owners without a connected wallet', async () => {
    const signer = vi.fn(async () => ({
      signature: 'sig',
      timestampMs: Date.now(),
    }));

    registerWalletAuthSigner(signer);
    setWalletAuthContext({
      owner: TEST_OWNER,
      source: 'demo',
      memberVerified: true,
    });

    const payload = await createWalletAuthPayload(TEST_OWNER);

    expect(payload).toBeNull();
    expect(signer).not.toHaveBeenCalled();
    expect(canPromptWalletSignature(TEST_OWNER)).toBe(false);
  });

  it('never prompts when no wallet owner is connected', async () => {
    const signer = vi.fn(async () => ({
      signature: 'sig',
      timestampMs: Date.now(),
    }));

    registerWalletAuthSigner(signer);
    setWalletAuthContext({
      owner: null,
      source: null,
      memberVerified: false,
    });

    const payload = await createWalletAuthPayload(TEST_OWNER);

    expect(payload).toBeNull();
    expect(signer).not.toHaveBeenCalled();
    expect(canPromptWalletSignature(TEST_OWNER)).toBe(false);
  });

  it('never prompts for unverified members even with a connected wallet', async () => {
    const signer = vi.fn(async () => ({
      signature: 'sig',
      timestampMs: Date.now(),
    }));

    registerWalletAuthSigner(signer);
    setWalletAuthContext({
      owner: TEST_OWNER,
      source: 'wallet',
      memberVerified: false,
    });

    const payload = await createWalletAuthPayload(TEST_OWNER);

    expect(payload).toBeNull();
    expect(signer).not.toHaveBeenCalled();
    expect(canPromptWalletSignature(TEST_OWNER)).toBe(false);
  });

  it('prompts once for verified wallet users and reuses the cached signature', async () => {
    const signer = vi.fn(async () => ({
      signature: 'sig-1',
      timestampMs: 1_700_000_000_000,
    }));

    registerWalletAuthSigner(signer);
    setVerifiedWalletContext();

    const first = await createWalletAuthPayload(TEST_OWNER);
    const second = await createWalletAuthPayload(TEST_OWNER);

    expect(first).toEqual({
      signature: 'sig-1',
      timestampMs: 1_700_000_000_000,
    });
    expect(second).toEqual(first);
    expect(signer).toHaveBeenCalledTimes(1);
  });

  it('dedupes parallel signature requests into a single wallet prompt', async () => {
    let resolveSign: ((value: { signature: string; timestampMs: number }) => void) | null = null;

    const signer = vi.fn(
      () =>
        new Promise<{ signature: string; timestampMs: number }>((resolve) => {
          resolveSign = resolve;
        })
    );

    registerWalletAuthSigner(signer);
    setVerifiedWalletContext();

    const firstRequest = createWalletAuthPayload(TEST_OWNER);
    const secondRequest = createWalletAuthPayload(TEST_OWNER);
    const thirdRequest = createWalletAuthPayload(TEST_OWNER);

    expect(signer).toHaveBeenCalledTimes(1);

    resolveSign?.({
      signature: 'sig-shared',
      timestampMs: 1_700_000_000_111,
    });

    const [first, second, third] = await Promise.all([firstRequest, secondRequest, thirdRequest]);

    expect(first).toEqual({
      signature: 'sig-shared',
      timestampMs: 1_700_000_000_111,
    });
    expect(second).toEqual(first);
    expect(third).toEqual(first);
    expect(signer).toHaveBeenCalledTimes(1);
  });
});