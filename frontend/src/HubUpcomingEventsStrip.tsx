import { useMemo, type ReactElement } from 'react';

import { EventInterestedButton } from './EventInterestedButton.js';
import {
  formatEventTimeInTimezone,
  getUniversalCalendarEvents,
  readViewerTimezone,
  useEventsStore,
  type StoredEvent,
} from './events-store.js';
import { openUniversalCalendarOverlay } from './universal-calendar-overlay-store.js';
import { buildCalendarProjection } from './universal-calendar.js';
import { channels, type NamiChannel } from './uiMockData.js';

function resolveChannelForEvent(event: StoredEvent): NamiChannel | undefined {
  if (!event.channelId) {
    return undefined;
  }

  return channels.find((channel) => channel.id === event.channelId);
}

export function HubUpcomingEventsStrip(props: {
  onOpenChannel?: (channel: NamiChannel) => void;
  onViewEvent: (event: StoredEvent) => void;
}): ReactElement {
  const { revision } = useEventsStore();
  const timezone = readViewerTimezone();

  const upcomingEvents = useMemo(() => {
    const projection = buildCalendarProjection(
      getUniversalCalendarEvents(),
      'universal',
      'all',
      timezone,
      new Set(),
      { upcomingOnly: true }
    );

    return projection.flatMap((group) => group.events).slice(0, 16);
  }, [revision, timezone]);

  return (
    <section className="nami-hub-events-upcoming-zone">
      <header className="nami-hub-events-upcoming-head">
        <div>
          <h3>Upcoming events</h3>
          <p>Game channels and cross-community schedules</p>
        </div>
        <button
          className="nami-hub-3d-button is-hub-3d-button-compact"
          onClick={() => openUniversalCalendarOverlay()}
          type="button"
        >
          Full calendar
        </button>
      </header>

      {upcomingEvents.length === 0 ? (
        <p className="protocol-hint nami-hub-upcoming-empty">No upcoming events in the universal feed.</p>
      ) : (
        <div className="nami-hub-upcoming-scroll" tabIndex={0}>
          {upcomingEvents.map((event) => (
            <article className="nami-hub-upcoming-row" key={event.id}>
              <span className={'nami-hub-upcoming-source is-source-' + event.source}>{event.source}</span>
              <div className="nami-hub-upcoming-copy">
                <strong>{event.title}</strong>
                <time dateTime={event.startsAtUtc}>
                  {formatEventTimeInTimezone(event.startsAtUtc, timezone)}
                </time>
                <small>
                  {event.channelName ?? event.guildName ?? 'Nami schedule'}
                </small>
              </div>
              <div className="nami-hub-upcoming-actions">
                <EventInterestedButton eventId={event.id} layout="inline" />
                <button
                  className="nami-hub-3d-button is-hub-3d-button-compact"
                  onClick={() => props.onViewEvent(event)}
                  type="button"
                >
                  View
                </button>
                {(() => {
                  const linkedChannel = resolveChannelForEvent(event);

                  if (!linkedChannel || !props.onOpenChannel) {
                    return null;
                  }

                  return (
                    <button
                      className="nami-hub-3d-button is-hub-3d-button-ghost is-hub-3d-button-compact"
                      onClick={() => props.onOpenChannel?.(linkedChannel)}
                      type="button"
                    >
                      Channel
                    </button>
                  );
                })()}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}