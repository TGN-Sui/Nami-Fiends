import { config } from '../config.js';
import { readJsonFile } from '../storage.js';
import type { ChannelStore } from './channel.service.js';
import { getOfficialsSubmissions } from './officials-submissions.service.js';

type RecordLike = Record<string, unknown> & { id?: string; channelId?: string };

type ChannelRegistryLike = {
  channels: {
    getChannel(channelId: string): { owner: string } | undefined;
  };
};

function normalizeOwner(owner: string): string {
  return owner.trim().toLowerCase();
}

function readRecordChannelId(record: RecordLike): string | null {
  const id = typeof record.channelId === 'string' ? record.channelId : record.id;

  return typeof id === 'string' && id.trim() ? id.trim() : null;
}

function readRecordOwner(record: RecordLike, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.startsWith('0x')) {
      return value;
    }
  }

  return null;
}

function ownerFromGameTickets(gameTickets: unknown[], channelId: string): string | null {
  for (const entry of gameTickets) {
    if (entry === null || typeof entry !== 'object') {
      continue;
    }

    const record = entry as RecordLike;
    const ticketChannelId =
      typeof record.provisionalChannelId === 'string'
        ? record.provisionalChannelId
        : typeof record.targetChannelId === 'string'
          ? record.targetChannelId
          : readRecordChannelId(record);

    if (ticketChannelId !== channelId) {
      continue;
    }

    const owner = readRecordOwner(record, [
      'submittedByOwner',
      'owner',
      'submittedBy',
      'createdByOwner',
    ]);

    if (owner) {
      return owner;
    }
  }

  return null;
}

function ownerFromProvisionedChannels(channels: unknown[], channelId: string): string | null {
  for (const entry of channels) {
    if (entry === null || typeof entry !== 'object') {
      continue;
    }

    const record = entry as RecordLike;
    const id = readRecordChannelId(record);

    if (id !== channelId) {
      continue;
    }

    return readRecordOwner(record, ['createdByOwner', 'owner']);
  }

  return null;
}

async function ownerFromChannelProjection(channelId: string): Promise<string | null> {
  const store = await readJsonFile<ChannelStore>(
    `${config.dataDir}/projections/channels.json`,
    {},
  );
  const projected = store[channelId];

  return projected?.owner?.startsWith('0x') ? projected.owner : null;
}

/** Resolve the wallet that may operate promotions for a channel. */
export async function resolveChannelOwnerWallet(
  channelId: string,
  registry?: ChannelRegistryLike | null,
): Promise<string | null> {
  const normalizedChannelId = channelId.trim();

  if (!normalizedChannelId) {
    return null;
  }

  if (registry) {
    const projected = registry.channels.getChannel(normalizedChannelId);

    if (projected?.owner?.startsWith('0x')) {
      return projected.owner;
    }
  } else {
    const projectedOwner = await ownerFromChannelProjection(normalizedChannelId);

    if (projectedOwner) {
      return projectedOwner;
    }
  }

  const officials = await getOfficialsSubmissions();

  const provisionedOwner = ownerFromProvisionedChannels(
    officials.ownerProvisionedChannels,
    normalizedChannelId,
  );

  if (provisionedOwner) {
    return provisionedOwner;
  }

  return ownerFromGameTickets(officials.gameTickets, normalizedChannelId);
}

export async function assertChannelOwnerWallet(
  channelId: string,
  owner: string,
  registry?: ChannelRegistryLike | null,
): Promise<void> {
  const resolvedOwner = await resolveChannelOwnerWallet(channelId, registry);

  if (!resolvedOwner?.startsWith('0x')) {
    throw new Error('channel_not_found');
  }

  if (normalizeOwner(resolvedOwner) !== normalizeOwner(owner)) {
    throw new Error('not_channel_owner');
  }
}