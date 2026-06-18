import { useEffect, useState, type ReactElement } from 'react';

import {
  dismissLiveEventPopup,
  formatEventTimeInTimezone,
  getLiveInterestedEvents,
  readViewerTimezone,
  shouldShowLiveEventPopup,
  syncEventReminderNotifications,
  useEventsStore,
  type StoredEvent,
} from './events-store.js';

export function EventLivePopup(props: {
  onOpenEvent: (event: StoredEvent) => void;
}): ReactElement | null {
  useEventsStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const liveEvents = getLiveInterestedEvents();

  useEffect(() => {
    syncEventReminderNotifications();

    const intervalId = window.setInterval(() => {
      syncEventReminderNotifications();
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (activeIndex >= liveEvents.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, liveEvents.length]);

  if (!shouldShowLiveEventPopup() || liveEvents.length === 0) {
    return null;
  }

  const activeEvent = liveEvents[activeIndex] ?? liveEvents[0]!;

  function goTo(offset: number): void {
    setActiveIndex((current) => {
      const next = current + offset;

      if (next < 0) {
        return liveEvents.length - 1;
      }

      if (next >= liveEvents.length) {
        return 0;
      }

      return next;
    });
  }

  return (
    <div aria-labelledby="event-live-popup-title" className="event-live-popup-backdrop" role="dialog">
      <article className={'panel event-live-popup' + (liveEvents.length > 1 ? ' has-event-swipe' : '')}>
        <header className="event-live-popup-head">
          <div>
            <span className="mini-badge">Live now</span>
            <h2 id="event-live-popup-title">Your interested events are live</h2>
            <p>Swipe through events you marked Interested and jump in before they end.</p>
          </div>
          <button
            aria-label="Dismiss live event popup"
            className="profile-secondary-link"
            onClick={() => dismissLiveEventPopup()}
            type="button"
          >
            Dismiss
          </button>
        </header>

        <div className="event-live-popup-carousel" role="region" aria-label="Live interested events">
          {liveEvents.length > 1 ? (
            <button
              aria-label="Previous live event"
              className="nami-surface-button event-live-popup-nav"
              onClick={() => goTo(-1)}
              type="button"
            >
              ‹
            </button>
          ) : null}

          <div className="event-live-popup-track">
            {liveEvents.map((event, index) => (
              <article
                aria-hidden={index !== activeIndex}
                className={
                  'event-live-popup-card is-event-live-importance' +
                  (index === activeIndex ? ' is-active-event-live-card' : '')
                }
                key={event.id}
              >
                <span className="mini-badge">{event.status}</span>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <div className="channel-event-meta-row">
                  <span>{formatEventTimeInTimezone(event.startsAtUtc, readViewerTimezone())}</span>
                  <strong>Live</strong>
                </div>
                <button
                  className="nami-surface-button is-primary-surface-button"
                  onClick={() => props.onOpenEvent(event)}
                  type="button"
                >
                  Open event
                </button>
              </article>
            ))}
          </div>

          {liveEvents.length > 1 ? (
            <button
              aria-label="Next live event"
              className="nami-surface-button event-live-popup-nav"
              onClick={() => goTo(1)}
              type="button"
            >
              ›
            </button>
          ) : null}
        </div>

        {liveEvents.length > 1 ? (
          <div aria-label="Live event slides" className="event-live-popup-dots" role="tablist">
            {liveEvents.map((event, index) => (
              <button
                aria-selected={index === activeIndex}
                className={'event-live-popup-dot' + (index === activeIndex ? ' is-active-event-dot' : '')}
                key={event.id}
                onClick={() => setActiveIndex(index)}
                role="tab"
                type="button"
              />
            ))}
          </div>
        ) : null}
      </article>
    </div>
  );
}