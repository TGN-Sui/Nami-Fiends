import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { readInterestedEventIds, useEventsStore, type StoredEvent } from './events-store.js';
import { ViewerTimezoneClock } from './ViewerTimezoneClock.js';
import {
  buildCalendarProjection,
  buildMonthCalendarGrid,
  CALENDAR_EVENT_TONE_LABELS,
  filterCalendarEvents,
  filterUpcomingUniversalCalendarEvents,
  formatMonthYearLabel,
  groupEventsByDayKey,
  resolveDayEventTones,
  viewerTodayDayKey,
  type CalendarEventTone,
  type CalendarScope,
  type MonthCalendarCell,
  type PersonalCalendarFilter,
  type UniversalCalendarFilter,
} from './universal-calendar.js';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthCalendarGrid(props: {
  events: readonly StoredEvent[];
  filter: UniversalCalendarFilter | PersonalCalendarFilter;
  monthIndex: number;
  onDaySelect: (dayKey: string, events: StoredEvent[]) => void;
  scope: CalendarScope;
  timezone: string;
  upcomingOnly?: boolean;
  year: number;
}): ReactElement {
  const { revision } = useEventsStore();
  const interestedIds = useMemo(() => new Set(readInterestedEventIds()), [revision]);
  const visibleEvents = useMemo(() => {
    const filtered = filterCalendarEvents(
      props.events,
      props.scope,
      props.filter,
      interestedIds
    );

    if (props.upcomingOnly === true) {
      return filterUpcomingUniversalCalendarEvents(filtered, props.timezone);
    }

    return filtered;
  }, [interestedIds, props.events, props.filter, props.scope, props.timezone, props.upcomingOnly]);
  const projection = useMemo(
    () =>
      buildCalendarProjection(
        props.events,
        props.scope,
        props.filter,
        props.timezone,
        interestedIds,
        props.upcomingOnly === true ? { upcomingOnly: true } : undefined
      ),
    [interestedIds, props.events, props.filter, props.scope, props.timezone, props.upcomingOnly]
  );
  const eventsByDay = useMemo(
    () => groupEventsByDayKey(visibleEvents, props.timezone),
    [props.timezone, visibleEvents]
  );
  const cells = useMemo(
    () => buildMonthCalendarGrid(props.year, props.monthIndex, props.timezone),
    [props.monthIndex, props.timezone, props.year]
  );
  const [todayKey, setTodayKey] = useState(() => viewerTodayDayKey(props.timezone));

  useEffect(() => {
    setTodayKey(viewerTodayDayKey(props.timezone));

    const timer = window.setInterval(() => {
      setTodayKey(viewerTodayDayKey(props.timezone));
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [props.timezone]);

  return (
    <section className="month-calendar-grid-panel">
      <header className="month-calendar-grid-head">
        <div className="month-calendar-grid-head-copy">
          <h3>{formatMonthYearLabel(props.year, props.monthIndex, props.timezone)}</h3>
          <p>{projection.length} active day{projection.length === 1 ? '' : 's'} in this view</p>
        </div>
        <ViewerTimezoneClock
          className="is-month-calendar-clock"
          label={'Now · ' + props.timezone}
          timezone={props.timezone}
        />
      </header>

      <div className="month-calendar-weekday-row" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <span className="month-calendar-weekday" key={label}>
            {label}
          </span>
        ))}
      </div>

      <div className="month-calendar-grid" role="grid" aria-label="Event calendar">
        {cells.map((cell, index) => (
          <MonthCalendarDayCell
            cell={cell}
            events={cell.dayKey ? (eventsByDay.get(cell.dayKey) ?? []) : []}
            interestedIds={interestedIds}
            isToday={cell.dayKey === todayKey}
            key={cell.dayKey ?? 'pad-' + index}
            onSelect={props.onDaySelect}
            timezone={props.timezone}
          />
        ))}
      </div>

      <div className="month-calendar-legend" aria-label="Calendar color legend">
        {(props.scope === 'universal'
          ? (['official', 'channel'] as CalendarEventTone[])
          : (['official', 'channel', 'guild', 'watched'] as CalendarEventTone[])
        ).map((tone) => (
          <span className="month-calendar-legend-item" key={tone}>
            <i className={'month-calendar-tone-dot is-calendar-tone-' + tone} />
            {CALENDAR_EVENT_TONE_LABELS[tone]}
          </span>
        ))}
      </div>
    </section>
  );
}

function MonthCalendarDayCell(props: {
  cell: MonthCalendarCell;
  events: StoredEvent[];
  interestedIds: ReadonlySet<string>;
  isToday: boolean;
  onSelect: (dayKey: string, events: StoredEvent[]) => void;
  timezone: string;
}): ReactElement {
  if (!props.cell.inMonth || !props.cell.dayKey || props.cell.dayNumber === null) {
    return <div aria-hidden="true" className="month-calendar-cell is-outside-month" role="gridcell" />;
  }

  const tones = resolveDayEventTones(props.events, props.interestedIds);
  const hasEvents = props.events.length > 0;

  return (
    <button
      aria-current={props.isToday ? 'date' : undefined}
      className={
        'month-calendar-cell' +
        (props.isToday ? ' is-viewer-today' : '') +
        (hasEvents ? ' has-calendar-events' : ' is-empty-calendar-day')
      }
      onClick={() => {
        if (hasEvents) {
          props.onSelect(props.cell.dayKey as string, props.events);
        }
      }}
      role="gridcell"
      title={props.isToday ? 'Today in ' + props.timezone : undefined}
      type="button"
    >
      <span className="month-calendar-day-number">{props.cell.dayNumber}</span>
      {props.isToday ? <span className="month-calendar-today-pill">Today</span> : null}
      {hasEvents ? (
        <span className="month-calendar-day-tones" aria-hidden="true">
          {tones.map((tone) => (
            <i className={'month-calendar-tone-dot is-calendar-tone-' + tone} key={tone} />
          ))}
        </span>
      ) : null}
    </button>
  );
}