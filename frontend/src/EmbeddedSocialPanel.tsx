import { useEffect, useState, type ReactElement } from 'react';

import { readEmbeddedFeedLinks, subscribeEmbeddedFeedLinks } from './embedded-feed-preferences.js';
import { type SocialEmbed } from './global-chats.js';
import { getSelfMember } from './member-access.js';
import { SocialEmbedPlayer } from './SocialEmbedPlayer.js';
import { resolveSocialEmbed } from './social-embed.js';
import {
  canConfigureEmbeddedFeedSurface,
  canShowEmbeddedFeedSurface,
  readEmbeddedFeedEnabled,
  readUserSurfaceRole,
  saveEmbeddedFeedEnabled,
  subscribeEmbeddedFeedEnabled,
  type EmbeddedFeedSurface,
} from './surface-preferences.js';

function platformLabel(platform: SocialEmbed['platform']): string {
  if (platform === 'x') {
    return 'X Post';
  }

  if (platform === 'twitch') {
    return 'Live on Twitch';
  }

  return 'YouTube';
}

export function EmbeddedSocialPanel(props: {
  title?: string;
  embeds?: SocialEmbed[];
  surface: EmbeddedFeedSurface;
  showFeedToggle?: boolean;
}): ReactElement {
  const selfMember = getSelfMember();
  const role = readUserSurfaceRole();
  const canConfigure = canConfigureEmbeddedFeedSurface(props.surface, role, selfMember);
  const canShowPanel = canShowEmbeddedFeedSurface(props.surface, role, selfMember);

  const [feedEnabled, setFeedEnabled] = useState(() => readEmbeddedFeedEnabled(props.surface));
  const [embeds, setEmbeds] = useState<SocialEmbed[]>(() => {
    return props.embeds ?? readEmbeddedFeedLinks(props.surface);
  });

  useEffect(() => {
    return subscribeEmbeddedFeedEnabled(() => {
      setFeedEnabled(readEmbeddedFeedEnabled(props.surface));
    });
  }, [props.surface]);

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

  if (!canShowPanel) {
    return <></>;
  }

  function toggleFeed(): void {
    saveEmbeddedFeedEnabled(props.surface, !feedEnabled);
    setFeedEnabled(!feedEnabled);
  }

  const parentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const liveEmbeds = embeds.filter((embed) => embed.live);
  const otherEmbeds = embeds.filter((embed) => !embed.live);

  function renderEmbedCard(embed: SocialEmbed, featured = false): ReactElement {
    const resolved = resolveSocialEmbed(embed, parentHost);

    return (
      <article
        className={
          'embedded-social-card is-' +
          embed.platform +
          (embed.live ? ' is-live-embed-card' : '') +
          (resolved.playable ? ' is-playable-embed-card' : '')
        }
        key={embed.handle + embed.platform + embed.title}
      >
        <div className="embedded-social-card-head">
          <span className="mini-badge">{platformLabel(embed.platform)}</span>
          {embed.live ? <strong className="embedded-live-pill">LIVE</strong> : null}
        </div>

        <SocialEmbedPlayer embed={embed} featured={featured} surface={props.surface} />

        <div className="embedded-social-copy">
          <strong>{embed.title}</strong>
          <small>{embed.handle}</small>
        </div>

        <div className="embedded-social-card-actions">
          <a
            className="profile-secondary-link embedded-social-open-external"
            href={resolved.externalUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open on {embed.platform === 'x' ? 'X' : embed.platform}
          </a>
        </div>
      </article>
    );
  }

  return (
    <article className="panel embedded-social-panel" data-embedded-surface={props.surface}>
      <div className="profile-panel-heading embedded-social-panel-heading">
        <div>
          <h2>{props.title ?? 'Live & Social'}</h2>
          <p>Watch live broadcasts and social posts inline — no need to leave Nami.</p>
        </div>

        {canConfigure && props.showFeedToggle !== false ? (
          <button
            aria-pressed={feedEnabled}
            className={
              'nami-surface-button embedded-feed-toggle' + (feedEnabled ? ' is-active-view' : '')
            }
            onClick={toggleFeed}
            type="button"
          >
            {feedEnabled ? 'Turn feeds off' : 'Turn feeds on'}
          </button>
        ) : null}
      </div>

      {!feedEnabled ? (
        canConfigure ? (
          <div className="embedded-social-disabled-state">
            <p>Feeds are hidden from your profile and channel pages.</p>
            <button className="profile-secondary-link" onClick={toggleFeed} type="button">
              Enable feeds
            </button>
          </div>
        ) : (
          <div className="embedded-social-disabled-state">
            <p>Feeds are not published on this surface yet.</p>
          </div>
        )
      ) : (
        <div className="embedded-social-grid">
          {liveEmbeds.map((embed) => renderEmbedCard(embed, true))}
          {otherEmbeds.map((embed) => renderEmbedCard(embed, false))}
        </div>
      )}
    </article>
  );
}