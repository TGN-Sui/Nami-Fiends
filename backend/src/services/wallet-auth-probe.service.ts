import { config } from '../config.js';
import { isOfficialOwnerAddress } from './officials-auth.service.js';
import {
  buildWalletAuthMessage,
  readWalletAuthFromBody,
  verifyWalletAuthPayload,
  walletAuthConfig,
} from './wallet-auth.service.js';

export type WalletAuthProbeResult = {
  require_signature: boolean;
  official_owner_prefix: string;
  owner_is_official: boolean;
  server_time_ms: number;
  server_skew_hint_ms: number;
  verify?: {
    attempted: boolean;
    verified: boolean;
    has_signer_address: boolean;
    timestamp_skew_ms: number | null;
    owner_message: string;
    rejection_reason: string | null;
  };
};

function rejectionReason(input: {
  owner: string;
  auth: ReturnType<typeof readWalletAuthFromBody>;
}): string | null {
  if (!walletAuthConfig.requireSignature) {
    return null;
  }

  if (!input.auth.signature?.trim()) {
    return 'missing_signature';
  }

  if (typeof input.auth.timestampMs !== 'number' || !Number.isFinite(input.auth.timestampMs)) {
    return 'invalid_timestamp';
  }

  const skew = Math.abs(Date.now() - input.auth.timestampMs);

  if (skew > walletAuthConfig.maxSkewMs) {
    return 'timestamp_skew';
  }

  if (!input.auth.signerAddress?.trim()) {
    return 'missing_signer_address';
  }

  return 'signature_mismatch';
}

export async function buildWalletAuthProbe(body: Record<string, unknown>): Promise<WalletAuthProbeResult> {
  const owner = typeof body.owner === 'string' ? body.owner : '';
  const officialPrefix = config.officialOwner.trim().slice(0, 10);
  const result: WalletAuthProbeResult = {
    require_signature: walletAuthConfig.requireSignature,
    official_owner_prefix: officialPrefix,
    owner_is_official: owner.startsWith('0x') ? isOfficialOwnerAddress(owner) : false,
    server_time_ms: Date.now(),
    server_skew_hint_ms: walletAuthConfig.maxSkewMs,
  };

  const auth = readWalletAuthFromBody(body);

  if (!auth.signature || typeof auth.timestampMs !== 'number') {
    return result;
  }

  const verified = await verifyWalletAuthPayload({
    owner,
    signature: auth.signature,
    timestampMs: auth.timestampMs,
    signerAddress: auth.signerAddress,
  });

  result.verify = {
    attempted: true,
    verified,
    has_signer_address: Boolean(auth.signerAddress?.trim()),
    timestamp_skew_ms:
      typeof auth.timestampMs === 'number' && Number.isFinite(auth.timestampMs)
        ? Math.abs(Date.now() - auth.timestampMs)
        : null,
    owner_message: owner.startsWith('0x') ? buildWalletAuthMessage(owner, auth.timestampMs) : '',
    rejection_reason: verified ? null : rejectionReason({ owner, auth }),
  };

  return result;
}