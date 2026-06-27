import { useMemo, useState, type ReactElement } from 'react';

import {
  eventImportanceClass,
  formatEventTimeInTimezone,
  getUniversalCalendarEvents,
  isEventLive,
  isEventStartingSoon,
  readViewerTimezone,
  saveViewerTimezone,
  useEventsStore,
} from './events-store.js';
import { EventInterestedButton } from './EventInterestedButton.js';
import {
  buildUniversalCalendarProjection,
  type UniversalCalendarFilter,
} from './universal-calendar.js';
import type { StoredEvent } from './events-store.js';
import { channels, type NamiChannel } from './uiMockData.js';

const CALENDAR_FILTERS: Array<{ id: UniversalCalendarFilter; label: string }> = [
  { id: 'all', label: 'All events' },
  { id: 'subscribed', label: 'Subscribed' },
  { id: 'official', label: 'Official' },
  { id: 'channel', label: 'Channel' },
  { id: 'guild', label: 'Guild' },
];

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

export function UniversalCalendarPanel(props: {
  compact?: boolean;
  onOpenCalendar?: () => void;
  onOpenChannel?: (channel: NamiChannel) => void;
  onViewEvent: (event: StoredEvent) => void;
}): ReactElement {
  const { revision } = useEventsStore();
  const [filter, setFilter] = useState<UniversalCalendarFilter>('all');
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const timezone = readViewerTimezone();

  const catalogEvents = useMemo(() => getUniversalCalendarEvents(), [revision]);

  const dayGroups = useMemo(() => {
    const projection = buildUniversalCalendarProjection(catalogEvents, filter, timezone, {
      upcomingOnly,
    });

    if (!props.compact) {
      return projection;
    }

    const compactEvents = projection.flatMap((group) => group.events).slice(0, 4);

    if (compactEvents.length === 0) {
      return [];
    }

    return buildUniversalCalendarProjection(compactEvents, 'all', timezone, {
      upcomingOnly: false,
    });
  }, [catalogEvents, filter, props.compact, revision, timezone, upcomingOnly]);

  const visibleEventCount = dayGroups.reduce((total, group) => total + group.events.length, 0);

  return (
    <section
      className={'universal-calendar-panel' + (props.compact ? ' is-compact-universal-calendar' : '')}
    >
      <header className="universal-calendar-head">
        <div className="universal-calendar-head-copy">
          <h2>{props.compact ? 'Upcoming events' : 'Universal calendar'}</h2>
          <p>
            {props.compact
              ? 'Cross-community schedule from official Nami, channels, and guilds.'
              : 'Aggregated owner and official events across Nami, grouped by day in ' + timezone + '.'}
          </p>
          {!props.compact ? (
            <small className="event-timezone-note">Your timezone: {timezone}</small>
          ) : null}
        </div>

        <div className="universal-calendar-head-controls">
          {!props.compact ? (
            <label className="event-timezone-field universal-calendar-timezone-field">
              <span>Event timezone</span>
              <input
                onChange={(event) => saveViewerTimezone(event.target.value)}
                placeholder="America/Chicago"
                type="text"
                value={timezone}
              />
            </label>
          ) : null}

          {!props.compact ? (
            <div className="universal-calendar-filters" role="tablist" aria-label="Calendar filters">
              {CALENDAR_FILTERS.map((entry) => (
                <button
                  aria-selected={filter === entry.id}
                  className={
                    'universal-calendar-filter' + (filter === entry.id ? ' is-active-calendar-filter' : '')
                  }
                  key={entry.id}
                  onClick={() => setFilter(entry.id)}
                  role="tab"
                  type="button"
                >
                  {entry.label}
                </button>
              ))}
            </div>
          ) : null}

          {!props.compact ? (
            <label className="universal-calendar-upcoming-toggle">
              <input
                checked={upcomingOnly}
                onChange={(event) => setUpcomingOnly(event.target.checked)}
                type="checkbox"
              />
              <span>Upcoming and live only</span>
            </label>
          ) : null}
        </div>
      </header>

      {visibleEventCount === 0 ? (
        <p className="protocol-hint universal-calendar-empty">
          No events match this calendar view. Try another filter or turn off upcoming-only.
        </p>
      ) : (
        <div className="universal-calendar-day-groups">
          {dayGroups.map((group) => (
            <section className="universal-calendar-day-group" key={group.dayKey}>
              <h3>{group.dayLabel}</h3>
              <div className="universal-calendar-day-events">
                {group.events.map((event) => {
                  const linkedChannel = resolveChannelForEvent(event);

                  return (
                    <article
                      className={'universal-calendar-event-card panel' + eventImportanceClass(event)}
                      key={event.id}
                    >
                      <div className="universal-calendar-event-top">
                        <span className="mini-badge">{event.source}</span>
                        <span className="universal-calendar-event-status-pill">
                          {calendarEventStatusLabel(event)}
                        </span>
                      </div>

                      <div className="universal-calendar-event-copy">
                        <strong>{event.title}</strong>
                        <time dateTime={event.startsAtUtc}>
                          {formatEventTimeInTimezone(event.startsAtUtc, timezone)}
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
            </section>
          ))}
        </div>
      )}

      {props.compact && props.onOpenCalendar ? (
        <div className="universal-calendar-compact-footer">
          <button className="nami-surface-button is-primary-surface-button" onClick={props.onOpenCalendar} type="button">
            Open full calendar
          </button>
        </div>
      ) : null}
    </section>
  );
}