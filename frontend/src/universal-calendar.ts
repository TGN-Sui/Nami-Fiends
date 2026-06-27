import {
  isEventInViewerSubscriptions,
  isEventLive,
  type StoredEvent,
} from './events-store.js';

export type UniversalCalendarFilter = 'all' | 'official' | 'channel' | 'guild' | 'subscribed';

export type UniversalCalendarDayGroup = {
  dayKey: string;
  dayLabel: string;
  events: StoredEvent[];
};

function dayKeyForTimezone(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

function formatDayLabel(dayKey: string, timezone: string): string {
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

    if (filter === 'channel') {
      return event.source === 'channel';
    }

    if (filter === 'guild') {
      return event.source === 'guild';
    }

    return isEventInViewerSubscriptions(event);
  });
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