import type { NamiClient } from './client.js';
import type { NamiIndexerClient } from './indexer-client.js';
import { conductSignalLabel } from './labels.js';
import {
  parseConductStatusObject,
  parseIdentityObject,
  parsePassportObject,
  parseProfileObject,
  type ParsedConductStatus,
  type ParsedIdentity,
  type ParsedPassport,
  type ParsedProfile,
} from './parsers.js';
import type { PassportTimelineProjection, ProfileProjection } from './projections.js';

export type NamiMemberProofStatus =
  | 'verified'
  | 'passport_only'
  | 'identity_only'
  | 'not_member';

export type NamiMemberProof = {
  status: NamiMemberProofStatus;
  /** Wallet object ownership is the cryptographic proof for cross-platform sign-in. */
  method: 'wallet_ownership';
  identityOwned: boolean;
  passportOwned: boolean;
  identityPassportLinked: boolean;
  passportIdentityLinked: boolean;
  linksConsistent: boolean;
};

export type NamiLinkedMemberAnchor = {
  nodename: string | null;
  archetype: number | null;
  avatarRef: string | null;
  passportId: string | null;
  identityId: string | null;
  createdAtMs: number | null;
};

export type NamiLinkedMemberProgression = {
  level: number | null;
  tier: number | null;
  reputation: number | null;
  membershipTierLabel: string | null;
  conductSignal: number | null;
  conductSignalLabel: string | null;
  timelineEntryCount: number;
};

export type NamiLinkedMemberView = {
  owner: string;
  proof: NamiMemberProof;
  anchor: NamiLinkedMemberAnchor;
  progression: NamiLinkedMemberProgression | null;
  identity: ParsedIdentity | null;
  passport: ParsedPassport | null;
  profile: ParsedProfile | null;
  conduct: ParsedConductStatus | null;
  profileProjection: ProfileProjection | null;
  timeline: PassportTimelineProjection | null;
};

function normalizeAddress(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || !value.startsWith('0x')) {
    return null;
  }

  return value.toLowerCase();
}

function addressesMatch(left: string | null | undefined, right: string | null | undefined): boolean {
  const normalizedLeft = normalizeAddress(left);
  const normalizedRight = normalizeAddress(right);

  return normalizedLeft !== null && normalizedRight !== null && normalizedLeft === normalizedRight;
}

export function evaluateNamiMemberProof(
  identity: ParsedIdentity | null,
  passport: ParsedPassport | null
): NamiMemberProof {
  const identityOwned = identity !== null;
  const passportOwned = passport !== null;

  const identityPassportLinked =
    identityOwned && passportOwned && addressesMatch(identity.passportId, passport.objectId);
  const passportIdentityLinked =
    identityOwned && passportOwned && addressesMatch(passport.identityId, identity.objectId);
  const linksConsistent = identityPassportLinked && passportIdentityLinked;

  let status: NamiMemberProofStatus = 'not_member';

  if (linksConsistent) {
    status = 'verified';
  } else if (passportOwned) {
    status = 'passport_only';
  } else if (identityOwned) {
    status = 'identity_only';
  }

  return {
    status,
    method: 'wallet_ownership',
    identityOwned,
    passportOwned,
    identityPassportLinked,
    passportIdentityLinked,
    linksConsistent,
  };
}

function parseOwnedObject<T>(
  owned: { data?: { objectId?: string; content?: unknown } | null },
  parser: (payload: {
    objectId?: string;
    content?: { dataType?: string; fields?: Record<string, unknown> };
  }) => T | null
): T | null {
  if (!owned.data) {
    return null;
  }

  const payload: {
    objectId?: string;
    content?: { dataType?: string; fields?: Record<string, unknown> };
  } = {
    content: owned.data.content as {
      dataType?: string;
      fields?: Record<string, unknown>;
    },
  };

  if (owned.data.objectId) {
    payload.objectId = owned.data.objectId;
  }

  return parser(payload);
}

function buildAnchor(
  identity: ParsedIdentity | null,
  passport: ParsedPassport | null,
  profile: ParsedProfile | null
): NamiLinkedMemberAnchor {
  const nodename = identity?.nodename?.trim() ? identity.nodename.trim() : null;

  return {
    nodename,
    archetype: passport?.archetype ?? null,
    avatarRef: profile?.avatarRef?.trim() ? profile.avatarRef.trim() : null,
    passportId: passport?.objectId ?? identity?.passportId ?? null,
    identityId: identity?.objectId ?? passport?.identityId ?? null,
    createdAtMs: passport?.createdAtMs ?? identity?.createdAtMs ?? null,
  };
}

function buildProgression(
  passport: ParsedPassport | null,
  conduct: ParsedConductStatus | null,
  timeline: PassportTimelineProjection | null
): NamiLinkedMemberProgression | null {
  if (!passport) {
    return null;
  }

  const level = timeline?.snapshot.level ?? passport.level ?? null;
  const tier = timeline?.snapshot.tier ?? passport.tier ?? null;
  const reputation = timeline?.snapshot.reputation ?? passport.reputation ?? null;
  const conductSignal = timeline?.snapshot.conduct_signal ?? conduct?.signal ?? null;

  return {
    level,
    tier,
    reputation,
    membershipTierLabel: passport.membershipTierLabel,
    conductSignal,
    conductSignalLabel:
      conductSignal === null ? null : conductSignalLabel(conductSignal),
    timelineEntryCount: timeline?.entry_count ?? 0,
  };
}

/**
 * Resolve a Nami member from a wallet address (zkLogin or extension).
 * Owning the linked Identity + Passport objects is the proof integrators need.
 */
export async function resolveNamiMemberFromWallet(
  chain: NamiClient,
  indexer: NamiIndexerClient | null,
  owner: string
): Promise<NamiLinkedMemberView> {
  const [identityOwned, passportOwned, profileOwned, conductOwned] = await Promise.all([
    chain.getOwnedIdentities(owner),
    chain.getOwnedPassports(owner),
    chain.getOwnedProfiles(owner),
    chain.getOwnedConductStatuses(owner),
  ]);

  const identity = identityOwned[0]
    ? parseOwnedObject(identityOwned[0], parseIdentityObject)
    : null;
  const passport = passportOwned[0]
    ? parseOwnedObject(passportOwned[0], parsePassportObject)
    : null;
  const profile = profileOwned[0] ? parseOwnedObject(profileOwned[0], parseProfileObject) : null;
  const conduct = conductOwned[0]
    ? parseOwnedObject(conductOwned[0], parseConductStatusObject)
    : null;

  const proof = evaluateNamiMemberProof(identity, passport);

  let profileProjection: ProfileProjection | null = null;
  let timeline: PassportTimelineProjection | null = null;

  if (indexer) {
    const queries: Promise<void>[] = [
      indexer.getProfileByOwner(owner).then((result) => {
        profileProjection = result;
      }),
    ];

    if (passport?.objectId) {
      queries.push(
        indexer.getPassportTimeline(passport.objectId, { limit: 50 }).then((result) => {
          timeline = result;
        })
      );
    }

    await Promise.all(queries);
  }

  return {
    owner,
    proof,
    anchor: buildAnchor(identity, passport, profile),
    progression: buildProgression(passport, conduct, timeline),
    identity,
    passport,
    profile,
    conduct,
    profileProjection,
    timeline,
  };
}

export function isVerifiedNamiMember(view: NamiLinkedMemberView): boolean {
  return view.proof.status === 'verified';
}