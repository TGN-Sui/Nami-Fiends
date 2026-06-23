import { describe, expect, it } from 'vitest';

import { isVerifiedNamiLinkedProfile, type NamiLinkedProfile } from './nami-linked-profile-api.js';

function mockProfile(status: NamiLinkedProfile['proof']['status']): NamiLinkedProfile {
  return {
    owner: '0xabc',
    proof: {
      status,
      method: 'wallet_ownership',
      identityOwned: status === 'verified',
      passportOwned: status === 'verified' || status === 'passport_only',
      identityPassportLinked: status === 'verified',
      passportIdentityLinked: status === 'verified',
      linksConsistent: status === 'verified',
    },
    anchor: {
      nodename: 'fiendgamer',
      archetype: 1,
      avatarRef: 'seed:42',
      passportId: '0xpassport',
      identityId: '0xidentity',
      createdAtMs: 1,
    },
    progression: null,
    offchain: {
      displayName: null,
      preferredName: 'Gamer',
      avatarUrl: null,
      claimStatus: 'approved',
      claimNodename: 'fiendgamer',
      profileProjectionId: null,
    },
    auth: {
      requireSignature: false,
      verifiedRequest: false,
    },
  };
}

describe('isVerifiedNamiLinkedProfile', () => {
  it('returns true for verified passport proof', () => {
    expect(isVerifiedNamiLinkedProfile(mockProfile('verified'))).toBe(true);
  });

  it('returns false for partial proof', () => {
    expect(isVerifiedNamiLinkedProfile(mockProfile('passport_only'))).toBe(false);
    expect(isVerifiedNamiLinkedProfile(null)).toBe(false);
  });
});