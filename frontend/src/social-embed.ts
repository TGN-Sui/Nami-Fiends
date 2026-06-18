import type { SocialEmbed } from './global-chats.js';

/** Standard width for X.com embedded posts (oEmbed default maxwidth). */
export const X_POST_EMBED_WIDTH = 550;

/** Minimum width X allows for embedded posts. */
export const X_POST_EMBED_MIN_WIDTH = 220;

/** Typical iframe height for a standard X post with text and media. */
export const X_POST_EMBED_HEIGHT = 520;

export type SocialEmbedLayout = 'video' | 'x-post';

export type ResolvedSocialEmbed = {
  playable: boolean;
  iframeSrc: string | null;
  externalUrl: string;
  sandbox: string;
  allow: string;
  layout: SocialEmbedLayout;
  frameWidth: number | null;
  frameHeight: number | null;
};

function stripHandle(handle: string): string {
  return handle.replace(/^@/, '').trim();
}

function normalizeExternalUrl(url: string | undefined, fallback: string): string {
  if (typeof url === 'string' && url.trim().startsWith('http')) {
    return url.trim();
  }

  return fallback;
}

function parseTweetId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i);
  return match?.[1] ?? null;
}

function parseYoutubeVideoId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/i);
  if (watchMatch?.[1]) {
    return watchMatch[1];
  }

  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/i);
  if (shortMatch?.[1]) {
    return shortMatch[1];
  }

  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/i);
  if (embedMatch?.[1]) {
    return embedMatch[1];
  }

  const liveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{6,})/i);
  if (liveMatch?.[1]) {
    return liveMatch[1];
  }

  return null;
}

function parseTwitchChannel(url: string, handle: string): string {
  const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]{2,})/i);

  if (match?.[1] && match[1].toLowerCase() !== 'videos' && match[1].toLowerCase() !== 'directory') {
    return match[1];
  }

  return stripHandle(handle);
}

export function twitchParentHosts(parentHost: string): string[] {
  const hosts = new Set<string>(['localhost', '127.0.0.1']);

  if (parentHost.trim()) {
    hosts.add(parentHost.trim());
  }

  return [...hosts];
}

