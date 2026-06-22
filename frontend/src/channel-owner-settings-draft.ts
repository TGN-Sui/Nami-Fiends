import { useSyncExternalStore } from 'react';

import { readChannelBannerContent, saveChannelBannerContent } from './channel-banner-notifications-store.js';
import {
  defaultOwnerBrandPalette,
  readOwnerBrandPalette,
  saveOwnerBrandPalette,
} from './channel-owner-brand-palette.js';
import {
  defaultChannelOwnerGenres,
  readChannelOwnerProfileEdits,
  saveChannelOwnerProfileEdits,
} from './channel-owner-profile-store.js';
import { normalizeGameGenres } from './game-genres.js';
import {
  readChannelOwnerPromotionsState,
  savePartnerCarouselTicket,
  saveSuperBannerDraft,
} from './channel-owner-promotions-store.js';
import { normalizeSupportedPlatforms } from './platform-genre-options.js';
import type { NamiChannel } from './uiMockData.js';

export type ChannelOwnerSettingsDraft = {
  platforms: string[];
  genres: string[];
  brandPalette: string[];
  superBanner: {
    headline: string;
    body: string;
  };
  partnerCarousel: {
    title: string;
    description: string;
  };
  bannerEditor: {
    headline: string;
    body: string;
  };
};

export type OwnerSettingsCommitResult = {
  ok: boolean;
  message: string;
};

let draftVersion = 0;
const listeners = new Set<() => void>();

const draftsByChannel = new Map<string, ChannelOwnerSettingsDraft>();
const persistedByChannel = new Map<string, ChannelOwnerSettingsDraft>();

