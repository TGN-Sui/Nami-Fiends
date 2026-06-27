import {
  isUniversalCatalogEvent,
  isEventInViewerSubscriptions,
  isEventLive,
  type StoredEvent,
} from './events-store.js';

export type UniversalCalendarFilter = 'all' | 'official' | 'channel';

export type PersonalCalendarFilter =
  | UniversalCalendarFilter
  | 'universal'
  | 'watched'
  | 'guild'
  | 'subscribed';

export type CalendarScope = 'universal' | 'personal';

export type CalendarEventTone = 'official' | 'channel' | 'guild' | 'watched';

export type UniversalCalendarDayGroup = {
  dayKey: string;
  dayLabel: string;
  events: StoredEvent[];
};

export type MonthCalendarCell = {
  dayKey: string | null;
  dayNumber: number | null;
  inMonth: boolean;
};

export const CALENDAR_EVENT_TONE_LABELS: Record<CalendarEventTone, string> = {
  official: 'Official Nami',
  channel: 'Game channel',
  guild: 'Guild',
  watched: 'Watched',
};

export function dayKeyForTimezone(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

export function viewerMonthAnchor(timezone: string, year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1, 12, 0, 0));
}

export function formatMonthYearLabel(year: number, monthIndex: number, timezone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    month: 'long',
    year: 'numeric',
  }).format(viewerMonthAnchor(timezone, year, monthIndex));
}

export function formatDayLabel(dayKey: string, timezone: string): string {
  const date = new Date(dayKey + 'T12:00:00.000Z');

  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function startOfViewerDayMs(timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';

  return new Date(year + '-' + month + '-' + day + 'T00:00:00').getTime();
}

export function resolveCalendarEventTone(
  event: StoredEvent,
  interestedIds: ReadonlySet<string>
): CalendarEventTone {
  if (event.source === 'official') {
    return 'official';
  }

  if (event.source === 'channel') {
    return 'channel';
  }

  if (event.source === 'guild') {
    return 'guild';
  }

  if (interestedIds.has(event.id)) {
    return 'watched';
  }

  return 'channel';
}

export function resolveDayEventTones(
  events: readonly StoredEvent[],
  interestedIds: ReadonlySet<string>
): CalendarEventTone[] {
  const tones = new Set<CalendarEventTone>();

  for (const event of events) {
    tones.add(resolveCalendarEventTone(event, interestedIds));
  }

  return [...tones];
}

export function filterUniversalCalendarEvents(
  events: readonly StoredEvent[],
  filter: UniversalCalendarFilter
): StoredEvent[] {
  return events.filter((event) => {
    if (filter === 'all') {
      return true;
    }

    if (filter === 'official') {
      return event.source === 'official';
    }

    return event.source === 'channel';
  });
}

export function filterPersonalCalendarEvents(
  events: readonly StoredEvent[],
  filter: PersonalCalendarFilter,
  interestedIds: ReadonlySet<string>,
  memberId?: string
): StoredEvent[] {
  return events.filter((event) => {
    if (filter === 'all') {
      return true;
    }

    if (filter === 'universal') {
      return isUniversalCatalogEvent(event);
    }

    if (filter === 'watched') {
      return interestedIds.has(event.id) && !isUniversalCatalogEvent(event);
    }

    if (filter === 'official') {
      return event.source === 'official';
    }

    if (filter === 'channel') {
      return event.source === 'channel';
    }

    if (filter === 'guild') {
      return event.source === 'guild';
    }

    return isEventInViewerSubscriptions(event, memberId);
  });
}

export function filterCalendarEvents(
  events: readonly StoredEvent[],
  scope: CalendarScope,
  filter: UniversalCalendarFilter | PersonalCalendarFilter,
  interestedIds: ReadonlySet<string>,
  memberId?: string
): StoredEvent[] {
  if (scope === 'universal') {
    return filterUniversalCalendarEvents(events, filter as UniversalCalendarFilter);
  }

  return filterPersonalCalendarEvents(
    events,
    filter as PersonalCalendarFilter,
    interestedIds,
    memberId
  );
}

export function filterUpcomingUniversalCalendarEvents(
  events: readonly StoredEvent[],
  timezone: string
): StoredEvent[] {
  const startOfDay = startOfViewerDayMs(timezone);

  return events.filter((event) => {
    if (isEventLive(event)) {
      return true;
    }

    return new Date(event.startsAtUtc).getTime() >= startOfDay;
  });
}

export function groupUniversalCalendarEvents(
  events: readonly StoredEvent[],
  timezone: string
): UniversalCalendarDayGroup[] {
  const grouped = new Map<string, StoredEvent[]>();

  for (const event of events) {
    const dayKey = dayKeyForTimezone(event.startsAtUtc, timezone);
    const bucket = grouped.get(dayKey) ?? [];
    bucket.push(event);
    grouped.set(dayKey, bucket);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dayKey, dayEvents]) => ({
      dayKey,
      dayLabel: formatDayLabel(dayKey, timezone),
      events: [...dayEvents].sort(
        (left, right) =>
          new Date(left.startsAtUtc).getTime() - new Date(right.startsAtUtc).getTime()
      ),
    }));
}

