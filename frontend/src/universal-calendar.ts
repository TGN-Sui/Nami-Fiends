import type { StoredEvent } from './events-store.js';

export type UniversalCalendarFilter = 'all' | 'official' | 'channel' | 'subscribed';

export type UniversalCalendarDayGroup = {
  dayKey: string;
  dayLabel: string;
  events: StoredEvent[];
};

function dayKeyForUtc(iso: string): string {
  return iso.slice(0, 10);
}

function formatDayLabel(dayKey: string): string {
  const date = new Date(dayKey + 'T12:00:00.000Z');

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
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

    return event.subscribed === true;
  });
}

export function groupUniversalCalendarEvents(events: readonly StoredEvent[]): UniversalCalendarDayGroup[] {
  const grouped = new Map<string, StoredEvent[]>();

  for (const event of events) {
    const dayKey = dayKeyForUtc(event.startsAtUtc);
    const bucket = grouped.get(dayKey) ?? [];
    bucket.push(event);
    grouped.set(dayKey, bucket);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dayKey, dayEvents]) => ({
      dayKey,
      dayLabel: formatDayLabel(dayKey),
      events: [...dayEvents].sort(
        (left, right) =>
          new Date(left.startsAtUtc).getTime() - new Date(right.startsAtUtc).getTime()
      ),
    }));
}

export function buildUniversalCalendarProjection(
  events: readonly StoredEvent[],
  filter: UniversalCalendarFilter = 'all'
): UniversalCalendarDayGroup[] {
  return groupUniversalCalendarEvents(filterUniversalCalendarEvents(events, filter));
}