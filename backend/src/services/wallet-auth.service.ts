import { verifyPersonalMessageSignature } from '@mysten/sui/verify';

function readBoolean(name: string, fallback: boolean): boolean {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  return value.toLowerCase() === 'true' || value === '1';
}

export const walletAuthConfig = {
  requireSignature: readBoolean('NAMI_REQUIRE_WALLET_AUTH', false),
  maxSkewMs: 5 * 60 * 1000,
} as const;

export function buildWalletAuthMessage(owner: string, timestampMs: number): string {
  return 'nami-auth:v1:' + owner.toLowerCase() + ':' + String(timestampMs);
}

export type WalletAuthPayload = {
  owner: string;
  timestampMs: number;
  signature: string;
  /** Ephemeral zkLogin signer address when the signature is not from the owner key. */
  signerAddress?: string;
};

async function verifySignatureForAddress(
  bytes: Uint8Array,
  signature: string,
  address: string
): Promise<boolean> {
  if (!address.startsWith('0x')) {
    return false;
  }

  try {
    await verifyPersonalMessageSignature(bytes, signature, {
      address,
    });
    return true;
  } catch {
    return false;
  }
}

export async function verifyWalletAuthPayload(payload: WalletAuthPayload): Promise<boolean> {
  if (!payload.owner.startsWith('0x')) {
    return false;
  }

  if (!payload.signature.trim()) {
    return false;
  }

  if (!Number.isFinite(payload.timestampMs)) {
    return false;
  }

  const skew = Math.abs(Date.now() - payload.timestampMs);

  if (skew > walletAuthConfig.maxSkewMs) {
    return false;
  }

  const message = buildWalletAuthMessage(payload.owner, payload.timestampMs);
  const bytes = new TextEncoder().encode(message);

  if (await verifySignatureForAddress(bytes, payload.signature, payload.owner)) {
    return true;
  }

  const signerAddress = payload.signerAddress?.trim();

  if (
    signerAddress?.startsWith('0x') &&
    signerAddress.toLowerCase() !== payload.owner.toLowerCase()
  ) {
    return verifySignatureForAddress(bytes, payload.signature, signerAddress);
  }

  return false;
}

export function readWalletAuthFromBody(body: Record<string, unknown>): Partial<WalletAuthPayload> {
  const auth = body.auth;

  if (typeof auth !== 'object' || auth === null) {
    return {};
  }

  const record = auth as Record<string, unknown>;
  const patch: Partial<WalletAuthPayload> = {};

  if (typeof record.signature === 'string') {
    patch.signature = record.signature;
  }

  if (typeof record.timestampMs === 'number') {
    patch.timestampMs = record.timestampMs;
  }

  if (typeof record.signerAddress === 'string' && record.signerAddress.startsWith('0x')) {
    patch.signerAddress = record.signerAddress;
  }

  return patch;
}

export async function assertWalletAuth(
  owner: string,
  auth: Partial<WalletAuthPayload> | null | undefined
): Promise<void> {
  if (!walletAuthConfig.requireSignature) {
    return;
  }

  if (!auth || typeof auth.signature !== 'string' || typeof auth.timestampMs !== 'number') {
    throw new Error('wallet_auth_required');
  }

  if (!auth.signature.trim()) {
    throw new Error('wallet_auth_required');
  }

  const verifyPayload: WalletAuthPayload = {
    owner,
    signature: auth.signature,
    timestampMs: auth.timestampMs,
  };

  if (auth.signerAddress !== undefined) {
    verifyPayload.signerAddress = auth.signerAddress;
  }

  const verified = await verifyWalletAuthPayload(verifyPayload);

  if (!verified) {
    throw new Error('wallet_auth_invalid');
  }
}

export function walletAuthPublicConfig(): { requireSignature: boolean } {
  return {
    requireSignature: walletAuthConfig.requireSignature,
  };
}