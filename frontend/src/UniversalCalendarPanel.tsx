import { useMemo, useState, type ReactElement } from 'react';

import { CalendarDayEventsPopup } from './CalendarDayEventsPopup.js';
import { MonthCalendarGrid } from './MonthCalendarGrid.js';
import { CalendarEventCards } from './CalendarEventCards.js';
import {
  getPersonalCalendarEvents,
  getUniversalCalendarEvents,
  readInterestedEventIds,
  readViewerTimezone,
  saveViewerTimezone,
  useEventsStore,
  type StoredEvent,
} from './events-store.js';
import { openUniversalCalendarOverlay } from './universal-calendar-overlay-store.js';
import { ViewerTimezoneClock } from './ViewerTimezoneClock.js';
import {
  buildCalendarProjection,
  currentViewerMonth,
  type CalendarScope,
  type PersonalCalendarFilter,
  type UniversalCalendarFilter,
} from './universal-calendar.js';
import type { NamiChannel } from './uiMockData.js';

const UNIVERSAL_FILTERS: Array<{ id: UniversalCalendarFilter; label: string }> = [
  { id: 'all', label: 'All events' },
  { id: 'official', label: 'Official' },
  { id: 'channel', label: 'Channel' },
];

const PERSONAL_FILTERS: Array<{ id: PersonalCalendarFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'universal', label: 'Universal' },
  { id: 'watched', label: 'Watched' },
  { id: 'official', label: 'Official' },
  { id: 'channel', label: 'Channel' },
  { id: 'guild', label: 'Guild' },
  { id: 'subscribed', label: 'Subscribed' },
];

