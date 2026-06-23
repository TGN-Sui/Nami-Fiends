import { Transaction } from '@mysten/sui/transactions';
import { normalizeSuiAddress } from '@mysten/sui/utils';

import type { NamiClient } from './client.js';
import type { NamiIndexerClient } from './indexer-client.js';
import { parseIdentityObject } from './parsers.js';
import { resolveNamiMemberFromWallet, type NamiLinkedMemberView } from './resolve-member.js';

const DEV_INSPECT_SENDER =
  '0x0000000000000000000000000000000000000000000000000000000000000001';

export type NodenameRegistryLookup = {
  nodename: string;
  registered: boolean;
  identityId: string | null;
  owner: string | null;
};

function onboardingTarget(packageId: string, functionName: string): string {
  return `${packageId}::onboarding::${functionName}`;
}

export function normalizeNodename(value: string): string | null {
  const nodename = value.trim().toLowerCase().replace(/^@+/, '');

  if (!nodename.startsWith('fiend')) {
    return null;
  }

  if (nodename.length < 8 || nodename.length > 24) {
    return null;
  }

  if (!/^fiend[a-z0-9_]+$/.test(nodename)) {
    return null;
  }

  return nodename;
}

function nodenameToBytes(nodename: string): number[] {
  return [...new TextEncoder().encode(nodename)];
}

function decodeReturnBool(returnValues: [number[], string][] | undefined): boolean | null {
  const first = returnValues?.[0];

  if (!first) {
    return null;
  }

  const [bytes] = first;

  return bytes[0] === 1;
}

function decodeReturnAddress(returnValues: [number[], string][] | undefined): string | null {
  const first = returnValues?.[0];

  if (!first) {
    return null;
  }

  const [bytes] = first;

  if (!Array.isArray(bytes) || bytes.length === 0) {
    return null;
  }

  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');

  return normalizeSuiAddress('0x' + hex);
}

function parseIdentityFromObject(
  identityId: string,
  identityObject: Awaited<ReturnType<NamiClient['getObject']>>
): ReturnType<typeof parseIdentityObject> {
  const content = identityObject.data?.content as
    | { dataType?: string; fields?: Record<string, unknown> }
    | undefined;

  if (content?.dataType !== 'moveObject' || !content.fields) {
    return parseIdentityObject({ objectId: identityId });
  }

  return parseIdentityObject({
    objectId: identityId,
    content: {
      dataType: 'moveObject',
      fields: content.fields,
    },
  });
}

async function readIdentityOwner(chain: NamiClient, identityId: string): Promise<{
  owner: string | null;
  nodename: string | null;
}> {
  try {
    const identityObject = await chain.getObject(identityId);
    const parsed = parseIdentityFromObject(identityId, identityObject);

    return {
      owner: parsed?.owner?.startsWith('0x') ? parsed.owner : null,
      nodename: parsed?.nodename?.trim() ? parsed.nodename.trim() : null,
    };
  } catch {
    return { owner: null, nodename: null };
  }
}

export async function lookupNodenameInRegistry(
  chain: NamiClient,
  registryId: string,
  nodenameInput: string
): Promise<NodenameRegistryLookup | null> {
  const nodename = normalizeNodename(nodenameInput);

  if (!nodename || !registryId.startsWith('0x')) {
    return null;
  }

  const nodenameBytes = nodenameToBytes(nodename);
  const hasTx = new Transaction();

  hasTx.moveCall({
    target: onboardingTarget(chain.packageId, 'has_nodename'),
    arguments: [hasTx.object(registryId), hasTx.pure.vector('u8', nodenameBytes)],
  });

  const hasInspect = await chain.sui.devInspectTransactionBlock({
    sender: DEV_INSPECT_SENDER,
    transactionBlock: await hasTx.build({ client: chain.sui }),
  });

  if (hasInspect.error) {
    return {
      nodename,
      registered: false,
      identityId: null,
      owner: null,
    };
  }

  const registered = decodeReturnBool(hasInspect.results?.[0]?.returnValues) === true;

  if (!registered) {
    return {
      nodename,
      registered: false,
      identityId: null,
      owner: null,
    };
  }

  const resolveTx = new Transaction();
  resolveTx.moveCall({
    target: onboardingTarget(chain.packageId, 'resolve_identity_for_nodename'),
    arguments: [resolveTx.object(registryId), resolveTx.pure.vector('u8', nodenameBytes)],
  });

  const resolveInspect = await chain.sui.devInspectTransactionBlock({
    sender: DEV_INSPECT_SENDER,
    transactionBlock: await resolveTx.build({ client: chain.sui }),
  });

  const identityId = decodeReturnAddress(resolveInspect.results?.[0]?.returnValues);
  const identity = identityId ? await readIdentityOwner(chain, identityId) : { owner: null, nodename: null };

  return {
    nodename,
    registered: true,
    identityId,
    owner: identity.owner,
  };
}

export async function lookupOwnerInRegistry(
  chain: NamiClient,
  registryId: string,
  ownerInput: string
): Promise<NodenameRegistryLookup | null> {
  if (!ownerInput.startsWith('0x') || !registryId.startsWith('0x')) {
    return null;
  }

  const owner = normalizeSuiAddress(ownerInput);
  const hasTx = new Transaction();

  hasTx.moveCall({
    target: onboardingTarget(chain.packageId, 'has_owner'),
    arguments: [hasTx.object(registryId), hasTx.pure.address(owner)],
  });

  const hasInspect = await chain.sui.devInspectTransactionBlock({
    sender: DEV_INSPECT_SENDER,
    transactionBlock: await hasTx.build({ client: chain.sui }),
  });

  if (hasInspect.error) {
    return null;
  }

  const registered = decodeReturnBool(hasInspect.results?.[0]?.returnValues) === true;

  if (!registered) {
    return {
      nodename: '',
      registered: false,
      identityId: null,
      owner,
    };
  }

  const resolveTx = new Transaction();
  resolveTx.moveCall({
    target: onboardingTarget(chain.packageId, 'resolve_identity_for_owner'),
    arguments: [resolveTx.object(registryId), resolveTx.pure.address(owner)],
  });

  const resolveInspect = await chain.sui.devInspectTransactionBlock({
    sender: DEV_INSPECT_SENDER,
    transactionBlock: await resolveTx.build({ client: chain.sui }),
  });

  const identityId = decodeReturnAddress(resolveInspect.results?.[0]?.returnValues);
  const identity = identityId ? await readIdentityOwner(chain, identityId) : { owner: null, nodename: null };

  return {
    nodename: identity.nodename ?? '',
    registered: true,
    identityId,
    owner,
  };
}

export async function resolveMemberByNodename(
  chain: NamiClient,
  indexer: NamiIndexerClient | null,
  registryId: string,
  nodenameInput: string
): Promise<{
  lookup: NodenameRegistryLookup | null;
  member: NamiLinkedMemberView | null;
}> {
  const lookup = await lookupNodenameInRegistry(chain, registryId, nodenameInput);

  if (!lookup?.registered || !lookup.owner) {
    return { lookup, member: null };
  }

  const member = await resolveNamiMemberFromWallet(chain, indexer, lookup.owner);

  return { lookup, member };
}