export function groupEventsByDayKey(
  events: readonly StoredEvent[],
  timezone: string
): Map<string, StoredEvent[]> {
  const grouped = new Map<string, StoredEvent[]>();

  for (const event of events) {
    const dayKey = dayKeyForTimezone(event.startsAtUtc, timezone);
    const bucket = grouped.get(dayKey) ?? [];
    bucket.push(event);
    grouped.set(dayKey, bucket);
  }

  for (const [dayKey, dayEvents] of grouped.entries()) {
    grouped.set(
      dayKey,
      [...dayEvents].sort(
        (left, right) =>
          new Date(left.startsAtUtc).getTime() - new Date(right.startsAtUtc).getTime()
      )
    );
  }

  return grouped;
}

export function buildUniversalCalendarProjection(
  events: readonly StoredEvent[],
  filter: UniversalCalendarFilter = 'all',
  timezone: string,
  options?: { upcomingOnly?: boolean }
): UniversalCalendarDayGroup[] {
  const filtered = filterUniversalCalendarEvents(events, filter);
  const visible =
    options?.upcomingOnly === true
      ? filterUpcomingUniversalCalendarEvents(filtered, timezone)
      : filtered;

  return groupUniversalCalendarEvents(visible, timezone);
}

export function buildCalendarProjection(
  events: readonly StoredEvent[],
  scope: CalendarScope,
  filter: UniversalCalendarFilter | PersonalCalendarFilter,
  timezone: string,
  interestedIds: ReadonlySet<string>,
  options?: { upcomingOnly?: boolean; memberId?: string }
): UniversalCalendarDayGroup[] {
  const filtered = filterCalendarEvents(events, scope, filter, interestedIds, options?.memberId);
  const visible =
    options?.upcomingOnly === true
      ? filterUpcomingUniversalCalendarEvents(filtered, timezone)
      : filtered;

  return groupUniversalCalendarEvents(visible, timezone);
}

export function buildMonthCalendarGrid(
  year: number,
  monthIndex: number,
  timezone: string
): MonthCalendarCell[] {
  const firstOfMonth = viewerMonthAnchor(timezone, year, monthIndex);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(firstOfMonth);
  const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
  const leading = weekdayIndex < 0 ? 0 : weekdayIndex;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: MonthCalendarCell[] = [];

  for (let index = 0; index < leading; index += 1) {
    cells.push({ dayKey: null, dayNumber: null, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(year, monthIndex, day, 12, 0, 0));

    cells.push({
      dayKey,
      dayNumber: day,
      inMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ dayKey: null, dayNumber: null, inMonth: false });
  }

  return cells;
}

export function currentViewerMonth(timezone: string): { year: number; monthIndex: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '1970');
  const monthIndex = Number(parts.find((part) => part.type === 'month')?.value ?? '1') - 1;

  return { year, monthIndex };
}