function isSameOriginUrl(url: string, parentHost: string): boolean {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === parentHost) {
      return true;
    }

    if (parentHost === 'localhost' && parsed.hostname === '127.0.0.1') {
      return true;
    }

    if (parentHost === '127.0.0.1' && parsed.hostname === 'localhost') {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

function isAllowedEmbedHostname(hostname: string, platform: SocialEmbed['platform']): boolean {
  const host = hostname.toLowerCase();

  if (platform === 'twitch') {
    return host === 'player.twitch.tv' || host === 'www.twitch.tv' || host === 'twitch.tv';
  }

  if (platform === 'youtube') {
    return host === 'www.youtube.com' || host === 'youtube.com' || host === 'www.youtube-nocookie.com';
  }

  return (
    host === 'platform.twitter.com' ||
    host === 'twitter.com' ||
    host === 'x.com' ||
    host === 'www.x.com'
  );
}

export function buildTwitchPlayerSrc(channel: string, parentHosts: string[]): string {
  const params = new URLSearchParams();
  params.set('channel', channel);
  params.set('muted', 'false');

  for (const parent of parentHosts) {
    params.append('parent', parent);
  }

  return 'https://player.twitch.tv/?' + params.toString();
}

export function ensureTwitchParents(embedUrl: string, parentHosts: string[]): string {
  try {
    const url = new URL(embedUrl);
    const existingParents = url.searchParams.getAll('parent');

    for (const parent of parentHosts) {
      if (!existingParents.includes(parent)) {
        url.searchParams.append('parent', parent);
      }
    }

    return url.toString();
  } catch {
    return embedUrl;
  }
}

function resolveCustomEmbedUrl(
  embed: SocialEmbed,
  embedUrl: string,
  parentHost: string
): ResolvedSocialEmbed | null {
  const externalUrl = normalizeExternalUrl(embed.previewUrl, '#');

  if (isSameOriginUrl(embedUrl, parentHost)) {
    return null;
  }

  try {
    const parsed = new URL(embedUrl);

    if (!isAllowedEmbedHostname(parsed.hostname, embed.platform)) {
      return null;
    }
  } catch {
    return null;
  }

  const isXEmbed = embed.platform === 'x';
  let iframeSrc = embedUrl;

  if (embed.platform === 'twitch') {
    iframeSrc = ensureTwitchParents(embedUrl, twitchParentHosts(parentHost));
  }

  return {
    playable: true,
    iframeSrc,
    externalUrl,
    sandbox: IFRAME_SANDBOX,
    allow: isXEmbed ? 'encrypted-media; fullscreen' : VIDEO_ALLOW,
    layout: isXEmbed ? 'x-post' : 'video',
    frameWidth: isXEmbed ? X_POST_EMBED_WIDTH : null,
    frameHeight: isXEmbed ? X_POST_EMBED_HEIGHT : null,
  };
}

const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';
const VIDEO_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share';

export function resolveSocialEmbed(embed: SocialEmbed, parentHost: string): ResolvedSocialEmbed {
  const externalUrl = normalizeExternalUrl(embed.previewUrl, '#');
  const customEmbedUrl = embed.embedUrl?.trim();

  if (customEmbedUrl) {
    const custom = resolveCustomEmbedUrl(embed, customEmbedUrl, parentHost);

    if (custom) {
      return custom;
    }
  }

  if (embed.platform === 'twitch') {
    const channel = parseTwitchChannel(embed.previewUrl ?? '', embed.handle);
    const parents = twitchParentHosts(parentHost);
    const src = buildTwitchPlayerSrc(channel, parents);

    return {
      playable: true,
      iframeSrc: src,
      externalUrl: 'https://www.twitch.tv/' + channel,
      sandbox: IFRAME_SANDBOX,
      allow: VIDEO_ALLOW,
      layout: 'video',
      frameWidth: null,
      frameHeight: null,
    };
  }

  if (embed.platform === 'youtube') {
    const videoId = parseYoutubeVideoId(embed.previewUrl ?? '');

    if (videoId) {
      return {
        playable: true,
        iframeSrc: 'https://www.youtube.com/embed/' + videoId + '?rel=0&modestbranding=1',
        externalUrl: 'https://www.youtube.com/watch?v=' + videoId,
        sandbox: IFRAME_SANDBOX,
        allow: VIDEO_ALLOW,
        layout: 'video',
        frameWidth: null,
        frameHeight: null,
      };
    }
  }

  if (embed.platform === 'x') {
    const tweetId = parseTweetId(embed.previewUrl ?? '');

    if (tweetId) {
      return {
        playable: true,
        iframeSrc:
          'https://platform.twitter.com/embed/Tweet.html?id=' +
          tweetId +
          '&theme=dark&dnt=true&width=' +
          X_POST_EMBED_WIDTH,
        externalUrl,
        sandbox: IFRAME_SANDBOX,
        allow: 'encrypted-media; fullscreen',
        layout: 'x-post',
        frameWidth: X_POST_EMBED_WIDTH,
        frameHeight: X_POST_EMBED_HEIGHT,
      };
    }
  }

  return {
    playable: false,
    iframeSrc: null,
    externalUrl,
    sandbox: IFRAME_SANDBOX,
    allow: VIDEO_ALLOW,
    layout: embed.platform === 'x' ? 'x-post' : 'video',
    frameWidth: embed.platform === 'x' ? X_POST_EMBED_WIDTH : null,
    frameHeight: embed.platform === 'x' ? X_POST_EMBED_HEIGHT : null,
  };
}

export function embedSetupHint(embed: SocialEmbed): string {
  if (embed.platform === 'x') {
    return 'Paste a direct X post URL (…/status/123…) to embed it inline.';
  }

  if (embed.platform === 'youtube') {
    return 'Paste a YouTube watch, live, or youtu.be link to play inline.';
  }

  return 'Set a Twitch channel URL or handle — stream plays inside the feed.';
}