function emitDraftChange(): void {
  draftVersion += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function readDraftVersion(): number {
  return draftVersion;
}

function cloneDraft(draft: ChannelOwnerSettingsDraft): ChannelOwnerSettingsDraft {
  return {
    platforms: [...draft.platforms],
    genres: [...draft.genres],
    brandPalette: [...draft.brandPalette],
    superBanner: { ...draft.superBanner },
    partnerCarousel: { ...draft.partnerCarousel },
    bannerEditor: { ...draft.bannerEditor },
  };
}

function draftsEqual(left: ChannelOwnerSettingsDraft, right: ChannelOwnerSettingsDraft): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function buildPersistedOwnerSettingsDraft(channel: NamiChannel): ChannelOwnerSettingsDraft {
  const profileEdits = readChannelOwnerProfileEdits(channel.id);
  const promotions = readChannelOwnerPromotionsState();
  const bannerContent = readChannelBannerContent(channel.id, channel);

  return {
    platforms: normalizeSupportedPlatforms(
      profileEdits?.platforms ?? channel.platforms,
    ),
    genres: normalizeGameGenres(
      profileEdits?.genres && profileEdits.genres.length > 0
        ? profileEdits.genres
        : defaultChannelOwnerGenres(channel),
    ),
    brandPalette: readOwnerBrandPalette(),
    superBanner: {
      headline: promotions.superBanner.draft.headline,
      body: promotions.superBanner.draft.body,
    },
    partnerCarousel: {
      title: promotions.partnerCarousel.ticket?.title ?? '',
      description: promotions.partnerCarousel.ticket?.description ?? '',
    },
    bannerEditor: {
      headline: bannerContent.headline,
      body: bannerContent.body,
    },
  };
}

export function ensureOwnerSettingsDraft(channel: NamiChannel): ChannelOwnerSettingsDraft {
  const existing = draftsByChannel.get(channel.id);

  if (existing) {
    return existing;
  }

  const persisted = buildPersistedOwnerSettingsDraft(channel);
  const draft = cloneDraft(persisted);

  draftsByChannel.set(channel.id, draft);
  persistedByChannel.set(channel.id, cloneDraft(persisted));

  return draft;
}

export function readOwnerSettingsDraft(channelId: string): ChannelOwnerSettingsDraft | null {
  return draftsByChannel.get(channelId) ?? null;
}

type OwnerSettingsDraftPatch = {
  platforms?: string[];
  genres?: string[];
  brandPalette?: string[];
  superBanner?: Partial<ChannelOwnerSettingsDraft['superBanner']>;
  partnerCarousel?: Partial<ChannelOwnerSettingsDraft['partnerCarousel']>;
  bannerEditor?: Partial<ChannelOwnerSettingsDraft['bannerEditor']>;
};

export function updateOwnerSettingsDraft(channelId: string, patch: OwnerSettingsDraftPatch): void {
  const current = draftsByChannel.get(channelId);

  if (!current) {
    return;
  }

  const next: ChannelOwnerSettingsDraft = {
    platforms: patch.platforms ? normalizeSupportedPlatforms(patch.platforms) : current.platforms,
    genres: patch.genres ? normalizeGameGenres(patch.genres) : current.genres,
    brandPalette: patch.brandPalette ? patch.brandPalette.slice(0, 4) : current.brandPalette,
    superBanner: {
      headline: patch.superBanner?.headline ?? current.superBanner.headline,
      body: patch.superBanner?.body ?? current.superBanner.body,
    },
    partnerCarousel: {
      title: patch.partnerCarousel?.title ?? current.partnerCarousel.title,
      description: patch.partnerCarousel?.description ?? current.partnerCarousel.description,
    },
    bannerEditor: {
      headline: patch.bannerEditor?.headline ?? current.bannerEditor.headline,
      body: patch.bannerEditor?.body ?? current.bannerEditor.body,
    },
  };

  draftsByChannel.set(channelId, next);
  emitDraftChange();
}

export function isOwnerSettingsDirty(channelId: string): boolean {
  const draft = draftsByChannel.get(channelId);
  const persisted = persistedByChannel.get(channelId);

  if (!draft || !persisted) {
    return false;
  }

  return !draftsEqual(draft, persisted);
}

export function discardOwnerSettingsDraft(channel: NamiChannel): void {
  const persisted = buildPersistedOwnerSettingsDraft(channel);
  const draft = cloneDraft(persisted);

  draftsByChannel.set(channel.id, draft);
  persistedByChannel.set(channel.id, cloneDraft(persisted));
  emitDraftChange();
}

export function commitOwnerSettings(channel: NamiChannel): OwnerSettingsCommitResult {
  const draft = ensureOwnerSettingsDraft(channel);
  const normalizedPlatforms = normalizeSupportedPlatforms(draft.platforms);
  const normalizedGenres = normalizeGameGenres(draft.genres);

  if (normalizedPlatforms.length === 0) {
    return {
      ok: false,
      message: 'Select at least one supported platform before saving.',
    };
  }

  if (normalizedGenres.length === 0) {
    return {
      ok: false,
      message: 'Select at least one game genre before saving.',
    };
  }

  saveChannelOwnerProfileEdits(channel.id, {
    platforms: normalizedPlatforms,
    genres: normalizedGenres,
  });
  saveOwnerBrandPalette(draft.brandPalette);

  const promotions = readChannelOwnerPromotionsState();
  saveSuperBannerDraft(channel.id, {
    coverUrl: promotions.superBanner.draft.coverUrl,
    headline: draft.superBanner.headline,
    body: draft.superBanner.body,
  });

  savePartnerCarouselTicket(channel.id, {
    title: draft.partnerCarousel.title,
    description: draft.partnerCarousel.description,
  });

  const bannerContent = readChannelBannerContent(channel.id, channel);
  saveChannelBannerContent(channel.id, {
    ...bannerContent,
    headline: draft.bannerEditor.headline,
    body: draft.bannerEditor.body,
    updatedAtMs: Date.now(),
  });

  const committed = cloneDraft({
    ...draft,
    platforms: normalizedPlatforms,
    genres: normalizedGenres,
  });

  draftsByChannel.set(channel.id, committed);
  persistedByChannel.set(channel.id, cloneDraft(committed));
  emitDraftChange();

  return {
    ok: true,
    message: 'Owner settings saved for ' + channel.name + '.',
  };
}

export function resetOwnerSettingsBrandPalette(channelId: string): void {
  updateOwnerSettingsDraft(channelId, {
    brandPalette: defaultOwnerBrandPalette(),
  });
}

export function resetOwnerSettingsDraftStoreForTests(): void {
  draftsByChannel.clear();
  persistedByChannel.clear();
  emitDraftChange();
}

export function useOwnerSettingsDraft(channelId: string): {
  draft: ChannelOwnerSettingsDraft | null;
  isDirty: boolean;
  version: number;
} {
  const version = useSyncExternalStore(subscribe, readDraftVersion, () => 0);

  return {
    draft: readOwnerSettingsDraft(channelId),
    isDirty: isOwnerSettingsDirty(channelId),
    version,
  };
}