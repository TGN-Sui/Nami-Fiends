import { readJsonFile, writeJsonFile } from '../storage.js';
import {
  getOfficialsSubmissions,
  syncOfficialsSubmissions,
} from './officials-submissions.service.js';
import { sendChannelTransferInviteEmail } from './transfer-email.service.js';

export type ChannelTransferTargetKind = 'email' | 'wallet' | 'x';

export type ChannelTransferStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'expired';

export type ChannelOwnershipTransfer = {
  id: string;
  channelId: string;
  gameTitle: string;
  channelHandle: string;
  fromOwner: string;
  targetKind: ChannelTransferTargetKind;
  targetEmail?: string;
  targetWallet?: string;
  targetXHandle?: string;
  status: ChannelTransferStatus;
  createdAtMs: number;
  expiresAtMs: number;
  acceptedBy?: string;
  acceptedAtMs?: number;
  emailSentAtMs?: number;
  emailError?: string;
};

type ChannelTransfersProjection = {
  transfers: ChannelOwnershipTransfer[];
  updatedAtMs: number;
};

const PROJECTION_PATH = 'data/projections/channel-transfers.json';
const TRANSFER_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function emptyProjection(): ChannelTransfersProjection {
  return { transfers: [], updatedAtMs: Date.now() };
}

async function readProjection(): Promise<ChannelTransfersProjection> {
  const stored = await readJsonFile<ChannelTransfersProjection>(PROJECTION_PATH, emptyProjection());

  return {
    transfers: Array.isArray(stored.transfers) ? stored.transfers : [],
    updatedAtMs: typeof stored.updatedAtMs === 'number' ? stored.updatedAtMs : Date.now(),
  };
}

