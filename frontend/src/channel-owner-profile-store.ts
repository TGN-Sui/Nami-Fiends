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
  tagline?: string;
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

    const genres = Array.isArray(parsed.genres)
      ? normalizeGameGenres(parsed.genres.filter((entry) => typeof entry === 'string'))
      : [];
    const platforms = Array.isArray(parsed.platforms)
      ? normalizeSupportedPlatforms(parsed.platforms.filter((entry) => typeof entry === 'string'))
      : [];
    return {
      platforms,
      genres,
      ...(typeof parsed.tagline === 'string' ? { tagline: parsed.tagline.trim() } : {}),
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
  edits: { platforms: string[]; genres: string[]; tagline?: string },
): void {
  const existing = readStoredEdits(channelId);
  const normalized: ChannelOwnerProfileEdits = {
    platforms: normalizeSupportedPlatforms(edits.platforms),
    genres: normalizeGameGenres(edits.genres),
    ...(edits.tagline !== undefined
      ? { tagline: edits.tagline.trim() }
      : existing?.tagline
        ? { tagline: existing.tagline }
        : {}),
  };

  window.localStorage.setItem(
    profileStorageKey(channelId),
    JSON.stringify(normalized satisfies ChannelOwnerProfileEdits),
  );
  emit();
}

export function saveChannelOwnerTagline(
  channelId: string,
  channel: NamiChannel,
  tagline: string,
): void {
  const existing = readStoredEdits(channelId);

  saveChannelOwnerProfileEdits(channelId, {
    platforms: existing?.platforms ?? defaultPlatformsForChannel(channel),
    genres: existing?.genres ?? defaultGenresForChannel(channel),
    tagline,
  });

  void import('./channel-owner-snapshot-sync.js').then(({ syncOwnerProvisionedChannelProfileSnapshot }) => {
    syncOwnerProvisionedChannelProfileSnapshot(channel, tagline);
  });
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
  const tagline = edits?.tagline !== undefined ? edits.tagline : channel.tagline;
  const nextPlatforms = platforms.length > 0 ? [...platforms] : channel.platforms;
  const unchanged =
    tagline === channel.tagline &&
    genre === channel.genre &&
    nextPlatforms.length === channel.platforms.length &&
    nextPlatforms.every((platform, index) => platform === channel.platforms[index]);

  if (unchanged) {
    return channel;
  }

  return {
    ...channel,
    platforms: nextPlatforms,
    genre,
    tagline,
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