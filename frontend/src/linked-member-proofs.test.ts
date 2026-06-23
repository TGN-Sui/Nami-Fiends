import { describe, expect, it } from 'vitest';

import { buildPassportProofs } from './linked-member-proofs.js';
import type { NamiLinkedProfile } from './nami-linked-profile-api.js';

function verifiedProfile(): NamiLinkedProfile {
  return {
    owner: '0xabc',
    proof: {
      status: 'verified',
      method: 'wallet_ownership',
      identityOwned: true,
      passportOwned: true,
      identityPassportLinked: true,
      passportIdentityLinked: true,
      linksConsistent: true,
    },
    anchor: {
      nodename: 'fiendgamer',
      archetype: 1,
      avatarRef: 'seed:42',
      passportId: '0xpassport',
      identityId: '0xidentity',
      createdAtMs: 1,
    },
    progression: {
      level: 0,
      tier: 0,
      reputation: 0,
      membershipTierLabel: 'NPC',
      conductSignal: 1,
      conductSignalLabel: 'Green',
      timelineEntryCount: 1,
    },
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

describe('buildPassportProofs', () => {
  it('marks cross-platform proof portable when passport is verified', () => {
    const proofs = buildPassportProofs({
      linkedProfile: verifiedProfile(),
      passportView: null,
      protocolSource: 'zklogin',
      suiNsPublic: false,
    });

    const crossPlatform = proofs.find((proof) => proof.title === 'Cross-Platform Proof');

    expect(crossPlatform?.status).toBe('Portable');
    expect(proofs.find((proof) => proof.title === 'Nodename')?.status).toBe('Verified');
  });

  it('shows connect guidance when no linked profile exists', () => {
    const proofs = buildPassportProofs({
      linkedProfile: null,
      passportView: null,
      protocolSource: null,
      suiNsPublic: false,
    });

    expect(proofs.find((proof) => proof.title === 'Passport Ownership')?.status).toBe('Not found');
  });
});