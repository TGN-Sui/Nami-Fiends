import { isIndexerLive, isTestLaunchMode, readAppConfig } from './app-config.js';
import { readIndexerUrl, readWalletAuthRequired } from './protocol-env.js';
import type { OfficialChatOverlayReward } from './official-chat-overlay-rewards-store.js';
import { createCatalogSyncAuthPayload, readWalletAuthOwner } from './wallet-auth.js';

export type ChatOverlayRewardsCatalog = {
  rewards: OfficialChatOverlayReward[];
  updatedAtMs: number;
};

export type ChatOverlayRewardsApiErrorCode =
  | 'not_configured'
  | 'wallet_auth_unavailable'
  | 'wallet_auth_required'
  | 'wallet_auth_invalid'
  | 'official_owner_required'
  | 'invalid_file_size'
  | 'invalid_art_value'
  | 'quilt_publish_failed'
  | 'request_failed';

export class ChatOverlayRewardsApiError extends Error {
  readonly code: ChatOverlayRewardsApiErrorCode;
  readonly status: number;

  constructor(code: ChatOverlayRewardsApiErrorCode, status: number, message: string) {
    super(message);
    this.name = 'ChatOverlayRewardsApiError';
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

/** Server-backed border art catalog — required on official testnet builds. */
export function isChatOverlayRewardsApiAvailable(): boolean {
  if (!isIndexerLive(readAppConfig())) {
    return false;
  }

  return isTestLaunchMode();
}

function mapResponseError(status: number, body: Record<string, unknown>): ChatOverlayRewardsApiError {
  const error = typeof body.error === 'string' ? body.error : '';
  const message = typeof body.message === 'string' ? body.message : '';

  if (error === 'wallet_auth_required') {
    return new ChatOverlayRewardsApiError(
      'wallet_auth_required',
      status,
      'Wallet signature is required. Connect your official owner wallet or zkLogin session, then save again.'
    );
  }

  if (error === 'wallet_auth_invalid' || message.startsWith('wallet_auth_invalid')) {
    const reason = message.includes(':') ? message.split(':').slice(1).join(':') : '';
    const detail =
      reason === 'missing_signer_address'
        ? 'zkLogin signature was missing signer metadata. Disconnect any Sui wallet extension, sign out of zkLogin, sign in with Google again, then save.'
        : reason === 'timestamp_skew'
          ? 'Wallet signature expired. Save again immediately after signing in.'
          : reason === 'signature_mismatch'
            ? 'A different wallet may be signing than the official owner address. Disconnect browser wallet extensions and use zkLogin only.'
            : 'Wallet signature was rejected. Disconnect any Sui wallet extension, reconnect zkLogin, then save again.';

    return new ChatOverlayRewardsApiError('wallet_auth_invalid', status, detail);
  }

  if (error === 'official_owner_required') {
    return new ChatOverlayRewardsApiError(
      'official_owner_required',
      status,
      'This deploy only accepts border art from the configured official owner wallet.'
    );
  }

  if (message.includes('invalid_file_size')) {
    return new ChatOverlayRewardsApiError(
      'invalid_file_size',
      status,
      'One of the border art files is too large for the receiving server. Upload a smaller image.'
    );
  }

  if (message.includes('invalid_art_value')) {
    return new ChatOverlayRewardsApiError(
      'invalid_art_value',
      status,
      'One of the border art slots still points at local-only media. Re-upload that art, then save again.'
    );
  }

  if (error === 'quilt_publish_failed' || message.includes('quilt_publish_failed')) {
    return new ChatOverlayRewardsApiError(
      'quilt_publish_failed',
      status,
      'Walrus quilt publish failed. Your border art is saved locally — try saving again in a moment.'
    );
  }

  return new ChatOverlayRewardsApiError(
    'request_failed',
    status,
    message || 'Chat overlay rewards API request failed (' + status + ').'
  );
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = apiBase();

  if (!base) {
    throw new ChatOverlayRewardsApiError(
      'not_configured',
      0,
      'Chat overlay rewards API is not configured. Set VITE_NAMI_INDEXER_URL.'
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
    throw new ChatOverlayRewardsApiError(
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

export async function fetchChatOverlayRewardsCatalog(): Promise<ChatOverlayRewardsCatalog> {
  const payload = await fetchJson<{ catalog: ChatOverlayRewardsCatalog }>(
    '/api/platform/chat-overlay-rewards'
  );

  return payload.catalog;
}

async function resolveWalletAuthForSync(owner: string) {
  if (!readWalletAuthRequired()) {
    return null;
  }

  try {
    const auth = await createCatalogSyncAuthPayload(owner);

    if (!auth?.signature || !Number.isFinite(auth.timestampMs)) {
      throw new ChatOverlayRewardsApiError(
        'wallet_auth_unavailable',
        0,
        'Reconnect zkLogin or your official owner wallet to authorize border art uploads, then save again.'
      );
    }

    return auth;
  } catch (error) {
    if (error instanceof ChatOverlayRewardsApiError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : 'Could not sign border art upload request.';

    if (message.includes('Reconnect zkLogin')) {
      throw new ChatOverlayRewardsApiError('wallet_auth_unavailable', 0, message);
    }

    throw new ChatOverlayRewardsApiError('wallet_auth_unavailable', 0, message);
  }
}

export async function syncChatOverlayRewardsCatalog(
  rewards: OfficialChatOverlayReward[],
  ownerOverride?: string | null
): Promise<ChatOverlayRewardsCatalog> {
  const owner = ownerOverride ?? readWalletAuthOwner();

  if (!owner?.startsWith('0x')) {
    throw new ChatOverlayRewardsApiError(
      'wallet_auth_unavailable',
      0,
      'Border art sync requires a connected wallet or zkLogin session.'
    );
  }

  const auth = await resolveWalletAuthForSync(owner);
  const payload = await fetchJson<{ catalog: ChatOverlayRewardsCatalog }>(
    '/api/platform/chat-overlay-rewards/sync',
    {
      method: 'POST',
      body: JSON.stringify({
        owner,
        rewards,
        auth,
      }),
    }
  );

  return payload.catalog;
}