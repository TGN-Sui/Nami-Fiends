import { createHash } from 'node:crypto';

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';

import { config } from '../config.js';

import type { OfficialChatOverlayReward, WalrusQuiltPatchRef } from './chat-overlay-rewards.service.js';

export type ChatOverlayCatalogAttestation = {
  quiltBlobId: string;
  catalogVersionMs: number;
  contentRootHash: string;
  patchCount: number;
  txDigest: string | null;
  publishedAtMs: number;
  status: 'on-chain' | 'pending-package' | 'skipped';
  detail?: string;
};

export type CatalogAttestationInput = {
  owner: string;
  catalogVersionMs: number;
  quiltBlobId: string;
  rewards: OfficialChatOverlayReward[];
};

function readBoolean(name: string, fallback = false): boolean {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  return value.toLowerCase() === 'true' || value === '1';
}

function readAttestSignerSecret(): string {
  return (
    (process.env.NAMI_CATALOG_ATTEST_SIGNER_SECRET ?? '').trim() ||
    (process.env.NAMI_MINT_SIGNER_SECRET ?? '').trim()
  );
}

/** Off by default — enable only after a package upgrade ships chat_overlay_catalog.move */
export function isCatalogAttestationEnabled(): boolean {
  return readBoolean('NAMI_CATALOG_ATTEST_ENABLED', false);
}

export function isCatalogAttestationConfigured(): boolean {
  return (
    isCatalogAttestationEnabled() &&
    config.packageId.startsWith('0x') &&
    config.adminCapId.startsWith('0x') &&
    readAttestSignerSecret() !== ''
  );
}

function collectPatchRefs(rewards: OfficialChatOverlayReward[]): WalrusQuiltPatchRef[] {
  const refs: WalrusQuiltPatchRef[] = [];

  for (const reward of rewards) {
    if (reward.staticArtRef?.patchId) {
      refs.push(reward.staticArtRef);
    }

    if (reward.animatedArtRef?.patchId) {
      refs.push(reward.animatedArtRef);
    }
  }

  return refs;
}

export function computeCatalogContentRootHash(rewards: OfficialChatOverlayReward[]): string {
  const refs = collectPatchRefs(rewards)
    .map((ref) => ref.rewardId + ':' + ref.artKind + ':' + ref.contentHash)
    .sort();

  return createHash('sha256').update(refs.join('\n'), 'utf8').digest('hex');
}

function utf8Bytes(value: string): number[] {
  return [...Buffer.from(value, 'utf8')];
}

function createRpcClient(): SuiJsonRpcClient {
  const network = config.network;

  if (network === 'localnet') {
    return new SuiJsonRpcClient({
      url: config.fullnodeUrl,
      network: 'localnet',
    });
  }

  if (network === 'devnet' || network === 'testnet' || network === 'mainnet') {
    return new SuiJsonRpcClient({
      url: getJsonRpcFullnodeUrl(network),
      network,
    });
  }

  return new SuiJsonRpcClient({
    url: config.fullnodeUrl,
    network: 'testnet',
  });
}

export async function publishChatOverlayCatalogAttestation(
  input: CatalogAttestationInput
): Promise<ChatOverlayCatalogAttestation> {
  const patchCount = collectPatchRefs(input.rewards).length;
  const contentRootHash = computeCatalogContentRootHash(input.rewards);
  const publishedAtMs = Date.now();

  const base: ChatOverlayCatalogAttestation = {
    quiltBlobId: input.quiltBlobId,
    catalogVersionMs: input.catalogVersionMs,
    contentRootHash,
    patchCount,
    txDigest: null,
    publishedAtMs,
    status: 'skipped',
  };

  if (patchCount === 0) {
    return {
      ...base,
      detail: 'no_walrus_patches',
    };
  }

  if (!isCatalogAttestationEnabled()) {
    return {
      ...base,
      detail: 'catalog_attest_disabled_until_package_upgrade',
    };
  }

  if (!isCatalogAttestationConfigured()) {
    return {
      ...base,
      detail: 'catalog_attest_signer_not_configured',
    };
  }

  const signerSecret = readAttestSignerSecret();
  const keypair = Ed25519Keypair.fromSecretKey(signerSecret);
  const signerAddress = keypair.getPublicKey().toSuiAddress();

  if (signerAddress.toLowerCase() !== input.owner.toLowerCase()) {
    return {
      ...base,
      detail: 'catalog_attest_signer_owner_mismatch',
    };
  }

  const client = createRpcClient();
  const tx = new Transaction();

  tx.moveCall({
    target: config.packageId + '::admin::publish_chat_overlay_catalog',
    arguments: [
      tx.object(config.adminCapId),
      tx.pure.address(input.owner),
      tx.pure.u64(input.catalogVersionMs),
      tx.pure.vector('u8', utf8Bytes(input.quiltBlobId)),
      tx.pure.vector('u8', utf8Bytes(contentRootHash)),
      tx.pure.u64(patchCount),
    ],
  });

  try {
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    if (result.effects?.status?.status !== 'success') {
      return {
        ...base,
        status: 'pending-package',
        detail: result.effects?.status?.error ?? 'catalog_attest_tx_failed',
      };
    }

    return {
      ...base,
      txDigest: result.digest,
      status: 'on-chain',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'catalog_attest_tx_failed';

    return {
      ...base,
      status: message.includes('Could not resolve') || message.includes('not found') ? 'pending-package' : 'skipped',
      detail: message,
    };
  }
}