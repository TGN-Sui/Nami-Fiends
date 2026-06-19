import { useEffect, useState, type ReactElement } from 'react';

type SuperBannerPayload = {
  channelId: string;
  coverUrl: string;
  headline: string;
  body: string;
  sentAtMs: number;
};

const MIN_VISIBLE_MS = 3000;

export function SuperBannerOverlay(): ReactElement | null {
  const [payload, setPayload] = useState<SuperBannerPayload | null>(null);
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    function handleSent(event: Event): void {
      const detail = (event as CustomEvent<SuperBannerPayload>).detail;

      if (!detail?.headline) {
        return;
      }

      setPayload(detail);
      setCanDismiss(false);

      window.setTimeout(() => {
        setCanDismiss(true);
      }, MIN_VISIBLE_MS);
    }

    window.addEventListener('nami-super-banner-sent', handleSent as EventListener);

    return () => {
      window.removeEventListener('nami-super-banner-sent', handleSent as EventListener);
    };
  }, []);

  if (!payload) {
    return null;
  }

  return (
    <div className="super-banner-overlay" role="dialog" aria-modal="true" aria-label="Super Banner">
      <article
        className={'super-banner-card' + (payload.coverUrl ? ' has-cover' : '')}
        style={
          payload.coverUrl
            ? { backgroundImage: 'url(' + JSON.stringify(payload.coverUrl) + ')' }
            : undefined
        }
      >
        <div className="super-banner-card-copy">
          <span className="mini-badge">Super Banner</span>
          <h2>{payload.headline}</h2>
          <p>{payload.body}</p>
        </div>
        <button
          className="nami-surface-button is-primary-surface-button"
          disabled={!canDismiss}
          onClick={() => setPayload(null)}
          type="button"
        >
          {canDismiss ? 'Dismiss' : 'Please wait…'}
        </button>
      </article>
    </div>
  );
}