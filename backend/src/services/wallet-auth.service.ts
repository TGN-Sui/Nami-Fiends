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
};

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

  try {
    await verifyPersonalMessageSignature(bytes, payload.signature, {
      address: payload.owner,
    });
    return true;
  } catch {
    return false;
  }
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

  const verified = await verifyWalletAuthPayload({
    owner,
    signature: auth.signature,
    timestampMs: auth.timestampMs,
  });

  if (!verified) {
    throw new Error('wallet_auth_invalid');
  }
}

export function walletAuthPublicConfig(): { requireSignature: boolean } {
  return {
    requireSignature: walletAuthConfig.requireSignature,
  };
}