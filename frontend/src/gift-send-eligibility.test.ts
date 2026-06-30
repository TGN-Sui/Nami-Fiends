import { beforeEach, describe, expect, it, vi } from 'vitest';

import { giftSendBlockReason, resolveGiftSenderOwner } from './gift-send-eligibility.js';

const { canZkLoginSignForOwnerMock, getZkLoginSessionMock } = vi.hoisted(() => ({
  canZkLoginSignForOwnerMock: vi.fn(() => false),
  getZkLoginSessionMock: vi.fn(() => null),
}));

vi.mock('./zklogin.js', () => ({
  canZkLoginSignForOwner: canZkLoginSignForOwnerMock,
  getZkLoginSession: getZkLoginSessionMock,
}));
import type { NamiMember } from './uiMockData.js';

const verifiedMember: NamiMember = {
  id: 'm1',
  name: 'Tester',
  tier: 'Pro',
  signal: 'Green',
  status: 'Online',
  bio: '',
  avatar: '',
  badges: [],
  guild: null,
  squad: null,
};

describe('resolveGiftSenderOwner', () => {
  beforeEach(() => {
    canZkLoginSignForOwnerMock.mockReturnValue(false);
    getZkLoginSessionMock.mockReturnValue(null);
  });

  it('prefers a signable zkLogin session over protocol and extension owners', () => {
    getZkLoginSessionMock.mockReturnValue({ address: '0xzklogin' });
    canZkLoginSignForOwnerMock.mockImplementation(
      (owner: string | null | undefined) => owner === '0xzklogin'
    );

    expect(resolveGiftSenderOwner('0xextension', '0xextension')).toBe('0xzklogin');
  });

  it('prefers the protocol owner over a browser extension address', () => {
    expect(resolveGiftSenderOwner('0xzklogin', '0xextension')).toBe('0xzklogin');
  });
});

describe('giftSendBlockReason', () => {
  it('blocks gifting your own profile', () => {
    expect(
      giftSendBlockReason({
        targetMemberId: 'm1',
        senderOwner: '0xabc',
        selfMember: verifiedMember,
      })
    ).toContain('your own profile');
  });

  it('blocks when no sender owner is resolved', () => {
    expect(
      giftSendBlockReason({
        targetMemberId: 'm2',
        senderOwner: null,
        selfMember: verifiedMember,
      })
    ).toContain('Connect a Sui wallet');
  });

  it('allows gifting another member with a connected owner', () => {
    expect(
      giftSendBlockReason({
        targetMemberId: 'm2',
        senderOwner: '0xabc',
        selfMember: verifiedMember,
      })
    ).toBeNull();
  });
});