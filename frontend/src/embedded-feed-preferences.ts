import { defaultSocialEmbeds, type SocialEmbed } from './global-chats.js';
import type { EmbeddedFeedSurface } from './surface-preferences.js';

const LINKS_PREFIX = 'nami.embedded-feed.links.';

function linksStorageKey(surface: EmbeddedFeedSurface): string {
  return LINKS_PREFIX + surface;
}

function isValidPlatform(value: unknown): value is SocialEmbed['platform'] {
  return value === 'x' || value === 'twitch' || value === 'youtube';
}

function isDisallowedEmbedOverride(embedUrl: string): boolean {
  try {
    const parsed = new URL(embedUrl);
    const host = parsed.hostname.toLowerCase();

    if (typeof window !== 'undefined') {
      const currentHost = window.location.hostname.toLowerCase();

      if (host === currentHost) {
        return true;
      }

      if (
        (host === 'localhost' || host === '127.0.0.1') &&
        (currentHost === 'localhost' || currentHost === '127.0.0.1')
      ) {
        return true;
      }
    }

    return (
      !host.includes('twitch.tv') &&
      !host.includes('youtube.com') &&
      !host.includes('youtu.be') &&
      host !== 'platform.twitter.com' &&
      host !== 'twitter.com' &&
      host !== 'x.com' &&
      host !== 'www.x.com'
    );
  } catch {
    return true;
  }
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

  const embedUrl =
    typeof entry.embedUrl === 'string' && entry.embedUrl.trim()
      ? entry.embedUrl.trim()
      : fallback.embedUrl;

  if (embedUrl !== undefined && !isDisallowedEmbedOverride(embedUrl)) {
    next.embedUrl = embedUrl;
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

const COLLAPSED_PREFIX = 'nami.embedded-feed.collapsed.';

function collapsedStorageKey(surface: EmbeddedFeedSurface): string {
  return COLLAPSED_PREFIX + surface;
}

export function embedCardKey(embed: SocialEmbed, index: number): string {
  return embed.platform + ':' + index + ':' + embed.handle;
}

function readCollapsedMap(surface: EmbeddedFeedSurface): Record<string, boolean> {
  try {
    const stored = window.localStorage.getItem(collapsedStorageKey(surface));

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);

    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }

    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function isEmbedCollapsed(
  surface: EmbeddedFeedSurface,
  cardKey: string,
  featured: boolean
): boolean {
  const stored = readCollapsedMap(surface)[cardKey];

  if (stored !== undefined) {
    return stored;
  }

  return !featured;
}

export function saveEmbedCollapsed(
  surface: EmbeddedFeedSurface,
  cardKey: string,
  collapsed: boolean
): void {
  const next = {
    ...readCollapsedMap(surface),
    [cardKey]: collapsed,
  };

  window.localStorage.setItem(collapsedStorageKey(surface), JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent('nami-embedded-feed-collapsed-changed', { detail: { surface } })
  );
}

export function subscribeEmbedCollapsed(listener: () => void): () => void {
  function onChange(): void {
    listener();
  }

  window.addEventListener('nami-embedded-feed-collapsed-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-embedded-feed-collapsed-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}