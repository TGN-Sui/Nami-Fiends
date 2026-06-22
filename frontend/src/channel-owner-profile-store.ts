import { useSyncExternalStore } from 'react';

import {
  normalizeSupportedPlatforms,
  SUPPORTED_PLATFORMS,
  type SupportedPlatform,
} from './platform-genre-options.js';
import { gameSubmissionTicketByChannelId } from './game-submission-ticket-store.js';
import type { NamiChannel } from './uiMockData.js';

const PROFILE_KEY_PREFIX = 'nami.channel.owner.profile.';

export type ChannelOwnerProfileEdits = {
  platforms: SupportedPlatform[];
};

let storeVersion = 0;
const listeners = new Set<() => void>();

function emit(): void {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function profileStorageKey(channelId: string): string {
  return PROFILE_KEY_PREFIX + channelId;
}

function readStoredEdits(channelId: string): ChannelOwnerProfileEdits | null {
  try {
    const stored = window.localStorage.getItem(profileStorageKey(channelId));

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<ChannelOwnerProfileEdits>;

    if (!Array.isArray(parsed.platforms)) {
      return null;
    }

    return {
      platforms: normalizeSupportedPlatforms(
        parsed.platforms.filter((entry) => typeof entry === 'string')
      ),
    };
  } catch {
    return null;
  }
}

function defaultPlatformsForChannel(channel: NamiChannel): SupportedPlatform[] {
  const ticket = gameSubmissionTicketByChannelId(channel.id);

  if (ticket?.platforms && ticket.platforms.length > 0) {
    return normalizeSupportedPlatforms(ticket.platforms);
  }

  return normalizeSupportedPlatforms(channel.platforms);
}

export function readChannelOwnerProfileEdits(channelId: string): ChannelOwnerProfileEdits | null {
  return readStoredEdits(channelId);
}

export function saveChannelOwnerPlatforms(channelId: string, platforms: string[]): void {
  const normalized = normalizeSupportedPlatforms(platforms);

  window.localStorage.setItem(
    profileStorageKey(channelId),
    JSON.stringify({ platforms: normalized } satisfies ChannelOwnerProfileEdits)
  );
  emit();
}

export function withChannelOwnerProfile(channel: NamiChannel): NamiChannel {
  const edits = readStoredEdits(channel.id);
  const ticket = gameSubmissionTicketByChannelId(channel.id);
  const ticketPlatforms =
    ticket?.platforms && ticket.platforms.length > 0
      ? normalizeSupportedPlatforms(ticket.platforms)
      : null;

  const platforms =
    edits?.platforms ??
    ticketPlatforms ??
    normalizeSupportedPlatforms(channel.platforms);

  if (platforms.length === 0) {
    return channel;
  }

  return {
    ...channel,
    platforms: [...platforms],
  };
}

export function useChannelOwnerProfileVersion(): number {
  return useSyncExternalStore(subscribe, () => storeVersion, () => storeVersion);
}

export function supportedPlatformOptions(): readonly SupportedPlatform[] {
  return SUPPORTED_PLATFORMS;
}