export function UniversalCalendarPanel(props: {
  compact?: boolean;
  layout?: 'page' | 'overlay' | 'compact';
  onOpenCalendar?: () => void;
  onOpenChannel?: (channel: NamiChannel) => void;
  onViewEvent: (event: StoredEvent) => void;
  scope?: CalendarScope;
}): ReactElement {
  const scope = props.scope ?? 'universal';
  const layout = props.layout ?? (props.compact ? 'compact' : 'page');
  const { revision } = useEventsStore();
  const [filter, setFilter] = useState<UniversalCalendarFilter | PersonalCalendarFilter>('all');
  const [upcomingOnly, setUpcomingOnly] = useState(layout !== 'compact');
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<StoredEvent[]>([]);
  const timezone = readViewerTimezone();
  const viewerMonth = currentViewerMonth(timezone);
  const [monthIndex, setMonthIndex] = useState(viewerMonth.monthIndex);
  const [year, setYear] = useState(viewerMonth.year);

  const catalogEvents = useMemo(() => {
    if (scope === 'personal') {
      return getPersonalCalendarEvents();
    }

    return getUniversalCalendarEvents();
  }, [revision, scope]);

  const filters = scope === 'personal' ? PERSONAL_FILTERS : UNIVERSAL_FILTERS;

  const interestedIds = useMemo(() => new Set(readInterestedEventIds()), [revision]);

  const compactEvents = useMemo(() => {
    if (layout !== 'compact') {
      return [];
    }

    const projection = buildCalendarProjection(catalogEvents, scope, 'all', timezone, interestedIds, {
      upcomingOnly: true,
    });

    return projection.flatMap((group) => group.events).slice(0, 4);
  }, [catalogEvents, interestedIds, layout, scope, timezone]);

  const visibleEventCount = useMemo(() => {
    if (layout === 'compact') {
      return compactEvents.length;
    }

    const projection = buildCalendarProjection(catalogEvents, scope, filter, timezone, interestedIds, {
      upcomingOnly,
    });

    return projection.reduce((total, group) => total + group.events.length, 0);
  }, [catalogEvents, compactEvents.length, filter, interestedIds, layout, scope, timezone, upcomingOnly]);

  function shiftMonth(delta: number): void {
    const next = new Date(year, monthIndex + delta, 1);
    setYear(next.getFullYear());
    setMonthIndex(next.getMonth());
  }

  function handleDaySelect(dayKey: string, events: StoredEvent[]): void {
    setSelectedDayKey(dayKey);
    setSelectedDayEvents(events);
  }

  return (
    <section
      className={
        'universal-calendar-panel' +
        (layout === 'compact' ? ' is-compact-universal-calendar' : '') +
        (layout === 'overlay' ? ' is-overlay-universal-calendar' : '') +
        (scope === 'personal' ? ' is-personal-calendar' : ' is-universal-discovery-calendar')
      }
    >
      <header className="universal-calendar-head">
        <div className="universal-calendar-head-copy">
          <h2>
            {layout === 'compact'
              ? 'Upcoming events'
              : scope === 'personal'
                ? 'My calendar'
                : 'Universal calendar'}
          </h2>
          <p>
            {layout === 'compact'
              ? 'Official Nami and game channel owner schedules.'
              : scope === 'personal'
                ? 'Universal discovery plus events you watch. Mark Interested to add guild or member events to your calendar.'
                : 'Official Nami and published game channel events only. Guild and member watches stay on personal calendars.'}
          </p>
          {layout !== 'compact' ? (
            <div className="universal-calendar-timezone-now">
              <small className="event-timezone-note">Your timezone: {timezone}</small>
              <ViewerTimezoneClock label="Current time" timezone={timezone} />
            </div>
          ) : null}
        </div>

        {layout !== 'compact' ? (
          <div className="universal-calendar-head-controls">
            <label className="event-timezone-field universal-calendar-timezone-field">
              <span>Event timezone</span>
              <input
                onChange={(event) => saveViewerTimezone(event.target.value)}
                placeholder="America/Chicago"
                type="text"
                value={timezone}
              />
            </label>

            <div className="universal-calendar-filters" role="tablist" aria-label="Calendar filters">
              {filters.map((entry) => (
                <button
                  aria-selected={filter === entry.id}
                  className={
                    'universal-calendar-filter' +
                    (filter === entry.id ? ' is-active-calendar-filter' : '')
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

            <label className="universal-calendar-upcoming-toggle">
              <input
                checked={upcomingOnly}
                onChange={(event) => setUpcomingOnly(event.target.checked)}
                type="checkbox"
              />
              <span>Upcoming and live only</span>
            </label>
          </div>
        ) : null}
      </header>

      {layout !== 'compact' ? (
        <div className="universal-calendar-month-nav">
          <button className="nami-surface-button" onClick={() => shiftMonth(-1)} type="button">
            Previous month
          </button>
          <button
            className="nami-surface-button"
            onClick={() => {
              const current = currentViewerMonth(timezone);
              setYear(current.year);
              setMonthIndex(current.monthIndex);
            }}
            type="button"
          >
            Today
          </button>
          <button className="nami-surface-button" onClick={() => shiftMonth(1)} type="button">
            Next month
          </button>
        </div>
      ) : null}

      {layout === 'compact' ? null : (
        <MonthCalendarGrid
          events={catalogEvents}
          filter={filter}
          monthIndex={monthIndex}
          onDaySelect={handleDaySelect}
          scope={scope}
          timezone={timezone}
          upcomingOnly={upcomingOnly}
          year={year}
        />
      )}

      {layout === 'compact' && compactEvents.length > 0 ? (
        <CalendarEventCards
          events={compactEvents}
          onViewEvent={props.onViewEvent}
          timezone={timezone}
          {...(props.onOpenChannel ? { onOpenChannel: props.onOpenChannel } : {})}
        />
      ) : null}

      {visibleEventCount === 0 ? (
        <p className="protocol-hint universal-calendar-empty">
          {layout === 'compact'
            ? 'No upcoming universal events right now.'
            : 'No events match this calendar view. Try another filter, another month, or turn off upcoming-only.'}
        </p>
      ) : null}

      {layout === 'compact' && props.onOpenCalendar ? (
        <div className="universal-calendar-compact-footer">
          <button
            className="nami-surface-button is-primary-surface-button"
            onClick={() => openUniversalCalendarOverlay()}
            type="button"
          >
            Open universal calendar
          </button>
        </div>
      ) : null}

      <CalendarDayEventsPopup
        dayKey={selectedDayKey}
        events={selectedDayEvents}
        onClose={() => {
          setSelectedDayKey(null);
          setSelectedDayEvents([]);
        }}
        onViewEvent={props.onViewEvent}
        timezone={timezone}
        {...(props.onOpenChannel ? { onOpenChannel: props.onOpenChannel } : {})}
      />
    </section>
  );
}