import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OFFICIAL_OWNER = '0xofficialowner';
const LINKED_WALLET = '0xlinkedwallet';

vi.mock('./app-config.js', () => ({
  shouldUseDemoOwnerFallback: () => false,
  shouldUseDevFixtures: () => false,
  isTestLaunchMode: () => true,
}));

vi.mock('./nami-capabilities.js', () => ({
  isOfficialOwner: (owner: string | null) => owner?.toLowerCase() === OFFICIAL_OWNER.toLowerCase(),
}));

vi.mock('./protocol-env.js', () => ({
  readDemoOwner: () => null,
  readOfficialOwner: () => OFFICIAL_OWNER,
}));

vi.mock('./protocol-owner-snapshot.js', () => ({
  readLastWalletOwner: vi.fn(() => null),
}));

const { getZkLoginSessionMock, canZkLoginSignForOwnerMock } = vi.hoisted(() => ({
  getZkLoginSessionMock: vi.fn(() => null),
  canZkLoginSignForOwnerMock: vi.fn(() => false),
}));

vi.mock('./zklogin.js', () => ({
  getZkLoginSession: getZkLoginSessionMock,
  canZkLoginSignForOwner: canZkLoginSignForOwnerMock,
}));

vi.mock('./member-session-store.js', () => ({
  readMemberSession: vi.fn(() => ({
    email: 'owner@example.com',
    displayName: 'Owner',
  })),
}));

vi.mock('./member-auth-link-store.js', () => ({
  readLinkedWalletAddressForEmail: vi.fn(() => LINKED_WALLET),
}));

import { readLastWalletOwner } from './protocol-owner-snapshot.js';
import { resolveProtocolOwnerState } from './protocol-owner-resolve.js';

const readLastWalletOwnerMock = vi.mocked(readLastWalletOwner);

describe('protocol-owner-resolve', () => {
  beforeEach(() => {
    canZkLoginSignForOwnerMock.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('prefers the connected wallet over the email-linked wallet', () => {
    readLastWalletOwnerMock.mockReturnValue(OFFICIAL_OWNER);

    expect(resolveProtocolOwnerState()).toEqual({
      owner: OFFICIAL_OWNER,
      source: 'wallet',
    });
  });

  it('falls back to the linked owner wallet when only the email session is active', () => {
    readLastWalletOwnerMock.mockReturnValue(null);
    getZkLoginSessionMock.mockReturnValue(null);

    expect(resolveProtocolOwnerState()).toEqual({
      owner: LINKED_WALLET,
      source: 'linked',
    });
  });

  it('prefers zkLogin over a non-official browser wallet on test launch', () => {
    const zkOwner = '0xzkloginowner';

    readLastWalletOwnerMock.mockReturnValue(LINKED_WALLET);
    getZkLoginSessionMock.mockReturnValue({
      address: zkOwner,
      maxEpoch: 1,
      provider: 'google',
      createdAtMs: Date.now(),
    });
    canZkLoginSignForOwnerMock.mockReturnValue(false);

    expect(resolveProtocolOwnerState()).toEqual({
      owner: zkOwner,
      source: 'zklogin',
    });
  });

  it('prefers zkLogin over a connected wallet on the same address when signing is ready', () => {
    const sharedOwner = '0xsharedwallet';

    readLastWalletOwnerMock.mockReturnValue(sharedOwner);
    getZkLoginSessionMock.mockReturnValue({
      address: sharedOwner,
      maxEpoch: 1,
      provider: 'google',
      createdAtMs: Date.now(),
      ephemeralSecretKey: 'ephemeral-secret',
    });
    canZkLoginSignForOwnerMock.mockImplementation(
      (owner) => owner?.toLowerCase() === sharedOwner.toLowerCase()
    );

    expect(resolveProtocolOwnerState()).toEqual({
      owner: sharedOwner,
      source: 'zklogin',
    });
  });

  it('prefers zkLogin when it matches the official owner over a different browser wallet', () => {
    readLastWalletOwnerMock.mockReturnValue(LINKED_WALLET);
    getZkLoginSessionMock.mockReturnValue({
      address: OFFICIAL_OWNER,
      maxEpoch: 1,
      provider: 'google',
      createdAtMs: Date.now(),
      ephemeralSecretKey: 'ephemeral-secret',
    });
    canZkLoginSignForOwnerMock.mockImplementation(
      (owner) => owner?.toLowerCase() === OFFICIAL_OWNER.toLowerCase()
    );

    expect(resolveProtocolOwnerState()).toEqual({
      owner: OFFICIAL_OWNER,
      source: 'zklogin',
    });
  });
});