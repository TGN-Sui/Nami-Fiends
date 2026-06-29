import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

import {
  canPromptEquipSyncSignature,
  canPromptWalletSignature,
  createCatalogSyncAuthPayload,
  createEquipSyncAuthPayload,
  createWalletAuthPayload,
  registerWalletAuthSigner,
  resetWalletAuthStateForTests,
  setWalletAuthContext,
} from './wallet-auth.js';

const TEST_OWNER = '0xabc123';
const OFFICIAL_OWNER = '0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca';

vi.mock('./protocol-env.js', () => ({
  readWalletAuthRequired: vi.fn(() => true),
}));

vi.mock('./nami-capabilities.js', () => ({
  isOfficialOwner: (owner: string | null) => owner?.toLowerCase() === OFFICIAL_OWNER.toLowerCase(),
}));

vi.mock('./member-session-store.js', () => ({
  hasActiveMemberSession: vi.fn(() => true),
}));

const { canZkLoginSignForOwnerMock, getZkLoginSessionMock } = vi.hoisted(() => ({
  canZkLoginSignForOwnerMock: vi.fn(() => false),
  getZkLoginSessionMock: vi.fn(() => null),
}));

vi.mock('./zklogin.js', () => ({
  canZkLoginSignForOwner: canZkLoginSignForOwnerMock,
  getZkLoginSession: getZkLoginSessionMock,
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
    canZkLoginSignForOwnerMock.mockReturnValue(false);
    getZkLoginSessionMock.mockReturnValue(null);
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

  it('prompts for the configured official owner even when member verification is pending', async () => {
    const signer = vi.fn(async () => ({
      signature: 'sig-official',
      timestampMs: Date.now(),
    }));

    registerWalletAuthSigner(signer);
    setWalletAuthContext({
      owner: OFFICIAL_OWNER,
      source: 'zklogin',
      memberVerified: false,
    });

    const payload = await createWalletAuthPayload(OFFICIAL_OWNER);

    expect(payload).toEqual({
      signature: 'sig-official',
      timestampMs: expect.any(Number),
    });
    expect(canPromptWalletSignature(OFFICIAL_OWNER)).toBe(true);
  });

  it('allows equip sync signatures for signed-in members before passport verification', async () => {
    const signer = vi.fn(async () => ({
      signature: 'sig-equip',
      timestampMs: Date.now(),
    }));

    registerWalletAuthSigner(signer);
    setWalletAuthContext({
      owner: TEST_OWNER,
      source: 'wallet',
      memberVerified: false,
    });

    expect(canPromptEquipSyncSignature(TEST_OWNER)).toBe(true);
    expect(canPromptWalletSignature(TEST_OWNER)).toBe(false);

    const payload = await createEquipSyncAuthPayload(TEST_OWNER);

    expect(payload).toEqual({
      signature: 'sig-equip',
      timestampMs: expect.any(Number),
    });
    expect(signer).toHaveBeenCalledTimes(1);
  });

  it('allows equip sync signatures for zkLogin without an email member session', async () => {
    const { hasActiveMemberSession } = await import('./member-session-store.js');

    vi.mocked(hasActiveMemberSession).mockReturnValue(false);

    const signer = vi.fn(async () => ({
      signature: 'sig-zk-equip',
      timestampMs: Date.now(),
      signerAddress: '0xephemeral',
    }));

    registerWalletAuthSigner(signer);
    setWalletAuthContext({
      owner: TEST_OWNER,
      source: 'zklogin',
      memberVerified: false,
    });

    expect(canPromptEquipSyncSignature(TEST_OWNER)).toBe(true);

    const payload = await createEquipSyncAuthPayload(TEST_OWNER);

    expect(payload).toEqual({
      signature: 'sig-zk-equip',
      timestampMs: expect.any(Number),
      signerAddress: '0xephemeral',
    });
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

  it('catalog sync signs directly with zkLogin and ignores extension bridge signers', async () => {
    const keypair = Ed25519Keypair.generate();
    const signerAddress = keypair.getPublicKey().toSuiAddress();

    canZkLoginSignForOwnerMock.mockReturnValue(true);
    getZkLoginSessionMock.mockReturnValue({
      address: OFFICIAL_OWNER,
      ephemeralSecretKey: keypair.getSecretKey(),
      maxEpoch: 999,
      provider: 'google',
      createdAtMs: Date.now(),
    });

    const extensionSigner = vi.fn(async () => ({
      signature: 'extension-sig',
      timestampMs: Date.now(),
    }));

    registerWalletAuthSigner(extensionSigner);
    setWalletAuthContext({
      owner: OFFICIAL_OWNER,
      source: 'wallet',
      memberVerified: false,
    });

    const payload = await createCatalogSyncAuthPayload(OFFICIAL_OWNER);

    expect(payload?.signerAddress).toBe(signerAddress);
    expect(payload?.signature).not.toBe('extension-sig');
    expect(extensionSigner).not.toHaveBeenCalled();
  });

  it('always mints a fresh zkLogin signature with signerAddress', async () => {
    const signer = vi.fn(async () => ({
      signature: 'sig-zk-catalog',
      timestampMs: Date.now(),
      signerAddress: '0xephemeral',
    }));

    registerWalletAuthSigner(signer);
    setWalletAuthContext({
      owner: OFFICIAL_OWNER,
      source: 'zklogin',
      memberVerified: false,
    });

    const first = await createWalletAuthPayload(OFFICIAL_OWNER);
    const second = await createWalletAuthPayload(OFFICIAL_OWNER);

    expect(first).toEqual({
      signature: 'sig-zk-catalog',
      timestampMs: expect.any(Number),
      signerAddress: '0xephemeral',
    });
    expect(second?.signature).toBe('sig-zk-catalog');
    expect(signer).toHaveBeenCalledTimes(2);
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