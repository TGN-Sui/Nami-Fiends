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

const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';
const VIDEO_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';

export function resolveSocialEmbed(embed: SocialEmbed, parentHost: string): ResolvedSocialEmbed {
  const externalUrl = normalizeExternalUrl(embed.previewUrl, '#');

  if (embed.embedUrl?.trim()) {
    const isXEmbed = embed.platform === 'x';

    return {
      playable: true,
      iframeSrc: embed.embedUrl.trim(),
      externalUrl,
      sandbox: IFRAME_SANDBOX,
      allow: isXEmbed ? 'encrypted-media; fullscreen' : VIDEO_ALLOW,
      layout: isXEmbed ? 'x-post' : 'video',
      frameWidth: isXEmbed ? X_POST_EMBED_WIDTH : null,
      frameHeight: isXEmbed ? X_POST_EMBED_HEIGHT : null,
    };
  }

  if (embed.platform === 'twitch') {
    const channel = parseTwitchChannel(embed.previewUrl ?? '', embed.handle);
    const src =
      'https://player.twitch.tv/?channel=' +
      encodeURIComponent(channel) +
      '&parent=' +
      encodeURIComponent(parentHost) +
      '&muted=false';

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