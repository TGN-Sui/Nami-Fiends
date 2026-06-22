import type { ReactElement } from 'react';

import type { NamiChannel } from './uiMockData.js';

export function PartnerCarouselPreviewOverlay(props: {
  channel: NamiChannel;
  coverUrl: string;
  title: string;
  description: string;
  onClose: () => void;
}): ReactElement {
  function handleDismissSurfaceClick(event: { target: EventTarget }): void {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest('.partner-carousel-preview-popup, .channel-banner-popup-close')) {
      return;
    }

    props.onClose();
  }

  const bannerTitle = props.title.trim() || props.channel.name;
  const bannerDescription = props.description.trim() || props.channel.genre;

  return (
    <div
      aria-labelledby="partner-carousel-preview-title"
      className="channel-banner-popup-backdrop is-owner-banner-preview"
      onClick={handleDismissSurfaceClick}
      role="dialog"
    >
      <article className="partner-carousel-preview-popup panel">
        <button
          aria-label="Close preview"
          className="channel-banner-popup-close"
          onClick={props.onClose}
          type="button"
        >
          ×
        </button>

        <div className="partner-carousel-preview-heading">
          <span className="mini-badge">Hub preview</span>
          <h2 id="partner-carousel-preview-title">Featured Partner Banner Carousel</h2>
          <p>This is how your ticket appears on Nami Hub before Nami Official approval.</p>
        </div>

        <button
          className={
            'banner-panel featured-banner-carousel nami-hub-rotating-banner partner-carousel-preview-banner' +
            (props.coverUrl ? ' has-partner-banner-cover' : '')
          }
          type="button"
        >
          {props.coverUrl ? (
            <span
              aria-hidden="true"
              className="nami-hub-banner-cover"
              style={{ backgroundImage: 'url(' + JSON.stringify(props.coverUrl) + ')' }}
            />
          ) : null}
          {props.coverUrl ? <span aria-hidden="true" className="nami-hub-banner-scrim" /> : null}
          <div className="nami-hub-banner-copy">
            <span>Featured Partner Banner Carousel</span>
            <strong>{bannerTitle}</strong>
            <small>{bannerDescription}</small>
          </div>
        </button>

        <div className="channel-banner-owner-preview-actions">
          <button className="nami-surface-button is-primary-surface-button" onClick={props.onClose} type="button">
            Back to ticket editor
          </button>
        </div>
      </article>
    </div>
  );
}