import { useEffect, useState, type ReactElement } from 'react';

import { readEmbeddedFeedLinks, subscribeEmbeddedFeedLinks } from './embedded-feed-preferences.js';
import { type SocialEmbed } from './global-chats.js';
import { canShowEmbeddedFeedSurface, type EmbeddedFeedSurface } from './surface-preferences.js';

function platformLabel(platform: SocialEmbed['platform']): string {
  if (platform === 'x') {
    return 'X Post';
  }

  if (platform === 'twitch') {
    return 'Live on Twitch';
  }

  return 'Live broadcast';
}

export function EmbeddedSocialPanel(props: {
  title?: string;
  embeds?: SocialEmbed[];
  surface: EmbeddedFeedSurface;
}): ReactElement {
  if (!canShowEmbeddedFeedSurface(props.surface)) {
    return <></>;
  }

  const [embeds, setEmbeds] = useState<SocialEmbed[]>(() => {
    return props.embeds ?? readEmbeddedFeedLinks(props.surface);
  });

  useEffect(() => {
    if (props.embeds) {
      return;
    }

    function refreshEmbeds(): void {
      setEmbeds(readEmbeddedFeedLinks(props.surface));
    }

    refreshEmbeds();

    return subscribeEmbeddedFeedLinks(refreshEmbeds);
  }, [props.embeds, props.surface]);

  return (
    <article className="panel embedded-social-panel">
      <div className="profile-panel-heading">
        <h2>{props.title ?? 'Live & Social'}</h2>
        <p>Embedded posts and live broadcasts from connected platforms.</p>
      </div>

      <div className="embedded-social-grid">
        {embeds.map((embed) => (
          <div className={'embedded-social-card is-' + embed.platform} key={embed.handle + embed.platform}>
            <div className="embedded-social-card-head">
              <span className="mini-badge">{platformLabel(embed.platform)}</span>
              {embed.live ? <strong className="embedded-live-pill">LIVE</strong> : null}
            </div>

            <div className="embedded-social-preview" aria-hidden="true">
              <span>{embed.platform === 'x' ? '𝕏' : embed.platform === 'twitch' ? '▶' : '▣'}</span>
            </div>

            <div className="embedded-social-copy">
              <strong>{embed.title}</strong>
              <small>{embed.handle}</small>
            </div>

            <div className="embedded-social-card-actions">
              <a
                className="nami-surface-button embedded-social-open-feed"
                href={embed.previewUrl ?? '#'}
                rel="noreferrer"
                target="_blank"
              >
                Open feed
              </a>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}