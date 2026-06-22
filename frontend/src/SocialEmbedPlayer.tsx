import { useMemo, type ReactElement } from 'react';

import type { SocialEmbed } from './global-chats.js';
import {
  embedSetupHint,
  resolveSocialEmbed,
  X_POST_EMBED_HEIGHT,
  X_POST_EMBED_WIDTH,
} from './social-embed.js';
import type { EmbeddedFeedSurface } from './surface-preferences.js';

type SocialEmbedPlayerProps = {
  embed: SocialEmbed;
  featured?: boolean;
  surface?: EmbeddedFeedSurface;
};

export function SocialEmbedPlayer(props: SocialEmbedPlayerProps): ReactElement {
  const resolved = useMemo(() => {
    const parentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return resolveSocialEmbed(props.embed, parentHost);
  }, [props.embed]);

  if (!resolved.playable || !resolved.iframeSrc) {
    return (
      <div
        className={
          'embedded-social-player is-unconfigured' +
          (props.embed.platform === 'x' ? ' is-x-post-embed-player is-unconfigured-x-post' : '')
        }
      >
        <div className="embedded-social-player-placeholder" aria-hidden="true">
          <span>{props.embed.platform === 'x' ? '𝕏' : props.embed.platform === 'twitch' ? '▶' : '▣'}</span>
        </div>
        <p>{embedSetupHint(props.embed)}</p>
        <a
          className="nami-surface-button embedded-social-open-external"
          href={resolved.externalUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open on {props.embed.platform === 'x' ? 'X' : props.embed.platform}
        </a>
      </div>
    );
  }

  const isXPost = resolved.layout === 'x-post';
  const frameWidth = resolved.frameWidth ?? X_POST_EMBED_WIDTH;
  const frameHeight = resolved.frameHeight ?? X_POST_EMBED_HEIGHT;

  return (
    <div
      className={
        'embedded-social-player is-playable' +
        (props.featured ? ' is-featured-embed-player' : '') +
        (isXPost ? ' is-x-post-embed-player' : '') +
        (isXPost && props.surface === 'member' ? ' is-member-feed-x-post' : '')
      }
      {...(isXPost
        ? { style: { maxWidth: frameWidth + 'px', minHeight: frameHeight + 'px' } }
        : {})}
    >
      <iframe
        allow={resolved.allow}
        allowFullScreen
        className={
          'embedded-social-player-frame' + (isXPost ? ' is-x-post-embed-frame' : '')
        }
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={resolved.iframeSrc}
        title={props.embed.title + ' — ' + props.embed.handle}
        {...(isXPost
          ? {
              style: {
                width: frameWidth + 'px',
                maxWidth: '100%',
                height: frameHeight + 'px',
                minHeight: frameHeight + 'px',
              },
            }
          : {})}
      />
    </div>
  );
}