import {
  createNamiClient,
  createNamiIndexerClient,
  evaluateNamiMemberProof,
  resolveNamiMemberFromWallet,
  type NamiLinkedMemberView,
} from '@nami/sdk';

import { config } from '../config.js';
import type { ProjectionRegistry } from '../projection-registry.js';
import { getMemberPreferences } from './member-preferences.service.js';
import { getOfficialsSubmissions } from './officials-submissions.service.js';
import { walletAuthPublicConfig } from './wallet-auth.service.js';

export type NamiLinkedProfileOffchain = {
  displayName: string | null;
  preferredName: string | null;
  avatarUrl: string | null;
  claimStatus: string | null;
  claimNodename: string | null;
  profileProjectionId: string | null;
};

export type NamiLinkedProfileResponse = {
  owner: string;
  proof: NamiLinkedMemberView['proof'];
  anchor: NamiLinkedMemberView['anchor'];
  progression: NamiLinkedMemberView['progression'];
  offchain: NamiLinkedProfileOffchain;
  auth: {
    requireSignature: boolean;
    verifiedRequest: boolean;
  };
};

function normalizeOwner(owner: string): string {
  return owner.trim().toLowerCase();
}

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

async function resolveChainMember(owner: string): Promise<NamiLinkedMemberView | null> {
  const chain = createChainClient();

  if (!chain) {
    return null;
  }

  const indexer = createIndexerClient();
  const normalizedOwner = normalizeOwner(owner);

  return resolveNamiMemberFromWallet(chain, indexer, normalizedOwner);
}

async function resolveOffchain(
  registry: ProjectionRegistry,
  owner: string,
  anchorNodename: string | null
): Promise<NamiLinkedProfileOffchain> {
  const normalizedOwner = normalizeOwner(owner);
  const [preferences, officials] = await Promise.all([
    getMemberPreferences(normalizedOwner),
    getOfficialsSubmissions(),
  ]);

  const profileProjection = registry.profiles.getByOwner(normalizedOwner);

  const claim = officials.nodenameClaims.find((entry) => {
    if (entry === null || typeof entry !== 'object') {
      return false;
    }

    const row = entry as Record<string, unknown>;
    const submitter =
      typeof row.submitterAddress === 'string' ? row.submitterAddress.toLowerCase() : null;
    const nodename = typeof row.nodename === 'string' ? row.nodename.toLowerCase() : null;

    if (submitter === normalizedOwner) {
      return true;
    }

    return anchorNodename !== null && nodename === anchorNodename.toLowerCase();
  }) as Record<string, unknown> | undefined;

  const preferredName =
    typeof claim?.preferredName === 'string'
      ? claim.preferredName
      : typeof claim?.displayName === 'string'
        ? claim.displayName
        : null;

  return {
    displayName: profileProjection ? null : preferredName,
    preferredName,
    avatarUrl: preferences?.avatarUrl ?? null,
    claimStatus: typeof claim?.status === 'string' ? claim.status : null,
    claimNodename: typeof claim?.nodename === 'string' ? claim.nodename : null,
    profileProjectionId: profileProjection?.id ?? null,
  };
}

export async function buildLinkedProfile(
  registry: ProjectionRegistry,
  owner: string,
  options: { verifiedRequest?: boolean } = {}
): Promise<NamiLinkedProfileResponse | null> {
  if (!owner.startsWith('0x')) {
    return null;
  }

  const normalizedOwner = normalizeOwner(owner);
  let chainMember: NamiLinkedMemberView | null = null;

  try {
    chainMember = await resolveChainMember(normalizedOwner);
  } catch {
    chainMember = null;
  }
  const offchain = await resolveOffchain(
    registry,
    normalizedOwner,
    chainMember?.anchor.nodename ?? null
  );

  const proof = chainMember?.proof ?? evaluateNamiMemberProof(null, null);
  const hasOffchainAnchor =
    Boolean(offchain.preferredName?.trim()) ||
    Boolean(offchain.avatarUrl?.trim()) ||
    Boolean(offchain.claimNodename?.trim());

  if (proof.status === 'not_member' && !hasOffchainAnchor) {
    return null;
  }

  const anchor = chainMember?.anchor ?? {
    nodename: offchain.claimNodename,
    archetype: null,
    avatarRef: null,
    passportId: null,
    identityId: null,
    createdAtMs: null,
  };

  return {
    owner: normalizedOwner,
    proof,
    anchor,
    progression: chainMember?.progression ?? null,
    offchain,
    auth: {
      requireSignature: walletAuthPublicConfig().requireSignature,
      verifiedRequest: options.verifiedRequest === true,
    },
  };
}