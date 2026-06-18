import { type ReactElement } from 'react';

export type ChannelNewsItem = {
  id: string;
  title: string;
  tag: string;
  summary: string;
  fullBody: string;
  publishedAtLabel: string;
};

export function ChannelNewsDetailOverlay(props: {
  article: ChannelNewsItem;
  channelName: string;
  onClose: () => void;
}): ReactElement {
  function handleDismissSurfaceClick(event: { target: EventTarget }): void {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest('.channel-news-detail-panel, .channel-news-detail-close')) {
      return;
    }

    props.onClose();
  }

  return (
    <div
      aria-labelledby={'channel-news-detail-title-' + props.article.id}
      className="channel-news-detail-backdrop"
      onClick={handleDismissSurfaceClick}
      role="dialog"
    >
      <article className="channel-news-detail-panel">
        <button
          aria-label="Close news article"
          className="channel-news-detail-close"
          onClick={props.onClose}
          type="button"
        >
          ×
        </button>

        <header className="channel-news-detail-head">
          <span>{props.article.tag}</span>
          <small>{props.article.publishedAtLabel}</small>
          <h2 id={'channel-news-detail-title-' + props.article.id}>{props.article.title}</h2>
          <p className="channel-news-detail-channel">{props.channelName}</p>
        </header>

        <div className="channel-news-detail-body">
          {props.article.fullBody.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}