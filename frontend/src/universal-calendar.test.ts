import { describe, expect, it } from 'vitest';

import type { StoredEvent } from './events-store.js';
import {
  buildMonthCalendarGrid,
  buildUniversalCalendarProjection,
  filterPersonalCalendarEvents,
  filterUniversalCalendarEvents,
  filterUpcomingUniversalCalendarEvents,
  groupUniversalCalendarEvents,
  resolveDayEventTones,
} from './universal-calendar.js';

function makeEvent(overrides: Partial<StoredEvent> & Pick<StoredEvent, 'id' | 'title' | 'source'>): StoredEvent {
  return {
    description: 'Test event',
    body: 'Test body',
    dateLabel: 'Tonight',
    status: 'Open',
    seats: 'Unlimited',
    startsAtUtc: '2026-06-25T20:00:00.000Z',
    durationMinutes: 60,
    createdAt: '2026-06-20T12:00:00.000Z',
    createdByMemberId: 'member-a',
    subscribed: false,
    ...overrides,
  };
}

const sampleEvents: StoredEvent[] = [
  makeEvent({
    id: 'official-a',
    title: 'Official A',
    source: 'official',
    startsAtUtc: '2026-06-25T18:00:00.000Z',
    subscribed: true,
  }),
  makeEvent({
    id: 'channel-b',
    title: 'Channel B',
    source: 'channel',
    channelName: 'FIENDS',
    startsAtUtc: '2026-06-25T22:00:00.000Z',
  }),
  makeEvent({
    id: 'guild-c',
    title: 'Guild C',
    source: 'guild',
    startsAtUtc: '2026-06-26T16:00:00.000Z',
    subscribed: true,
  }),
];

const timezone = 'UTC';

describe('universal-calendar', () => {
  it('filters universal events by official and channel only', () => {
    expect(filterUniversalCalendarEvents(sampleEvents, 'all')).toHaveLength(3);
    expect(filterUniversalCalendarEvents(sampleEvents, 'official').map((event) => event.id)).toEqual([
      'official-a',
    ]);
    expect(filterUniversalCalendarEvents(sampleEvents, 'channel').map((event) => event.id)).toEqual([
      'channel-b',
    ]);
  });

  it('filters personal watched events separately from universal catalog', () => {
    const interested = new Set(['guild-c']);

    expect(
      filterPersonalCalendarEvents(sampleEvents, 'watched', interested).map((event) => event.id)
    ).toEqual(['guild-c']);
    expect(
      filterPersonalCalendarEvents(sampleEvents, 'universal', interested).map((event) => event.id)
    ).toEqual(['official-a', 'channel-b']);
  });

  it('groups events by day in the viewer timezone and sorts within each day', () => {
    const groups = groupUniversalCalendarEvents(sampleEvents, timezone);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.dayKey).toBe('2026-06-25');
    expect(groups[0]?.events.map((event) => event.id)).toEqual(['official-a', 'channel-b']);
    expect(groups[1]?.dayKey).toBe('2026-06-26');
    expect(groups[1]?.events.map((event) => event.id)).toEqual(['guild-c']);
  });

  it('builds a filtered day-group projection for the calendar panel', () => {
    const projection = buildUniversalCalendarProjection(sampleEvents, 'official', timezone);

    expect(projection).toHaveLength(1);
    expect(projection[0]?.events.map((event) => event.id)).toEqual(['official-a']);
    expect(projection[0]?.dayLabel.length).toBeGreaterThan(0);
  });

  it('can limit to upcoming and live events', () => {
    const futureOnly = filterUpcomingUniversalCalendarEvents(
      [
        makeEvent({
          id: 'past',
          title: 'Past',
          source: 'official',
          startsAtUtc: '2020-01-01T12:00:00.000Z',
        }),
        makeEvent({
          id: 'future',
          title: 'Future',
          source: 'official',
          startsAtUtc: '2099-01-01T12:00:00.000Z',
        }),
      ],
      'UTC'
    );

    expect(futureOnly.map((event) => event.id)).toEqual(['future']);
  });

  it('builds a month grid with leading padding cells', () => {
    const cells = buildMonthCalendarGrid(2026, 5, timezone);
    const inMonth = cells.filter((cell) => cell.inMonth);

    expect(inMonth).toHaveLength(30);
    expect(cells.length % 7).toBe(0);
  });

  it('resolves multiple source tones for a single day', () => {
    const tones = resolveDayEventTones(
      [sampleEvents[0] as StoredEvent, sampleEvents[1] as StoredEvent],
      new Set()
    );

    expect(tones).toEqual(['official', 'channel']);
  });
});