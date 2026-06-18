import { describe, expect, it } from 'vitest';

import type { SocialEmbed } from './global-chats.js';
import {
  buildTwitchPlayerSrc,
  ensureTwitchParents,
  resolveSocialEmbed,
  twitchParentHosts,
} from './social-embed.js';

const twitchEmbed: SocialEmbed = {
  platform: 'twitch',
  title: 'Live broadcast',
  handle: 'twitch',
  previewUrl: 'https://www.twitch.tv/twitch',
  live: true,
};

describe('social-embed', () => {
  it('builds Twitch player URLs with required parent domains', () => {
    const src = buildTwitchPlayerSrc('twitch', twitchParentHosts('localhost'));

    expect(src).toContain('player.twitch.tv');
    expect(src).toContain('channel=twitch');
    expect(src).toContain('parent=localhost');
    expect(src).toContain('parent=127.0.0.1');
  });

  it('injects parent domains into custom Twitch embed URLs', () => {
    const patched = ensureTwitchParents(
      'https://player.twitch.tv/?channel=twitch',
      twitchParentHosts('localhost')
    );

    expect(patched).toContain('parent=localhost');
    expect(patched).toContain('parent=127.0.0.1');
  });

  it('rejects same-origin embed URLs and falls back to Twitch channel playback', () => {
    const resolved = resolveSocialEmbed(
      {
        ...twitchEmbed,
        embedUrl: 'http://localhost:5173/',
      },
      'localhost'
    );

    expect(resolved.playable).toBe(true);
    expect(resolved.iframeSrc).toContain('player.twitch.tv');
    expect(resolved.iframeSrc).not.toContain('localhost:5173');
    expect(resolved.iframeSrc).toContain('parent=localhost');
  });
});