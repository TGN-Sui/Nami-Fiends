import { isIndexerLive, isTestLaunchMode, readAppConfig } from './app-config.js';
import { readIndexerUrl, readWalletAuthRequired } from './protocol-env.js';
import {
  canPromptWalletSignature,
  createWalletAuthPayload,
  readWalletAuthOwner,
} from './wallet-auth.js';

export type PlatformOwnerAssetsProjection = {
  assets: Record<string, string>;
  updatedAtMs: number;
};

export type PlatformOwnerAssetsApiErrorCode =
  | 'not_configured'
  | 'wallet_auth_unavailable'
  | 'wallet_auth_required'
  | 'wallet_auth_invalid'
  | 'official_owner_required'
  | 'invalid_file_size'
  | 'invalid_asset_value'
  | 'channel_media_not_hydrated'
  | 'request_failed';

export class PlatformOwnerAssetsApiError extends Error {
  readonly code: PlatformOwnerAssetsApiErrorCode;
  readonly status: number;

  constructor(code: PlatformOwnerAssetsApiErrorCode, status: number, message: string) {
    super(message);
    this.name = 'PlatformOwnerAssetsApiError';
    this.code = code;
    this.status = status;
  }
}

function apiBase(): string | null {
  const url = readIndexerUrl();

  if (!url) {
    return null;
  }

  return url.replace(/\/$/, '');
}

/** Server-backed platform artwork — required on official testnet builds. */
export function isPlatformOwnerAssetsApiAvailable(): boolean {
  if (!isIndexerLive(readAppConfig())) {
    return false;
  }

  return isTestLaunchMode();
}

function mapResponseError(status: number, body: Record<string, unknown>): PlatformOwnerAssetsApiError {
  const error = typeof body.error === 'string' ? body.error : '';
  const message = typeof body.message === 'string' ? body.message : '';

  if (error === 'wallet_auth_required') {
    return new PlatformOwnerAssetsApiError(
      'wallet_auth_required',
      status,
      'Wallet signature is required. Connect your official owner wallet or zkLogin session, then save again.'
    );
  }

  if (error === 'wallet_auth_invalid') {
    return new PlatformOwnerAssetsApiError(
      'wallet_auth_invalid',
      status,
      'Wallet signature was rejected. Reconnect zkLogin or your wallet extension, then save again.'
    );
  }

  if (error === 'official_owner_required') {
    return new PlatformOwnerAssetsApiError(
      'official_owner_required',
      status,
      'This deploy only accepts artwork from the configured official owner wallet.'
    );
  }

  if (message.includes('invalid_file_size')) {
    return new PlatformOwnerAssetsApiError(
      'invalid_file_size',
      status,
      'One of the artwork files is too large for the receiving server. Upload a smaller image or video.'
    );
  }

  if (message.includes('invalid_asset_value') || message.includes('invalid_channel_media_ref')) {
    return new PlatformOwnerAssetsApiError(
      'invalid_asset_value',
      status,
      'One of the artwork slots still points at local-only media. Re-upload that slot, then save again.'
    );
  }

  return new PlatformOwnerAssetsApiError(
    'request_failed',
    status,
    message || 'Platform owner assets API request failed (' + status + ').'
  );
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = apiBase();

  if (!base) {
    throw new PlatformOwnerAssetsApiError(
      'not_configured',
      0,
      'Platform owner assets API is not configured. Set VITE_NAMI_INDEXER_URL.'
    );
  }

  let response: Response;

  try {
    response = await fetch(base + path, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new PlatformOwnerAssetsApiError(
      'request_failed',
      0,
      'Could not reach the receiving server. Check your connection and try again.'
    );
  }

  let body: Record<string, unknown> = {};

  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  if (!response.ok) {
    throw mapResponseError(response.status, body);
  }

  return body as T;
}

export async function fetchPlatformOwnerAssets(): Promise<PlatformOwnerAssetsProjection> {
  const payload = await fetchJson<{ assets: PlatformOwnerAssetsProjection }>('/api/platform/owner-assets');
  return payload.assets;
}

async function resolveWalletAuthForSync(owner: string) {
  if (!readWalletAuthRequired()) {
    return null;
  }

  if (!canPromptWalletSignature(owner)) {
    throw new PlatformOwnerAssetsApiError(
      'wallet_auth_unavailable',
      0,
      'Reconnect zkLogin or your official owner wallet to authorize artwork uploads, then save again.'
    );
  }

  try {
    const auth = await createWalletAuthPayload(owner);

    if (!auth?.signature || !Number.isFinite(auth.timestampMs)) {
      throw new PlatformOwnerAssetsApiError(
        'wallet_auth_unavailable',
        0,
        'Reconnect zkLogin or your official owner wallet to authorize artwork uploads, then save again.'
      );
    }

    return auth;
  } catch (error) {
    if (error instanceof PlatformOwnerAssetsApiError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Could not sign artwork upload request.';

    if (message.includes('Reconnect zkLogin')) {
      throw new PlatformOwnerAssetsApiError('wallet_auth_unavailable', 0, message);
    }

    throw new PlatformOwnerAssetsApiError('wallet_auth_unavailable', 0, message);
  }
}

export async function syncPlatformOwnerAssets(
  assets: Record<string, string>,
  ownerOverride?: string | null
): Promise<PlatformOwnerAssetsProjection> {
  const owner = ownerOverride ?? readWalletAuthOwner();

  if (!owner?.startsWith('0x')) {
    throw new PlatformOwnerAssetsApiError(
      'wallet_auth_unavailable',
      0,
      'Platform owner assets sync requires a connected wallet or zkLogin session.'
    );
  }

  const auth = await resolveWalletAuthForSync(owner);
  const payload = await fetchJson<{ assets: PlatformOwnerAssetsProjection }>(
    '/api/platform/owner-assets/sync',
    {
      method: 'POST',
      body: JSON.stringify({
        owner,
        assets,
        auth,
      }),
    }
  );

  return payload.assets;
}