import type { ReactElement } from 'react';

import {
  eventImportanceClass,
  formatEventTimeInTimezone,
  isEventLive,
  isEventStartingSoon,
  type StoredEvent,
} from './events-store.js';
import { EventInterestedButton } from './EventInterestedButton.js';
import { channels, type NamiChannel } from './uiMockData.js';

function calendarEventStatusLabel(event: StoredEvent): string {
  if (isEventLive(event)) {
    return 'Live now';
  }

  if (isEventStartingSoon(event)) {
    return 'Starting soon';
  }

  return event.status;
}

function resolveChannelForEvent(event: StoredEvent): NamiChannel | undefined {
  if (!event.channelId) {
    return undefined;
  }

  return channels.find((channel) => channel.id === event.channelId);
}

export function CalendarEventCards(props: {
  events: readonly StoredEvent[];
  onOpenChannel?: (channel: NamiChannel) => void;
  onViewEvent: (event: StoredEvent) => void;
  timezone: string;
}): ReactElement {
  return (
    <div className="universal-calendar-day-events">
      {props.events.map((event) => {
        const linkedChannel = resolveChannelForEvent(event);

        return (
          <article
            className={'universal-calendar-event-card panel' + eventImportanceClass(event)}
            key={event.id}
          >
            <div className="universal-calendar-event-top">
              <span className={'mini-badge calendar-source-badge is-calendar-tone-' + event.source}>
                {event.source}
              </span>
              <span className="universal-calendar-event-status-pill">
                {calendarEventStatusLabel(event)}
              </span>
            </div>

            <div className="universal-calendar-event-copy">
              <strong>{event.title}</strong>
              <time dateTime={event.startsAtUtc}>
                {formatEventTimeInTimezone(event.startsAtUtc, props.timezone)}
              </time>
              <p>{event.description}</p>
              <small>
                {event.channelName ? event.channelName : null}
                {event.channelName && event.guildName ? ' · ' : null}
                {event.guildName ? event.guildName : null}
                {!event.channelName && !event.guildName ? event.seats : null}
              </small>
            </div>

            <div className="universal-calendar-event-actions">
              <EventInterestedButton eventId={event.id} />
              {linkedChannel && props.onOpenChannel ? (
                <button
                  className="nami-surface-button"
                  onClick={() => props.onOpenChannel?.(linkedChannel)}
                  type="button"
                >
                  Open channel
                </button>
              ) : null}
              <button
                className="secondary-action"
                onClick={() => props.onViewEvent(event)}
                type="button"
              >
                View event
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}