import { describe, expect, it } from 'vitest';

import { evaluateNamiMemberProof, isVerifiedNamiMember } from './resolve-member.js';
import type { ParsedIdentity, ParsedPassport } from './parsers.js';

const IDENTITY_ID = '0xidentity';
const PASSPORT_ID = '0xpassport';

function mockIdentity(passportId: string | null = PASSPORT_ID): ParsedIdentity {
  return {
    objectId: IDENTITY_ID,
    owner: '0xowner',
    trustTier: 0,
    verificationLevel: 0,
    passportId,
    nodename: 'fiendgamer',
    createdAtMs: 1,
    version: 1,
  };
}

function mockPassport(identityId: string = IDENTITY_ID): ParsedPassport {
  return {
    objectId: PASSPORT_ID,
    identityId,
    xp: 0,
    level: 0,
    levelProgress: 0,
    badgePoints: 0,
    reputation: 0,
    reputationLabel: 'Unknown',
    archetype: 1,
    tier: 0,
    membershipTierLabel: 'Free',
    tierExpiresAtMs: 0,
    boostScore: 0,
    prestigePoints: 0,
    createdAtMs: 1,
  };
}

describe('evaluateNamiMemberProof', () => {
  it('marks linked identity and passport as verified', () => {
    const proof = evaluateNamiMemberProof(mockIdentity(), mockPassport());

    expect(proof.status).toBe('verified');
    expect(proof.linksConsistent).toBe(true);
    expect(proof.method).toBe('wallet_ownership');
  });

  it('detects passport without identity link', () => {
    const proof = evaluateNamiMemberProof(null, mockPassport());

    expect(proof.status).toBe('passport_only');
    expect(proof.passportOwned).toBe(true);
    expect(proof.identityOwned).toBe(false);
  });

  it('detects identity without passport', () => {
    const proof = evaluateNamiMemberProof(mockIdentity(null), null);

    expect(proof.status).toBe('identity_only');
  });

  it('detects broken cross-links as passport_only', () => {
    const proof = evaluateNamiMemberProof(
      mockIdentity('0xother'),
      mockPassport('0xother')
    );

    expect(proof.status).toBe('passport_only');
    expect(proof.linksConsistent).toBe(false);
  });
});

describe('isVerifiedNamiMember', () => {
  it('returns true only for verified proof', () => {
    expect(
      isVerifiedNamiMember({
        owner: '0xowner',
        proof: evaluateNamiMemberProof(mockIdentity(), mockPassport()),
        anchor: {
          nodename: 'fiendgamer',
          archetype: 1,
          avatarRef: null,
          passportId: PASSPORT_ID,
          identityId: IDENTITY_ID,
          createdAtMs: 1,
        },
        progression: null,
        identity: null,
        passport: null,
        profile: null,
        conduct: null,
        profileProjection: null,
        timeline: null,
      })
    ).toBe(true);
  });
});