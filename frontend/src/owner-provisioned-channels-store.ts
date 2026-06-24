import { useSyncExternalStore } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';
import { normalizeSupportedPlatforms } from './platform-genre-options.js';

const STORAGE_KEY = 'nami.owner.provisioned.channels';
const ACTIVE_OWNER_PROVISIONED_CHANNEL_KEY = 'nami.official-owner.active-provisioned-channel-id';

export type OwnerProvisionedChannelStatus =
  | 'unclaimed'
  | 'claim-pending'
  | 'transfer-pending'
  | 'claimed';

export type OwnerProvisionedChannelSnapshot = {
  tagline?: string;
  genres?: string[];
  platforms?: string[];
  settingsDraft?: Record<string, unknown>;
  updatedAtMs: number;
};

export type OwnerProvisionedChannel = {
  id: string;
  channelId: string;
  gameTitle: string;
  handle: string;
  genre: string;
  platforms: string[];
  tagline: string;
  status: OwnerProvisionedChannelStatus;
  createdByOwner: string;
  createdAtMs: number;
  claimTicketId?: string;
  claimedAtMs?: number;
  claimedByWallet?: string;
  pendingTransferId?: string;
  ownerSnapshot?: OwnerProvisionedChannelSnapshot;
};

export type CreateOwnerProvisionedChannelInput = {
  gameTitle: string;
  handle: string;
  genre: string;
  platforms: string[];
  tagline?: string;
};

export type CreateOwnerProvisionedChannelResult = {
  ok: boolean;
  channel?: OwnerProvisionedChannel;
  message: string;
};

let cachedChannels: OwnerProvisionedChannel[] | undefined;

function invalidateCache(): void {
  cachedChannels = undefined;
}

function emitChange(): void {
  invalidateCache();
  window.dispatchEvent(new CustomEvent('nami-owner-provisioned-channels-changed'));
}

function normalizeHandle(handle: string): string {
  return handle
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20);
}

function normalizeChannel(entry: Partial<OwnerProvisionedChannel>): OwnerProvisionedChannel | null {
  if (typeof entry.channelId !== 'string' || typeof entry.gameTitle !== 'string') {
    return null;
  }

  const status =
    entry.status === 'claim-pending' ||
    entry.status === 'transfer-pending' ||
    entry.status === 'claimed' ||
    entry.status === 'unclaimed'
      ? entry.status
      : 'unclaimed';

  return {
    id: typeof entry.id === 'string' ? entry.id : entry.channelId,
    channelId: entry.channelId,
    gameTitle: entry.gameTitle.trim(),
    handle: normalizeHandle(typeof entry.handle === 'string' ? entry.handle : entry.gameTitle),
    genre: typeof entry.genre === 'string' && entry.genre.trim() !== '' ? entry.genre.trim() : 'Indie',
    platforms: Array.isArray(entry.platforms)
      ? normalizeSupportedPlatforms(
          entry.platforms.filter((platform): platform is string => typeof platform === 'string')
        )
      : ['PC'],
    tagline:
      typeof entry.tagline === 'string' && entry.tagline.trim() !== ''
        ? entry.tagline.trim()
        : 'Owner-provisioned game channel — claimable with valid proof.',
    status,
    createdByOwner: typeof entry.createdByOwner === 'string' ? entry.createdByOwner : 'official-owner',
    createdAtMs: typeof entry.createdAtMs === 'number' ? entry.createdAtMs : Date.now(),
    ...(typeof entry.claimTicketId === 'string' ? { claimTicketId: entry.claimTicketId } : {}),
    ...(typeof entry.claimedAtMs === 'number' ? { claimedAtMs: entry.claimedAtMs } : {}),
    ...(typeof entry.claimedByWallet === 'string' ? { claimedByWallet: entry.claimedByWallet } : {}),
    ...(typeof entry.pendingTransferId === 'string'
      ? { pendingTransferId: entry.pendingTransferId }
      : {}),
    ...(entry.ownerSnapshot && typeof entry.ownerSnapshot === 'object'
      ? { ownerSnapshot: entry.ownerSnapshot as OwnerProvisionedChannelSnapshot }
      : {}),
  };
}

function readChannels(): OwnerProvisionedChannel[] {
  if (cachedChannels) {
    return cachedChannels;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      cachedChannels = [];
      return cachedChannels;
    }

    const parsed = JSON.parse(stored) as Partial<OwnerProvisionedChannel>[];
    cachedChannels = Array.isArray(parsed)
      ? parsed.flatMap((entry) => {
          const normalized = normalizeChannel(entry);
          return normalized ? [normalized] : [];
        })
      : [];

    return cachedChannels;
  } catch {
    cachedChannels = [];
    return cachedChannels;
  }
}

