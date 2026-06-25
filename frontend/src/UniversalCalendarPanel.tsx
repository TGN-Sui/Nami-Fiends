import { useMemo, useState, type ReactElement } from 'react';

import {
  eventImportanceClass,
  formatEventTimeInTimezone,
  getAllCatalogEvents,
  readViewerTimezone,
  useEventsStore,
} from './events-store.js';
import { EventInterestedButton } from './EventInterestedButton.js';
import {
  buildUniversalCalendarProjection,
  type UniversalCalendarFilter,
} from './universal-calendar.js';
import type { StoredEvent } from './events-store.js';
import type { NamiChannel } from './uiMockData.js';

const CALENDAR_FILTERS: Array<{ id: UniversalCalendarFilter; label: string }> = [
  { id: 'all', label: 'All events' },
  { id: 'subscribed', label: 'Subscribed' },
  { id: 'official', label: 'Official' },
  { id: 'channel', label: 'Channel' },
];

export function UniversalCalendarPanel(props: {
  onOpenChannel?: (channel: NamiChannel) => void;
  onViewEvent: (event: StoredEvent) => void;
}): ReactElement {
  const { revision } = useEventsStore();
  const [filter, setFilter] = useState<UniversalCalendarFilter>('all');
  const timezone = readViewerTimezone();

  const dayGroups = useMemo(() => {
    return buildUniversalCalendarProjection(getAllCatalogEvents(), filter);
  }, [filter, revision]);

  return (
    <section className="universal-calendar-panel">
      <header className="universal-calendar-head">
        <div>
          <h2>Universal calendar</h2>
          <p>Aggregated owner and official events across Nami, grouped by day in {timezone}.</p>
        </div>
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
      </header>

      {dayGroups.length === 0 ? (
        <p className="protocol-hint">No events match this calendar filter.</p>
      ) : (
        <div className="universal-calendar-day-groups">
          {dayGroups.map((group) => (
            <section className="universal-calendar-day-group" key={group.dayKey}>
              <h3>{group.dayLabel}</h3>
              <div className="universal-calendar-day-events">
                {group.events.map((event) => (
                  <article
                    className={'universal-calendar-event-card panel' + eventImportanceClass(event)}
                    key={event.id}
                  >
                    <div className="universal-calendar-event-copy">
                      <span className="mini-badge">{event.source}</span>
                      <strong>{event.title}</strong>
                      <p>{event.description}</p>
                      <small>
                        {formatEventTimeInTimezone(event.startsAtUtc, timezone)} · {event.status}
                        {event.channelName ? ' · ' + event.channelName : ''}
                      </small>
                    </div>
                    <div className="universal-calendar-event-actions">
                      <EventInterestedButton eventId={event.id} />
                      <button
                        className="secondary-action"
                        onClick={() => props.onViewEvent(event)}
                        type="button"
                      >
                        View event
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}