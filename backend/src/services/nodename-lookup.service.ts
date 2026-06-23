import {
  createNamiClient,
  createNamiIndexerClient,
  lookupNodenameInRegistry,
  lookupOwnerInRegistry,
  normalizeNodename,
  resolveMemberByNodename,
} from '@nami/sdk';

import { config } from '../config.js';
import type { ProjectionRegistry } from '../projection-registry.js';
import { buildLinkedProfile } from './linked-profile.service.js';

export type NodenameLookupResponse = {
  nodename: string;
  registered: boolean;
  identityId: string | null;
  owner: string | null;
  memberProofStatus: string | null;
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

export async function lookupNodename(
  registry: ProjectionRegistry,
  nodenameInput: string,
  options: { includeLinkedProfile?: boolean } = {}
): Promise<NodenameLookupResponse | null> {
  const nodename = normalizeNodename(nodenameInput);

  if (!nodename) {
    return null;
  }

  const registryId = readRegistryId();
  const chain = createChainClient();

  if (!registryId || !chain) {
    return {
      nodename,
      registered: false,
      identityId: null,
      owner: null,
      memberProofStatus: null,
      linkedProfile: null,
    };
  }

  const indexer = createIndexerClient();

  let lookup = await lookupNodenameInRegistry(chain, registryId, nodename);

  if (!lookup?.registered) {
    return {
      nodename,
      registered: false,
      identityId: null,
      owner: null,
      memberProofStatus: null,
      linkedProfile: null,
    };
  }

  let memberProofStatus: string | null = null;

  if (lookup.owner) {
    const resolved = await resolveMemberByNodename(chain, indexer, registryId, nodename);
    lookup = resolved.lookup ?? lookup;
    memberProofStatus = resolved.member?.proof.status ?? null;
  }

  let linkedProfile = null;

  if (options.includeLinkedProfile && lookup.owner) {
    linkedProfile = await buildLinkedProfile(registry, lookup.owner);
  }

  return {
    nodename: lookup.nodename,
    registered: lookup.registered,
    identityId: lookup.identityId,
    owner: lookup.owner,
    memberProofStatus,
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

  const registryId = readRegistryId();
  const chain = createChainClient();

  if (!registryId || !chain) {
    return null;
  }

  const lookup = await lookupOwnerInRegistry(chain, registryId, ownerInput);

  if (!lookup) {
    return null;
  }

  let linkedProfile = null;

  if (options.includeLinkedProfile && lookup.owner) {
    linkedProfile = await buildLinkedProfile(registry, lookup.owner);
  }

  return {
    nodename: lookup.nodename,
    registered: lookup.registered,
    identityId: lookup.identityId,
    owner: lookup.owner,
    memberProofStatus: null,
    linkedProfile,
  };
}