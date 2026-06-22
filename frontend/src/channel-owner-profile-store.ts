import { useSyncExternalStore } from 'react';

import {
  formatGameGenresForDisplay,
  gameOnboardingGenreOptions,
  normalizeGameGenres,
  parseGameGenresFromDisplay,
} from './game-genres.js';
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
  genres: string[];
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

    const genres = Array.isArray(parsed.genres)
      ? normalizeGameGenres(parsed.genres.filter((entry) => typeof entry === 'string'))
      : [];

    return {
      platforms: normalizeSupportedPlatforms(
        parsed.platforms.filter((entry) => typeof entry === 'string')
      ),
      genres,
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

function defaultGenresForChannel(channel: NamiChannel): string[] {
  const ticket = gameSubmissionTicketByChannelId(channel.id);

  if (ticket?.genres && ticket.genres.length > 0) {
    return normalizeGameGenres(ticket.genres);
  }

  const fromDisplay = normalizeGameGenres(parseGameGenresFromDisplay(channel.genre));

  if (fromDisplay.length > 0) {
    return fromDisplay;
  }

  return ['Indie'];
}

export function readChannelOwnerProfileEdits(channelId: string): ChannelOwnerProfileEdits | null {
  return readStoredEdits(channelId);
}

export function saveChannelOwnerProfileEdits(
  channelId: string,
  edits: { platforms: string[]; genres: string[] },
): void {
  const normalized: ChannelOwnerProfileEdits = {
    platforms: normalizeSupportedPlatforms(edits.platforms),
    genres: normalizeGameGenres(edits.genres),
  };

  window.localStorage.setItem(
    profileStorageKey(channelId),
    JSON.stringify(normalized satisfies ChannelOwnerProfileEdits),
  );
  emit();
}

export function saveChannelOwnerPlatforms(channelId: string, platforms: string[]): void {
  const existing = readStoredEdits(channelId);

  saveChannelOwnerProfileEdits(channelId, {
    platforms,
    genres: existing?.genres ?? [],
  });
}

export function withChannelOwnerProfile(channel: NamiChannel): NamiChannel {
  const edits = readStoredEdits(channel.id);
  const ticket = gameSubmissionTicketByChannelId(channel.id);
  const ticketPlatforms =
    ticket?.platforms && ticket.platforms.length > 0
      ? normalizeSupportedPlatforms(ticket.platforms)
      : null;
  const ticketGenres =
    ticket?.genres && ticket.genres.length > 0 ? normalizeGameGenres(ticket.genres) : null;

  const platforms =
    edits?.platforms ??
    ticketPlatforms ??
    normalizeSupportedPlatforms(channel.platforms);
  const genres =
    edits?.genres && edits.genres.length > 0
      ? edits.genres
      : ticketGenres ?? defaultGenresForChannel(channel);
  const genre = formatGameGenresForDisplay(genres) || channel.genre;

  if (platforms.length === 0 && genre === channel.genre) {
    return channel;
  }

  return {
    ...channel,
    platforms: platforms.length > 0 ? [...platforms] : channel.platforms,
    genre,
  };
}

export function defaultChannelOwnerGenres(channel: NamiChannel): string[] {
  const edits = readStoredEdits(channel.id);

  if (edits?.genres && edits.genres.length > 0) {
    return [...edits.genres];
  }

  return defaultGenresForChannel(channel);
}

export function useChannelOwnerProfileVersion(): number {
  return useSyncExternalStore(subscribe, () => storeVersion, () => storeVersion);
}

export function supportedPlatformOptions(): readonly SupportedPlatform[] {
  return SUPPORTED_PLATFORMS;
}

export function supportedGameGenreOptions(): readonly string[] {
  return gameOnboardingGenreOptions();
}