import {
  createNamiClient,
  createNamiIndexerClient,
  lookupNodenameInRegistry,
  lookupOwnerInRegistry,
  normalizeNodename,
  resolveMemberByNodename,
  resolveNamiMemberFromWallet,
} from '@nami/sdk';

import { config } from '../config.js';
import type { ProjectionRegistry } from '../projection-registry.js';
import { buildLinkedProfile } from './linked-profile.service.js';

export type NodenameLookupSource = 'indexer' | 'chain' | 'none';

export type NodenameLookupResponse = {
  nodename: string;
  registered: boolean;
  identityId: string | null;
  owner: string | null;
  passportId: string | null;
  profileId: string | null;
  archetype: number | null;
  memberProofStatus: string | null;
  source: NodenameLookupSource;
  linkedProfile: Awaited<ReturnType<typeof buildLinkedProfile>>;
};

function createChainClient() {
  if (!config.packageId.trim()) {
    return null;
  }

  if (config.network === 'localnet') {
    return createNamiClient({
      packageId: config.packageId,
      network: config.network,
      fullnodeUrl: config.fullnodeUrl,
    });
  }

  return createNamiClient({
    packageId: config.packageId,
    network: config.network,
  });
}

function createIndexerClient() {
  const baseUrl = config.publicApiUrl.trim();

  if (!baseUrl) {
    return null;
  }

  return createNamiIndexerClient({ baseUrl });
}

function readRegistryId(): string | null {
  const registryId = config.nodenameRegistryId.trim();

  return registryId.startsWith('0x') ? registryId : null;
}

function responseFromProjection(
  entry: NonNullable<ReturnType<ProjectionRegistry['nodenameRegistry']['getByNodename']>>,
  memberProofStatus: string | null,
  linkedProfile: NodenameLookupResponse['linkedProfile'],
  source: NodenameLookupSource
): NodenameLookupResponse {
  return {
    nodename: entry.nodename,
    registered: true,
    identityId: entry.identity_id,
    owner: entry.owner,
    passportId: entry.passport_id,
    profileId: entry.profile_id,
    archetype: entry.archetype,
    memberProofStatus,
    source,
    linkedProfile,
  };
}

function notFoundResponse(nodename: string): NodenameLookupResponse {
  return {
    nodename,
    registered: false,
    identityId: null,
    owner: null,
    passportId: null,
    profileId: null,
    archetype: null,
    memberProofStatus: null,
    source: 'none',
    linkedProfile: null,
  };
}

async function resolveMemberProofStatus(
  owner: string | null,
  registryId: string | null
): Promise<string | null> {
  if (!owner?.startsWith('0x')) {
    return null;
  }

  const chain = createChainClient();

  if (!chain) {
    return null;
  }

  const indexer = createIndexerClient();
  const member = await resolveNamiMemberFromWallet(chain, indexer, owner);

  return member.proof.status;
}

export async function lookupNodename(
  registry: ProjectionRegistry,
  nodenameInput: string,
  options: { includeLinkedProfile?: boolean } = {}
): Promise<NodenameLookupResponse | null> {
  const nodename = normalizeNodename(nodenameInput);

  if (!nodename) {
    return null;
  }

  const projectionEntry = registry.nodenameRegistry.getByNodename(nodename);

  if (projectionEntry) {
    const memberProofStatus = await resolveMemberProofStatus(projectionEntry.owner, readRegistryId());
    const linkedProfile =
      options.includeLinkedProfile && projectionEntry.owner
        ? await buildLinkedProfile(registry, projectionEntry.owner)
        : null;

    return responseFromProjection(
      projectionEntry,
      memberProofStatus,
      linkedProfile,
      'indexer'
    );
  }

  const registryId = readRegistryId();
  const chain = createChainClient();

  if (!registryId || !chain) {
    return notFoundResponse(nodename);
  }

  const indexer = createIndexerClient();
  const resolved = await resolveMemberByNodename(chain, indexer, registryId, nodename);
  const lookup = resolved.lookup;

  if (!lookup?.registered) {
    return notFoundResponse(nodename);
  }

  let linkedProfile = null;

  if (options.includeLinkedProfile && lookup.owner) {
    linkedProfile = await buildLinkedProfile(registry, lookup.owner);
  }

  return {
    nodename: lookup.nodename,
    registered: true,
    identityId: lookup.identityId,
    owner: lookup.owner,
    passportId: resolved.member?.passport?.objectId ?? null,
    profileId: resolved.member?.profile?.objectId ?? null,
    archetype: resolved.member?.passport?.archetype ?? null,
    memberProofStatus: resolved.member?.proof.status ?? null,
    source: 'chain',
    linkedProfile,
  };
}

export async function lookupRegistryOwner(
  registry: ProjectionRegistry,
  ownerInput: string,
  options: { includeLinkedProfile?: boolean } = {}
): Promise<NodenameLookupResponse | null> {
  if (!ownerInput.startsWith('0x')) {
    return null;
  }

  const projectionEntry = registry.nodenameRegistry.getByOwner(ownerInput);

  if (projectionEntry) {
    const memberProofStatus = await resolveMemberProofStatus(projectionEntry.owner, readRegistryId());
    const linkedProfile =
      options.includeLinkedProfile && projectionEntry.owner
        ? await buildLinkedProfile(registry, projectionEntry.owner)
        : null;

    return responseFromProjection(
      projectionEntry,
      memberProofStatus,
      linkedProfile,
      'indexer'
    );
  }

  const registryId = readRegistryId();
  const chain = createChainClient();

  if (!registryId || !chain) {
    return null;
  }

  const lookup = await lookupOwnerInRegistry(chain, registryId, ownerInput);

  if (!lookup?.registered) {
    return null;
  }

  let linkedProfile = null;
  let memberProofStatus: string | null = null;

  if (lookup.owner) {
    memberProofStatus = await resolveMemberProofStatus(lookup.owner, registryId);

    if (options.includeLinkedProfile) {
      linkedProfile = await buildLinkedProfile(registry, lookup.owner);
    }
  }

  return {
    nodename: lookup.nodename,
    registered: true,
    identityId: lookup.identityId,
    owner: lookup.owner,
    passportId: null,
    profileId: null,
    archetype: null,
    memberProofStatus,
    source: 'chain',
    linkedProfile,
  };
}

export function listIndexedNodenames(registry: ProjectionRegistry, limit = 50) {
  return registry.nodenameRegistry.list(limit);
}