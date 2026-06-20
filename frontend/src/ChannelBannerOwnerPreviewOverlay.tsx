import { type ReactElement } from 'react';

import { type NamiChannel } from './uiMockData.js';

export function ChannelBannerOwnerPreviewOverlay(props: {
  channel: NamiChannel;
  coverUrl: string;
  headline: string;
  body: string;
  onClose: () => void;
  onSend: () => void;
  sendLocked?: boolean;
  sendLockedReason?: string;
}): ReactElement {
  function handleDismissSurfaceClick(event: { target: EventTarget }): void {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (
      target.closest(
        '.channel-banner-popup-hero, .channel-banner-popup-close, .channel-banner-owner-preview-actions',
      )
    ) {
      return;
    }

    props.onClose();
  }

  return (
    <div
      aria-labelledby="channel-banner-owner-preview-title"
      className="channel-banner-popup-backdrop is-owner-banner-preview"
      onClick={handleDismissSurfaceClick}
      role="dialog"
    >
      <article className="channel-banner-popup is-owner-banner-preview-popup">
        <button
          aria-label="Close preview"
          className="channel-banner-popup-close"
          onClick={props.onClose}
          type="button"
        >
          ×
        </button>

        <div
          aria-label="Subscriber banner preview"
          className={
            'channel-banner-popup-hero is-owner-banner-preview-hero' +
            (props.coverUrl ? ' has-banner-cover' : '')
          }
          style={
            props.coverUrl
              ? { backgroundImage: 'url(' + JSON.stringify(props.coverUrl) + ')' }
              : undefined
          }
        >
          <div className="channel-banner-popup-hero-shade" aria-hidden="true" />

          <span className="channel-banner-owner-preview-badge">Subscriber preview</span>

          <div className="channel-banner-popup-hero-copy">
            <h2 id="channel-banner-owner-preview-title">{props.headline}</h2>
            {props.body ? <p className="channel-banner-popup-hero-lede">{props.body}</p> : null}
          </div>
        </div>

        <div className="channel-banner-owner-preview-actions">
          <button className="nami-surface-button" onClick={props.onClose} type="button">
            Keep editing
          </button>
          <button
            className="nami-surface-button is-primary-surface-button"
            disabled={props.sendLocked}
            onClick={props.onSend}
            title={props.sendLocked ? props.sendLockedReason : undefined}
            type="button"
          >
            {props.sendLocked ? 'Send locked until approval' : 'Send to subscribers'}
          </button>
        </div>
        {props.sendLocked && props.sendLockedReason ? (
          <p className="protocol-hint channel-banner-owner-preview-lock-note">{props.sendLockedReason}</p>
        ) : null}
      </article>
    </div>
  );
}