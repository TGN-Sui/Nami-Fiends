import type { NamiLinkedMemberView } from '@nami/sdk';

import {
  clearLinkedMemberSnapshot,
  readLinkedMemberSnapshot,
  saveLinkedMemberSnapshot,
  setLinkedMemberSyncOwner,
} from './linked-member-store.js';
import type { NamiLinkedProfile } from './nami-linked-profile-api.js';
import { getProtocolContext, fetchLinkedMemberView } from './protocol.js';
import { readWalletAuthRequired } from './protocol-env.js';
import type { ProtocolOwnerSource } from './wallet.js';

function shouldRequestWalletProof(source: ProtocolOwnerSource): boolean {
  if (!readWalletAuthRequired()) {
    return false;
  }

  return source === 'wallet' || source === 'zklogin' || source === 'linked';
}

function profileFromChainView(chain: NamiLinkedMemberView): NamiLinkedProfile {
  return {
    owner: chain.owner,
    proof: chain.proof,
    anchor: chain.anchor,
    progression: chain.progression,
    offchain: {
      displayName: null,
      preferredName: null,
      avatarUrl: null,
      claimStatus: null,
      claimNodename: chain.anchor.nodename,
      profileProjectionId: chain.profileProjection?.id ?? null,
    },
    auth: {
      requireSignature: readWalletAuthRequired(),
      verifiedRequest: false,
    },
  };
}

function mergeLinkedProfiles(
  chain: NamiLinkedMemberView | null,
  remote: NamiLinkedProfile | null
): NamiLinkedProfile | null {
  if (remote) {
    if (!chain) {
      return remote;
    }

    return {
      ...remote,
      proof: chain.proof.linksConsistent ? chain.proof : remote.proof,
      anchor: {
        nodename: remote.anchor.nodename ?? chain.anchor.nodename,
        archetype: remote.anchor.archetype ?? chain.anchor.archetype,
        avatarRef: remote.anchor.avatarRef ?? chain.anchor.avatarRef,
        passportId: remote.anchor.passportId ?? chain.anchor.passportId,
        identityId: remote.anchor.identityId ?? chain.anchor.identityId,
        createdAtMs: remote.anchor.createdAtMs ?? chain.anchor.createdAtMs,
      },
      progression: remote.progression ?? chain.progression,
    };
  }

  if (!chain || chain.proof.status === 'not_member') {
    return null;
  }

  return profileFromChainView(chain);
}

export async function hydrateLinkedMember(
  owner: string | null,
  source: ProtocolOwnerSource = null
): Promise<NamiLinkedProfile | null> {
  setLinkedMemberSyncOwner(owner);

  if (!owner?.startsWith('0x')) {
    clearLinkedMemberSnapshot();
    return null;
  }

  const context = getProtocolContext();

  if (!context.chain) {
    return readLinkedMemberSnapshot()?.linkedProfile ?? null;
  }

  try {
    const { chain, linkedProfile } = await fetchLinkedMemberView(context, owner, {
      includeOffchain: true,
      requireWalletProof: shouldRequestWalletProof(source),
    });

    const resolved = mergeLinkedProfiles(chain, linkedProfile);

    if (!resolved) {
      clearLinkedMemberSnapshot();
      return null;
    }

    saveLinkedMemberSnapshot({
      owner,
      linkedProfile: resolved,
      hydratedAtMs: Date.now(),
    });

    return resolved;
  } catch {
    return readLinkedMemberSnapshot()?.linkedProfile ?? null;
  }
}