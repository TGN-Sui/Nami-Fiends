import { defaultSocialEmbeds, type SocialEmbed } from './global-chats.js';
import type { EmbeddedFeedSurface } from './surface-preferences.js';

const LINKS_PREFIX = 'nami.embedded-feed.links.';

function linksStorageKey(surface: EmbeddedFeedSurface): string {
  return LINKS_PREFIX + surface;
}

function isValidPlatform(value: unknown): value is SocialEmbed['platform'] {
  return value === 'x' || value === 'twitch' || value === 'youtube';
}

function normalizeEmbed(entry: Partial<SocialEmbed>, fallback: SocialEmbed): SocialEmbed {
  const next: SocialEmbed = {
    platform: isValidPlatform(entry.platform) ? entry.platform : fallback.platform,
    title: typeof entry.title === 'string' && entry.title.trim() ? entry.title.trim() : fallback.title,
    handle: typeof entry.handle === 'string' && entry.handle.trim() ? entry.handle.trim() : fallback.handle,
  };
  const previewUrl =
    typeof entry.previewUrl === 'string' && entry.previewUrl.trim()
      ? entry.previewUrl.trim()
      : fallback.previewUrl;

  if (previewUrl !== undefined) {
    next.previewUrl = previewUrl;
  }

  const live = typeof entry.live === 'boolean' ? entry.live : fallback.live;

  if (live !== undefined) {
    next.live = live;
  }

  return next;
}

export function readEmbeddedFeedLinks(surface: EmbeddedFeedSurface): SocialEmbed[] {
  const defaults = defaultSocialEmbeds.map((embed) => ({ ...embed }));

  try {
    const stored = window.localStorage.getItem(linksStorageKey(surface));

    if (!stored) {
      return defaults;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return defaults;
    }

    return defaults.map((fallback, index) => {
      const entry = parsed[index];

      if (!entry || typeof entry !== 'object') {
        return fallback;
      }

      return normalizeEmbed(entry as Partial<SocialEmbed>, fallback);
    });
  } catch {
    return defaults;
  }
}

export function saveEmbeddedFeedLinks(surface: EmbeddedFeedSurface, links: SocialEmbed[]): void {
  window.localStorage.setItem(linksStorageKey(surface), JSON.stringify(links));
  window.dispatchEvent(new CustomEvent('nami-embedded-feed-links-changed', { detail: { surface } }));
}

export function updateEmbeddedFeedLink(
  surface: EmbeddedFeedSurface,
  index: number,
  patch: Partial<SocialEmbed>
): SocialEmbed[] {
  const current = readEmbeddedFeedLinks(surface);
  const fallback = current[index] ?? defaultSocialEmbeds[index] ?? defaultSocialEmbeds[0]!;
  const next = current.map((embed, embedIndex) => {
    if (embedIndex !== index) {
      return embed;
    }

    return normalizeEmbed({ ...embed, ...patch }, fallback);
  });

  saveEmbeddedFeedLinks(surface, next);

  return next;
}

export function subscribeEmbeddedFeedLinks(listener: () => void): () => void {
  function onChange(): void {
    listener();
  }

  window.addEventListener('nami-embedded-feed-links-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-embedded-feed-links-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}