function writeChannels(channels: OwnerProvisionedChannel[]): void {
  const next = channels.slice(0, 200);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emitChange();
  void import('./officials-submissions-sync.js').then(({ syncOwnerProvisionedChannelsToServer }) => {
    syncOwnerProvisionedChannelsToServer(next);
  });
}

function subscribe(onStoreChange: () => void): () => void {
  function handleChange(): void {
    onStoreChange();
  }

  window.addEventListener('nami-owner-provisioned-channels-changed', handleChange);

  return () => {
    window.removeEventListener('nami-owner-provisioned-channels-changed', handleChange);
  };
}

export function useOwnerProvisionedChannels(): OwnerProvisionedChannel[] {
  return useSyncExternalStore(subscribe, readChannels, readChannels);
}

export function saveActiveOwnerProvisionedChannelId(channelId: string): void {
  window.localStorage.setItem(ACTIVE_OWNER_PROVISIONED_CHANNEL_KEY, channelId);
}

export function readActiveOwnerProvisionedChannelId(): string | null {
  try {
    const stored = window.localStorage.getItem(ACTIVE_OWNER_PROVISIONED_CHANNEL_KEY);

    return stored && stored.trim().length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function listOwnerProvisionedChannelsSorted(): OwnerProvisionedChannel[] {
  return [...readChannels()].sort((left, right) => right.createdAtMs - left.createdAtMs);
}

export function listClaimableOwnerProvisionedChannels(): OwnerProvisionedChannel[] {
  return listOwnerProvisionedChannelsSorted().filter((entry) => entry.status === 'unclaimed');
}

export function ownerProvisionedChannelById(channelId: string): OwnerProvisionedChannel | undefined {
  return readChannels().find((entry) => entry.channelId === channelId);
}

export function createOwnerProvisionedChannelId(gameTitle: string): string {
  const slug = gameTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

  return 'owner-game-' + (slug || 'channel') + '-' + Date.now().toString(36);
}

export function createOwnerProvisionedChannel(
  input: CreateOwnerProvisionedChannelInput,
  actorOwner: string | null
): CreateOwnerProvisionedChannelResult {
  if (!isOfficialOwner(actorOwner)) {
    return { ok: false, message: 'Only the Nami official owner can create game channel shells.' };
  }

  const gameTitle = input.gameTitle.trim();

  if (gameTitle.length < 2) {
    return { ok: false, message: 'Enter a game title with at least 2 characters.' };
  }

  const handle = normalizeHandle(input.handle || gameTitle);

  if (handle.length < 2) {
    return { ok: false, message: 'Enter a channel handle with at least 2 characters.' };
  }

  const channels = readChannels();

  if (channels.some((entry) => entry.handle === handle)) {
    return { ok: false, message: 'That handle is already reserved for another owner-provisioned channel.' };
  }

  const channelId = createOwnerProvisionedChannelId(gameTitle);
  const channel: OwnerProvisionedChannel = {
    id: 'owner-provisioned-' + channelId,
    channelId,
    gameTitle,
    handle,
    genre: input.genre.trim() || 'Indie',
    platforms:
      input.platforms.length > 0 ? normalizeSupportedPlatforms(input.platforms) : ['PC'],
    tagline:
      input.tagline?.trim() ||
      'Owner-provisioned game channel — claimable with valid proof.',
    status: 'unclaimed',
    createdByOwner: actorOwner!,
    createdAtMs: Date.now(),
  };

  channels.unshift(channel);
  writeChannels(channels);

  saveActiveOwnerProvisionedChannelId(channelId);

  return {
    ok: true,
    channel,
    message: gameTitle + ' channel shell created. Game owners can submit a claim ticket with proof.',
  };
}

export function markOwnerProvisionedChannelClaimPending(
  channelId: string,
  claimTicketId: string
): OwnerProvisionedChannel | null {
  const channels = readChannels();
  const index = channels.findIndex((entry) => entry.channelId === channelId);

  if (index < 0) {
    return null;
  }

  const current = channels[index]!;

  if (current.status !== 'unclaimed') {
    return null;
  }

  const next: OwnerProvisionedChannel = {
    ...current,
    status: 'claim-pending',
    claimTicketId,
  };

  channels[index] = next;
  writeChannels(channels);

  return next;
}

export function markOwnerProvisionedChannelClaimRejected(channelId: string): OwnerProvisionedChannel | null {
  const channels = readChannels();
  const index = channels.findIndex((entry) => entry.channelId === channelId);

  if (index < 0) {
    return null;
  }

  const current = channels[index]!;

  if (current.status !== 'claim-pending') {
    return null;
  }

  const { claimTicketId: _removedClaimTicketId, ...rest } = current;
  const next: OwnerProvisionedChannel = {
    ...rest,
    status: 'unclaimed',
  };

  channels[index] = next;
  writeChannels(channels);

  return next;
}

export function markOwnerProvisionedChannelClaimed(
  channelId: string,
  claimTicketId: string
): OwnerProvisionedChannel | null {
  const channels = readChannels();
  const index = channels.findIndex((entry) => entry.channelId === channelId);

  if (index < 0) {
    return null;
  }

  const current = channels[index]!;

  const next: OwnerProvisionedChannel = {
    ...current,
    status: 'claimed',
    claimTicketId,
    claimedAtMs: Date.now(),
  };

  channels[index] = next;
  writeChannels(channels);

  return next;
}

export function isOwnerProvisionedChannelHidden(channelId: string): boolean {
  return ownerProvisionedChannelById(channelId) === undefined;
}

export function updateOwnerProvisionedChannelSnapshot(
  channelId: string,
  snapshot: OwnerProvisionedChannelSnapshot
): OwnerProvisionedChannel | null {
  const channels = readChannels();
  const index = channels.findIndex((entry) => entry.channelId === channelId);

  if (index < 0) {
    return null;
  }

  const current = channels[index]!;
  const next: OwnerProvisionedChannel = {
    ...current,
    ...(snapshot.tagline ? { tagline: snapshot.tagline } : {}),
    ...(snapshot.genres && snapshot.genres.length > 0 ? { genre: snapshot.genres[0]! } : {}),
    ...(snapshot.platforms && snapshot.platforms.length > 0
      ? { platforms: normalizeSupportedPlatforms(snapshot.platforms) }
      : {}),
    ownerSnapshot: snapshot,
  };

  channels[index] = next;
  writeChannels(channels);

  return next;
}

export function deleteOwnerProvisionedChannel(
  channelId: string,
  actorOwner: string | null
): { ok: boolean; message: string } {
  const channels = readChannels();
  const entry = channels.find((channel) => channel.channelId === channelId);

  if (!entry) {
    return { ok: false, message: 'Channel not found.' };
  }

  const actor = actorOwner?.toLowerCase() ?? '';
  const createdBy = entry.createdByOwner.toLowerCase();
  const claimedBy = entry.claimedByWallet?.toLowerCase() ?? '';

  if (actor !== createdBy && actor !== claimedBy) {
    return { ok: false, message: 'Only the current channel owner can delete this channel.' };
  }

  if (entry.status === 'transfer-pending') {
    return {
      ok: false,
      message: 'Cancel the pending ownership transfer before deleting this channel.',
    };
  }

  writeChannels(channels.filter((channel) => channel.channelId !== channelId));

  if (readActiveOwnerProvisionedChannelId() === channelId) {
    window.localStorage.removeItem(ACTIVE_OWNER_PROVISIONED_CHANNEL_KEY);
  }

  return { ok: true, message: entry.gameTitle + ' channel removed.' };
}

function mergeOwnerProvisionedChannels(
  local: OwnerProvisionedChannel[],
  server: OwnerProvisionedChannel[]
): OwnerProvisionedChannel[] {
  const byChannelId = new Map<string, OwnerProvisionedChannel>();

  for (const entry of server) {
    byChannelId.set(entry.channelId, entry);
  }

  for (const entry of local) {
    if (!byChannelId.has(entry.channelId)) {
      byChannelId.set(entry.channelId, entry);
    }
  }

  return [...byChannelId.values()].sort((left, right) => right.createdAtMs - left.createdAtMs);
}

export function replaceOwnerProvisionedChannelsFromServer(
  channels: OwnerProvisionedChannel[]
): void {
  const normalized = channels.flatMap((entry) => {
    const next = normalizeChannel(entry);
    return next ? [next] : [];
  });
  const merged = mergeOwnerProvisionedChannels(readChannels(), normalized).slice(0, 200);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  emitChange();
  void import('./owner-provisioned-channel-snapshot-hydrate.js').then(
    ({ applyOwnerProvisionedSnapshots }) => {
      applyOwnerProvisionedSnapshots(merged);
    }
  );
}

export function resetOwnerProvisionedChannelsStoreForTests(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  emitChange();
}