import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { hydrateGiftCatalog } from './gift-catalog-store.js';
import { canMockStreamGifts } from './gift-mock-preview.js';
import { GiftOverlay } from './GiftOverlay.js';
import { GiftSendPanel } from './GiftSendPanel.js';
import { MockStreamGiftPanel } from './MockStreamGiftPanel.js';
import type { SocialEmbed } from './global-chats.js';
import {
  embedSetupHint,
  resolveSocialEmbed,
  X_POST_EMBED_HEIGHT,
  X_POST_EMBED_WIDTH,
} from './social-embed.js';
import type { EmbeddedFeedSurface } from './surface-preferences.js';
import type { NamiMember } from './uiMockData.js';

type SocialEmbedPlayerProps = {
  embed: SocialEmbed;
  featured?: boolean;
  surface?: EmbeddedFeedSurface;
  streamKey?: string;
  giftTargetMember?: NamiMember;
  enableMockGifts?: boolean;
};

export function SocialEmbedPlayer(props: SocialEmbedPlayerProps): ReactElement {
  const [giftPanelOpen, setGiftPanelOpen] = useState(false);
  const [giftStatus, setGiftStatus] = useState<string | null>(null);
  const [mockPanelOpen, setMockPanelOpen] = useState(false);

  useEffect(() => {
    void hydrateGiftCatalog();
  }, []);

  const resolved = useMemo(() => {
    const parentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return resolveSocialEmbed(props.embed, parentHost);
  }, [props.embed]);

  const isStreamGiftContext =
    props.embed.live === true &&
    (props.embed.platform === 'twitch' || props.embed.platform === 'youtube') &&
    props.streamKey !== undefined;

  const showGiftActions = props.giftTargetMember !== undefined;
  const showGiftOverlay = showGiftActions && isStreamGiftContext;
  const showMockGifts =
    showGiftOverlay &&
    props.streamKey !== undefined &&
    (props.enableMockGifts ?? canMockStreamGifts());

  if (!resolved.playable || !resolved.iframeSrc) {
    return (
      <div
        className={
          'embedded-social-player is-unconfigured' +
          (props.embed.platform === 'x' ? ' is-x-post-embed-player is-unconfigured-x-post' : '') +
          (showGiftActions ? ' has-feed-gift-actions' : '')
        }
      >
        <div className="embedded-social-player-placeholder" aria-hidden="true">
          <span>{props.embed.platform === 'x' ? '𝕏' : props.embed.platform === 'twitch' ? '▶' : '▣'}</span>
        </div>
        <p>{embedSetupHint(props.embed)}</p>
        {showGiftActions && props.giftTargetMember ? (
          <div className="embedded-social-live-gift-actions">
            <button
              className="nami-surface-button is-primary-surface-button embedded-social-send-gift-button"
              onClick={() => setGiftPanelOpen((open) => !open)}
              type="button"
            >
              {giftPanelOpen ? 'Close gifts' : 'Send gift'}
            </button>
          </div>
        ) : null}
        {showGiftActions && giftPanelOpen && props.giftTargetMember ? (
          <div className="embedded-social-live-gift-panel">
            <GiftSendPanel
              onClose={() => setGiftPanelOpen(false)}
              onSent={setGiftStatus}
              target={{
                targetType: 'member',
                targetMember: props.giftTargetMember,
              }}
            />
          </div>
        ) : null}
        <a
          className="nami-surface-button embedded-social-open-external"
          href={resolved.externalUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open on {props.embed.platform === 'x' ? 'X' : props.embed.platform}
        </a>
        {giftStatus ? <p className="embedded-social-live-gift-status">{giftStatus}</p> : null}
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
        (isXPost && props.surface === 'member' ? ' is-member-feed-x-post' : '') +
        (showGiftOverlay ? ' has-live-gift-overlay' : '') +
        (showGiftActions ? ' has-feed-gift-actions' : '')
      }
      {...(isXPost
        ? { style: { maxWidth: frameWidth + 'px', minHeight: frameHeight + 'px' } }
        : {})}
    >
      {showGiftOverlay ? (
        <GiftOverlay
          {...(props.streamKey ? { streamKey: props.streamKey } : {})}
          {...(props.giftTargetMember?.id ? { targetMemberId: props.giftTargetMember.id } : {})}
        />
      ) : null}

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

      {showGiftActions ? (
        <div className="embedded-social-live-gift-actions">
          <button
            className="nami-surface-button is-primary-surface-button embedded-social-send-gift-button"
            onClick={() => setGiftPanelOpen((open) => !open)}
            type="button"
          >
            {giftPanelOpen ? 'Close gifts' : 'Send gift'}
          </button>
          {showMockGifts ? (
            <button
              className="nami-surface-button embedded-social-mock-gift-button"
              onClick={() => setMockPanelOpen((open) => !open)}
              type="button"
            >
              {mockPanelOpen ? 'Close mock gifts' : 'Simulate gift'}
            </button>
          ) : null}
        </div>
      ) : null}

      {showMockGifts && mockPanelOpen && props.giftTargetMember && props.streamKey ? (
        <MockStreamGiftPanel
          className="embedded-social-mock-gift-panel"
          onSent={setGiftStatus}
          streamKey={props.streamKey}
          targetMember={props.giftTargetMember}
        />
      ) : null}

      {showGiftActions && giftPanelOpen && props.giftTargetMember ? (
        <div className="embedded-social-live-gift-panel">
          <GiftSendPanel
            onClose={() => setGiftPanelOpen(false)}
            onSent={setGiftStatus}
            target={{
              targetType: isStreamGiftContext ? 'stream' : 'member',
              targetMember: props.giftTargetMember,
              ...(isStreamGiftContext && props.streamKey ? { streamKey: props.streamKey } : {}),
              ...(isStreamGiftContext ? { streamTitle: props.embed.title } : {}),
            }}
          />
        </div>
      ) : null}

      {giftStatus ? <p className="embedded-social-live-gift-status">{giftStatus}</p> : null}
    </div>
  );
}