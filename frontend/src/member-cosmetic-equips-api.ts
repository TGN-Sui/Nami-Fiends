import { isIndexerLive, isTestLaunchMode, readAppConfig } from './app-config.js';
import { readIndexerUrl, readWalletAuthRequired } from './protocol-env.js';
import {
  canPromptEquipSyncSignature,
  createEquipSyncAuthPayload,
  readWalletAuthOwner,
} from './wallet-auth.js';

export type MemberCosmeticEquipsProjection = {
  equips: Record<string, string>;
  updatedAtMs: number;
};

export type MemberCosmeticEquipsApiErrorCode =
  | 'not_configured'
  | 'wallet_auth_unavailable'
  | 'wallet_auth_required'
  | 'wallet_auth_invalid'
  | 'request_failed';

export class MemberCosmeticEquipsApiError extends Error {
  readonly code: MemberCosmeticEquipsApiErrorCode;
  readonly status: number;

  constructor(code: MemberCosmeticEquipsApiErrorCode, status: number, message: string) {
    super(message);
    this.name = 'MemberCosmeticEquipsApiError';
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

export function isMemberCosmeticEquipsApiAvailable(): boolean {
  if (!isIndexerLive(readAppConfig())) {
    return false;
  }

  return isTestLaunchMode();
}

function mapResponseError(status: number, body: Record<string, unknown>): MemberCosmeticEquipsApiError {
  const error = typeof body.error === 'string' ? body.error : '';
  const message = typeof body.message === 'string' ? body.message : '';

  if (error === 'wallet_auth_required') {
    return new MemberCosmeticEquipsApiError(
      'wallet_auth_required',
      status,
      'Wallet signature is required to save your chat border equip.'
    );
  }

  if (error === 'wallet_auth_invalid') {
    return new MemberCosmeticEquipsApiError(
      'wallet_auth_invalid',
      status,
      'Wallet signature was rejected. Reconnect zkLogin or your wallet extension, then try again.'
    );
  }

  return new MemberCosmeticEquipsApiError(
    'request_failed',
    status,
    message || 'Member cosmetic equips API request failed (' + status + ').'
  );
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = apiBase();

  if (!base) {
    throw new MemberCosmeticEquipsApiError(
      'not_configured',
      0,
      'Member cosmetic equips API is not configured. Set VITE_NAMI_INDEXER_URL.'
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
    throw new MemberCosmeticEquipsApiError(
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

export async function fetchMemberCosmeticEquips(): Promise<MemberCosmeticEquipsProjection> {
  const payload = await fetchJson<{ equips: MemberCosmeticEquipsProjection }>(
    '/api/member-cosmetics/equips'
  );

  return payload.equips;
}

async function resolveWalletAuthForSync(owner: string) {
  if (!readWalletAuthRequired()) {
    return null;
  }

  if (!canPromptEquipSyncSignature(owner)) {
    throw new MemberCosmeticEquipsApiError(
      'wallet_auth_unavailable',
      0,
      'Reconnect zkLogin or your wallet to save chat border equips.'
    );
  }

  const auth = await createEquipSyncAuthPayload(owner);

  if (!auth?.signature || !Number.isFinite(auth.timestampMs)) {
    throw new MemberCosmeticEquipsApiError(
      'wallet_auth_unavailable',
      0,
      'Reconnect zkLogin or your wallet to save chat border equips.'
    );
  }

  return auth;
}

export async function syncMemberCosmeticEquipToBackend(input: {
  memberId: string;
  chatOverlayDisplay: string;
  ownerOverride?: string | null;
}): Promise<MemberCosmeticEquipsProjection> {
  const owner = input.ownerOverride ?? readWalletAuthOwner();

  if (!owner?.startsWith('0x')) {
    throw new MemberCosmeticEquipsApiError(
      'wallet_auth_unavailable',
      0,
      'Chat border equip sync requires a connected wallet or zkLogin session.'
    );
  }

  const auth = await resolveWalletAuthForSync(owner);
  const payload = await fetchJson<{ equips: MemberCosmeticEquipsProjection }>(
    '/api/member-cosmetics/equips/sync',
    {
      method: 'POST',
      body: JSON.stringify({
        owner,
        memberId: input.memberId,
        chatOverlayDisplay: input.chatOverlayDisplay,
        auth,
      }),
    }
  );

  return payload.equips;
}