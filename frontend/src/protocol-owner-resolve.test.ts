import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const OFFICIAL_OWNER = '0xofficialowner';
const LINKED_WALLET = '0xlinkedwallet';

vi.mock('./app-config.js', () => ({
  shouldUseDemoOwnerFallback: () => false,
}));

vi.mock('./protocol-env.js', () => ({
  readDemoOwner: () => null,
}));

vi.mock('./protocol-owner-snapshot.js', () => ({
  readLastWalletOwner: vi.fn(() => null),
}));

vi.mock('./zklogin.js', () => ({
  getZkLoginSession: vi.fn(() => null),
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
import { getZkLoginSession } from './zklogin.js';
import { resolveProtocolOwnerState } from './protocol-owner-resolve.js';

const readLastWalletOwnerMock = vi.mocked(readLastWalletOwner);
const getZkLoginSessionMock = vi.mocked(getZkLoginSession);

describe('protocol-owner-resolve', () => {
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
});