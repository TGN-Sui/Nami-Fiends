import { useEffect, useState, type ReactElement } from 'react';

import {
  readEmbeddedFeedLinks,
  subscribeEmbeddedFeedLinks,
  updateEmbeddedFeedLink,
} from './embedded-feed-preferences.js';
import type { SocialEmbed } from './global-chats.js';
import {
  readEmbeddedFeedEnabled,
  type EmbeddedFeedSurface,
} from './surface-preferences.js';

const PLATFORM_LABELS: Record<SocialEmbed['platform'], string> = {
  x: 'X / Twitter',
  twitch: 'Twitch',
  youtube: 'YouTube',
};

export function EmbeddedFeedLinksPanel(props: {
  surface: EmbeddedFeedSurface;
  enabled: boolean;
}): ReactElement | null {
  const [links, setLinks] = useState<SocialEmbed[]>(() => readEmbeddedFeedLinks(props.surface));

  useEffect(() => {
    function refreshLinks(): void {
      setLinks(readEmbeddedFeedLinks(props.surface));
    }

    refreshLinks();

    return subscribeEmbeddedFeedLinks(refreshLinks);
  }, [props.surface]);

  if (!props.enabled || !readEmbeddedFeedEnabled(props.surface)) {
    return null;
  }

  return (
    <div className="settings-embedded-links-block">
      <p className="settings-embedded-links-heading">Preferred feed links</p>
      {links.map((link, index) => (
        <div className="settings-embedded-link-row" key={link.platform + '-' + index}>
          <span className="mini-badge">{PLATFORM_LABELS[link.platform]}</span>

          <label className="settings-embedded-link-field">
            <span>Title</span>
            <input
              onChange={(event) => {
                setLinks(updateEmbeddedFeedLink(props.surface, index, { title: event.target.value }));
              }}
              type="text"
              value={link.title}
            />
          </label>

          <label className="settings-embedded-link-field">
            <span>Handle</span>
            <input
              onChange={(event) => {
                setLinks(updateEmbeddedFeedLink(props.surface, index, { handle: event.target.value }));
              }}
              type="text"
              value={link.handle}
            />
          </label>

          <label className="settings-embedded-link-field">
            <span>Link URL</span>
            <input
              onChange={(event) => {
                setLinks(updateEmbeddedFeedLink(props.surface, index, { previewUrl: event.target.value }));
              }}
              placeholder="https://"
              type="url"
              value={link.previewUrl ?? ''}
            />
          </label>
        </div>
      ))}
    </div>
  );
}