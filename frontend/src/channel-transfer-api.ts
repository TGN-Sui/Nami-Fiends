import { isIndexerLive, isTestLaunchMode, readAppConfig } from './app-config.js';
import { readMemberSession } from './member-session-store.js';
import { readIndexerUrl } from './protocol-env.js';
import { createWalletAuthPayload, readWalletAuthOwner } from './wallet-auth.js';
import { readGameOfficialSocialAuthState } from './game-official-social-auth-store.js';

export type ChannelTransferTargetKind = 'email' | 'wallet' | 'x';

export type ChannelOwnershipTransfer = {
  id: string;
  channelId: string;
  gameTitle: string;
  channelHandle: string;
  fromOwner: string;
  targetKind: ChannelTransferTargetKind;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  createdAtMs: number;
  expiresAtMs: number;
  acceptedBy?: string;
  acceptedAtMs?: number;
};

function apiBase(): string | null {
  const url = readIndexerUrl();

  if (!url) {
    return null;
  }

  return url.replace(/\/$/, '');
}

export function isChannelTransferApiAvailable(): boolean {
  return isIndexerLive(readAppConfig()) && isTestLaunchMode();
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const base = apiBase();

  if (!base) {
    throw new Error('Channel transfer API is not configured. Set VITE_NAMI_INDEXER_URL.');
  }

  const response = await fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? 'channel_transfer_request_failed');
  }

  return (await response.json()) as T;
}

async function authorizedBody(
  extra: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const owner = readWalletAuthOwner();

  if (!owner?.startsWith('0x')) {
    throw new Error('channel_transfer_auth_required');
  }

  const auth = await createWalletAuthPayload(owner);
  const session = readMemberSession();
  const social = readGameOfficialSocialAuthState();

  return {
    owner,
    auth,
    syncEmail: session?.email ?? '',
    linkedXHandle: social.platform === 'x' ? social.handle : '',
    ...extra,
  };
}

export async function createChannelOwnershipTransfer(input: {
  channelId: string;
  targetKind: ChannelTransferTargetKind;
  targetEmail?: string;
  targetWallet?: string;
  targetXHandle?: string;
}): Promise<ChannelOwnershipTransfer> {
  const payload = await postJson<{ transfer: ChannelOwnershipTransfer }>(
    '/api/channel-transfers/create',
    await authorizedBody(input)
  );

  return payload.transfer;
}

export async function fetchPendingChannelTransfers(input?: {
  transferId?: string;
}): Promise<ChannelOwnershipTransfer[]> {
  const payload = await postJson<{ transfers: ChannelOwnershipTransfer[] }>(
    '/api/channel-transfers/pending',
    await authorizedBody(input ?? {})
  );

  return payload.transfers;
}

export async function respondToChannelTransfer(input: {
  transferId: string;
  decision: 'accept' | 'decline';
}): Promise<ChannelOwnershipTransfer> {
  const payload = await postJson<{ transfer: ChannelOwnershipTransfer }>(
    '/api/channel-transfers/respond',
    await authorizedBody(input)
  );

  return payload.transfer;
}

export async function cancelChannelOwnershipTransfer(
  transferId: string
): Promise<ChannelOwnershipTransfer> {
  const payload = await postJson<{ transfer: ChannelOwnershipTransfer }>(
    '/api/channel-transfers/cancel',
    await authorizedBody({ transferId })
  );

  return payload.transfer;
}