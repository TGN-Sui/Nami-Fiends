/** Testnet Walrus epoch ≈ 1 day; mainnet uses ~2 weeks — ops uses deploy-time network hint. */
export const WALRUS_SITE_EPOCH_DURATION_MS = 24 * 60 * 60 * 1000;

/** Warn when within this many epochs of expiry. */
export const WALRUS_SITE_RENEWAL_BUFFER_EPOCHS = 1;

export type WalrusSitesRenewalInput = {
  last_deploy_ms: number | null;
  last_renew_ms?: number | null;
  storage_epochs: number | string | null;
};

export type WalrusSitesRenewalStatus = {
  renewal_due: boolean;
  expires_at_ms: number | null;
  anchor_ms: number | null;
  epochs_remaining_approx: number | null;
};

export function resolveWalrusSitesAnchorMs(input: WalrusSitesRenewalInput): number | null {
  const renewMs = input.last_renew_ms ?? null;
  const deployMs = input.last_deploy_ms ?? null;

  if (renewMs !== null && deployMs !== null) {
    return Math.max(renewMs, deployMs);
  }

  return renewMs ?? deployMs;
}

export function resolveWalrusSitesStorageEpochs(storageEpochs: number | string | null): number {
  const parsed = Number(storageEpochs);

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return 5;
}

export function computeWalrusSitesRenewalStatus(
  input: WalrusSitesRenewalInput,
  nowMs = Date.now()
): WalrusSitesRenewalStatus {
  const anchorMs = resolveWalrusSitesAnchorMs(input);

  if (anchorMs === null) {
    return {
      renewal_due: false,
      expires_at_ms: null,
      anchor_ms: null,
      epochs_remaining_approx: null,
    };
  }

  const epochs = resolveWalrusSitesStorageEpochs(input.storage_epochs);
  const expiresAtMs = anchorMs + epochs * WALRUS_SITE_EPOCH_DURATION_MS;
  const bufferMs = WALRUS_SITE_RENEWAL_BUFFER_EPOCHS * WALRUS_SITE_EPOCH_DURATION_MS;
  const renewalDue = nowMs >= expiresAtMs - bufferMs;
  const remainingMs = Math.max(0, expiresAtMs - nowMs);
  const epochsRemainingApprox = Math.ceil(remainingMs / WALRUS_SITE_EPOCH_DURATION_MS);

  return {
    renewal_due: renewalDue,
    expires_at_ms: expiresAtMs,
    anchor_ms: anchorMs,
    epochs_remaining_approx: epochsRemainingApprox,
  };
}