async function writeProjection(projection: ChannelTransfersProjection): Promise<void> {
  await writeJsonFile(PROJECTION_PATH, {
    ...projection,
    updatedAtMs: Date.now(),
  });
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeWallet(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeXHandle(value: string): string {
  return value.trim().replace(/^@+/, '').toLowerCase();
}

function asTransfer(entry: unknown): ChannelOwnershipTransfer | null {
  if (entry === null || typeof entry !== 'object') {
    return null;
  }

  const record = entry as Record<string, unknown>;

  if (typeof record.id !== 'string' || typeof record.channelId !== 'string') {
    return null;
  }

  const targetKind = record.targetKind;

  if (targetKind !== 'email' && targetKind !== 'wallet' && targetKind !== 'x') {
    return null;
  }

  const status = record.status;

  if (
    status !== 'pending' &&
    status !== 'accepted' &&
    status !== 'declined' &&
    status !== 'cancelled' &&
    status !== 'expired'
  ) {
    return null;
  }

  return {
    id: record.id,
    channelId: record.channelId,
    gameTitle: typeof record.gameTitle === 'string' ? record.gameTitle : 'Game Channel',
    channelHandle: typeof record.channelHandle === 'string' ? record.channelHandle : 'channel',
    fromOwner: typeof record.fromOwner === 'string' ? record.fromOwner : '',
    targetKind,
    ...(typeof record.targetEmail === 'string' ? { targetEmail: normalizeEmail(record.targetEmail) } : {}),
    ...(typeof record.targetWallet === 'string'
      ? { targetWallet: normalizeWallet(record.targetWallet) }
      : {}),
    ...(typeof record.targetXHandle === 'string'
      ? { targetXHandle: normalizeXHandle(record.targetXHandle) }
      : {}),
    status,
    createdAtMs: typeof record.createdAtMs === 'number' ? record.createdAtMs : Date.now(),
    expiresAtMs: typeof record.expiresAtMs === 'number' ? record.expiresAtMs : Date.now(),
    ...(typeof record.acceptedBy === 'string' ? { acceptedBy: record.acceptedBy } : {}),
    ...(typeof record.acceptedAtMs === 'number' ? { acceptedAtMs: record.acceptedAtMs } : {}),
    ...(typeof record.emailSentAtMs === 'number' ? { emailSentAtMs: record.emailSentAtMs } : {}),
    ...(typeof record.emailError === 'string' ? { emailError: record.emailError } : {}),
  };
}

function expireStaleTransfers(transfers: ChannelOwnershipTransfer[]): ChannelOwnershipTransfer[] {
  const now = Date.now();

  return transfers.map((transfer) => {
    if (transfer.status === 'pending' && transfer.expiresAtMs <= now) {
      return { ...transfer, status: 'expired' as const };
    }

    return transfer;
  });
}

type OwnerProvisionedChannelRecord = Record<string, unknown> & { id: string; channelId?: string };

function findProvisionedChannel(
  channels: unknown[],
  channelId: string
): OwnerProvisionedChannelRecord | null {
  for (const entry of channels) {
    if (entry === null || typeof entry !== 'object') {
      continue;
    }

    const record = entry as OwnerProvisionedChannelRecord;
    const id = typeof record.channelId === 'string' ? record.channelId : record.id;

    if (id === channelId) {
      return record;
    }
  }

  return null;
}

async function setProvisionedChannelStatus(
  channelId: string,
  status: string,
  patch: Record<string, unknown> = {}
): Promise<void> {
  const officials = await getOfficialsSubmissions();
  const channels = [...officials.ownerProvisionedChannels];
  const index = channels.findIndex((entry) => {
    const record = entry as OwnerProvisionedChannelRecord;
    const id = typeof record.channelId === 'string' ? record.channelId : record.id;

    return id === channelId;
  });

  if (index < 0) {
    return;
  }

  const current = channels[index] as OwnerProvisionedChannelRecord;
  channels[index] = {
    ...current,
    status,
    ...patch,
  };

  await syncOfficialsSubmissions({ ownerProvisionedChannels: channels });
}

export type CreateChannelTransferInput = {
  channelId: string;
  fromOwner: string;
  targetKind: ChannelTransferTargetKind;
  targetEmail?: string;
  targetWallet?: string;
  targetXHandle?: string;
};

export async function createChannelOwnershipTransfer(
  input: CreateChannelTransferInput
): Promise<ChannelOwnershipTransfer> {
  const officials = await getOfficialsSubmissions();
  const channel = findProvisionedChannel(officials.ownerProvisionedChannels, input.channelId);

  if (!channel) {
    throw new Error('channel_not_found');
  }

  const createdByOwner =
    typeof channel.createdByOwner === 'string' ? channel.createdByOwner.toLowerCase() : '';

  if (createdByOwner !== input.fromOwner.toLowerCase()) {
    throw new Error('not_channel_owner');
  }

  const channelStatus = typeof channel.status === 'string' ? channel.status : 'unclaimed';

  if (channelStatus === 'claimed' || channelStatus === 'transfer-pending') {
    throw new Error('channel_not_transferable');
  }

  const projection = await readProjection();
  const hasPending = projection.transfers.some(
    (transfer) => transfer.channelId === input.channelId && transfer.status === 'pending'
  );

  if (hasPending) {
    throw new Error('transfer_already_pending');
  }

  const now = Date.now();
  const transferId = 'transfer-' + input.channelId + '-' + now.toString(36);

  const transfer: ChannelOwnershipTransfer = {
    id: transferId,
    channelId: input.channelId,
    gameTitle: typeof channel.gameTitle === 'string' ? channel.gameTitle : 'Game Channel',
    channelHandle: typeof channel.handle === 'string' ? channel.handle : 'channel',
    fromOwner: input.fromOwner,
    targetKind: input.targetKind,
    status: 'pending',
    createdAtMs: now,
    expiresAtMs: now + TRANSFER_TTL_MS,
    ...(input.targetKind === 'email' && input.targetEmail
      ? { targetEmail: normalizeEmail(input.targetEmail) }
      : {}),
    ...(input.targetKind === 'wallet' && input.targetWallet
      ? { targetWallet: normalizeWallet(input.targetWallet) }
      : {}),
    ...(input.targetKind === 'x' && input.targetXHandle
      ? { targetXHandle: normalizeXHandle(input.targetXHandle) }
      : {}),
  };

  if (transfer.targetKind === 'email' && !transfer.targetEmail) {
    throw new Error('target_email_required');
  }

  if (transfer.targetKind === 'wallet' && !transfer.targetWallet) {
    throw new Error('target_wallet_required');
  }

  if (transfer.targetKind === 'x' && !transfer.targetXHandle) {
    throw new Error('target_x_handle_required');
  }

  const emailResult =
    transfer.targetKind === 'email' && transfer.targetEmail
      ? await sendChannelTransferInviteEmail({
          toEmail: transfer.targetEmail,
          gameTitle: transfer.gameTitle,
          channelHandle: transfer.channelHandle,
          transferId: transfer.id,
        })
      : null;

  if (emailResult?.ok) {
    transfer.emailSentAtMs = emailResult.sentAtMs;
  } else if (emailResult) {
    transfer.emailError = emailResult.error;
  }

  projection.transfers.unshift(transfer);
  await writeProjection(projection);
  await setProvisionedChannelStatus(input.channelId, 'transfer-pending', {
    pendingTransferId: transfer.id,
  });

  return transfer;
}

export type PendingTransferQuery = {
  owner?: string;
  syncEmail?: string;
  linkedXHandle?: string;
  transferId?: string;
};

function transferMatchesRecipient(
  transfer: ChannelOwnershipTransfer,
  query: PendingTransferQuery
): boolean {
  if (transfer.status !== 'pending') {
    return false;
  }

  if (transfer.expiresAtMs <= Date.now()) {
    return false;
  }

  if (query.transferId && transfer.id !== query.transferId) {
    return false;
  }

  if (transfer.targetKind === 'email') {
    const email = normalizeEmail(query.syncEmail ?? '');

    return email !== '' && email === transfer.targetEmail;
  }

  if (transfer.targetKind === 'wallet') {
    const wallet = normalizeWallet(query.owner ?? '');

    return wallet.startsWith('0x') && wallet === transfer.targetWallet;
  }

  if (transfer.targetKind === 'x') {
    const handle = normalizeXHandle(query.linkedXHandle ?? '');

    return handle !== '' && handle === transfer.targetXHandle;
  }

  return false;
}

export function sanitizeTransferForRecipient(
  transfer: ChannelOwnershipTransfer
): ChannelOwnershipTransfer {
  return {
    id: transfer.id,
    channelId: transfer.channelId,
    gameTitle: transfer.gameTitle,
    channelHandle: transfer.channelHandle,
    fromOwner: transfer.fromOwner,
    targetKind: transfer.targetKind,
    status: transfer.status,
    createdAtMs: transfer.createdAtMs,
    expiresAtMs: transfer.expiresAtMs,
    ...(transfer.acceptedBy ? { acceptedBy: transfer.acceptedBy } : {}),
    ...(transfer.acceptedAtMs ? { acceptedAtMs: transfer.acceptedAtMs } : {}),
  };
}

export async function listPendingChannelTransfersForRecipient(
  query: PendingTransferQuery
): Promise<ChannelOwnershipTransfer[]> {
  const projection = await readProjection();
  const transfers = expireStaleTransfers(projection.transfers);

  if (transfers !== projection.transfers) {
    await writeProjection({ transfers, updatedAtMs: Date.now() });
  }

  return transfers
    .filter((transfer) => transferMatchesRecipient(transfer, query))
    .map(sanitizeTransferForRecipient);
}

export async function respondToChannelTransfer(input: {
  transferId: string;
  responderOwner: string;
  syncEmail?: string;
  linkedXHandle?: string;
  decision: 'accept' | 'decline';
}): Promise<ChannelOwnershipTransfer> {
  const projection = await readProjection();
  const index = projection.transfers.findIndex((transfer) => transfer.id === input.transferId);

  if (index < 0) {
    throw new Error('transfer_not_found');
  }

  const transfer = projection.transfers[index]!;

  if (transfer.status !== 'pending') {
    throw new Error('transfer_not_pending');
  }

  const recipientQuery: PendingTransferQuery = {
    owner: input.responderOwner,
  };

  if (input.syncEmail) {
    recipientQuery.syncEmail = input.syncEmail;
  }

  if (input.linkedXHandle) {
    recipientQuery.linkedXHandle = input.linkedXHandle;
  }

  if (!transferMatchesRecipient(transfer, recipientQuery)) {
    throw new Error('transfer_recipient_mismatch');
  }

  if (input.decision === 'decline') {
    const declined: ChannelOwnershipTransfer = {
      ...transfer,
      status: 'declined',
      acceptedBy: input.responderOwner,
      acceptedAtMs: Date.now(),
    };

    projection.transfers[index] = declined;
    await writeProjection(projection);
    await setProvisionedChannelStatus(transfer.channelId, 'unclaimed', {
      pendingTransferId: null,
    });

    return sanitizeTransferForRecipient(declined);
  }

  const accepted: ChannelOwnershipTransfer = {
    ...transfer,
    status: 'accepted',
    acceptedBy: input.responderOwner,
    acceptedAtMs: Date.now(),
  };

  projection.transfers[index] = accepted;
  await writeProjection(projection);
  await setProvisionedChannelStatus(transfer.channelId, 'claimed', {
    pendingTransferId: null,
    claimedAtMs: Date.now(),
    claimedByWallet: input.responderOwner,
  });

  return sanitizeTransferForRecipient(accepted);
}

export async function cancelChannelTransfer(input: {
  transferId: string;
  fromOwner: string;
}): Promise<ChannelOwnershipTransfer> {
  const projection = await readProjection();
  const index = projection.transfers.findIndex((transfer) => transfer.id === input.transferId);

  if (index < 0) {
    throw new Error('transfer_not_found');
  }

  const transfer = projection.transfers[index]!;

  if (transfer.fromOwner.toLowerCase() !== input.fromOwner.toLowerCase()) {
    throw new Error('not_transfer_owner');
  }

  if (transfer.status !== 'pending') {
    throw new Error('transfer_not_pending');
  }

  const cancelled: ChannelOwnershipTransfer = {
    ...transfer,
    status: 'cancelled',
  };

  projection.transfers[index] = cancelled;
  await writeProjection(projection);
  await setProvisionedChannelStatus(transfer.channelId, 'unclaimed', {
    pendingTransferId: null,
  });

  return sanitizeTransferForRecipient(cancelled);
}