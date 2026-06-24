/**
 * Partner embed entrypoint.
 *
 * Import from `@nami/sdk/partner` on partner platforms that only need
 * cross-platform passport proof, nodename resolution, and indexer hydration.
 */
export { createNamiClient, NamiClient } from './client.js';
export {
  createNamiIndexerClient,
  NamiIndexerClient,
  type NamiIndexerConfig,
} from './indexer-client.js';
export {
  enterNamiMoveTarget,
  validateEnterNamiParams,
  type EnterNamiParams,
} from './transactions.js';
export {
  lookupNodenameInRegistry,
  lookupOwnerInRegistry,
  normalizeNodename,
  resolveMemberByNodename,
  type NodenameRegistryLookup,
} from './nodename-registry.js';
export {
  evaluateNamiMemberProof,
  isVerifiedNamiMember,
  resolveNamiMemberFromWallet,
  type NamiLinkedMemberAnchor,
  type NamiLinkedMemberProgression,
  type NamiLinkedMemberView,
  type NamiMemberProof,
  type NamiMemberProofStatus,
} from './resolve-member.js';
export type {
  IdentityProjection,
  NamiLinkedProfileResponse,
  NodenameLookupResponse,
} from './projections.js';
export type { NamiNetwork, NamiSdkConfig } from './types.js';