import { channels as seedChannels } from './fixtures/seed-data.js';
import { readGameOwnerSession } from './game-owner-session-store.js';
import { buildProvisionalGameChannel } from './provisional-game-channel.js';
import { readViewingAsChannelOwner } from './surface-preferences.js';
import { channels, type NamiChannel } from './uiMockData.js';

const OWNED_CHANNEL_KEY = 'nami.owned-game-channel-id';
const DEFAULT_OWNED_CHANNEL_ID = 'vortex';

export function isGameChannelOwner(): boolean {
  return readViewingAsChannelOwner();
}

export function saveOwnedGameChannelId(channelId: string): void {
  window.localStorage.setItem(OWNED_CHANNEL_KEY, channelId);
}

export function readOwnedGameChannelId(): string | null {
  if (!isGameChannelOwner()) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(OWNED_CHANNEL_KEY);

    if (stored) {
      return stored;
    }
  } catch {
    // fall through
  }

  return DEFAULT_OWNED_CHANNEL_ID;
}

function findChannelById(channelId: string): NamiChannel | undefined {
  return (
    channels.find((channel) => channel.id === channelId) ??
    seedChannels.find((channel) => channel.id === channelId)
  );
}

export function resolveOwnedGameChannel(): NamiChannel | undefined {
  const gameOwnerSession = readGameOwnerSession();

  if (gameOwnerSession) {
    const seeded = findChannelById(gameOwnerSession.provisionalChannelId);

    if (seeded) {
      return seeded;
    }

    return buildProvisionalGameChannel(gameOwnerSession);
  }

  const channelId = readOwnedGameChannelId();

  if (!channelId) {
    return undefined;
  }

  return findChannelById(channelId) ?? findChannelById(DEFAULT_OWNED_CHANNEL_ID);
}

export function ownsGameChannel(channelId: string): boolean {
  if (!isGameChannelOwner()) {
    return false;
  }

  const ownedChannel = resolveOwnedGameChannel();

  return ownedChannel?.id === channelId;
}

export function isViewingOwnGameChannel(channelId: string): boolean {
  return ownsGameChannel(channelId);
}