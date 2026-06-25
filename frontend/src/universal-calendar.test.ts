import { describe, expect, it } from 'vitest';

import type { StoredEvent } from './events-store.js';
import {
  buildUniversalCalendarProjection,
  filterUniversalCalendarEvents,
  groupUniversalCalendarEvents,
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

describe('universal-calendar', () => {
  it('filters events by source and subscription state', () => {
    expect(filterUniversalCalendarEvents(sampleEvents, 'all')).toHaveLength(3);
    expect(filterUniversalCalendarEvents(sampleEvents, 'official').map((event) => event.id)).toEqual([
      'official-a',
    ]);
    expect(filterUniversalCalendarEvents(sampleEvents, 'channel').map((event) => event.id)).toEqual([
      'channel-b',
    ]);
    expect(filterUniversalCalendarEvents(sampleEvents, 'subscribed').map((event) => event.id)).toEqual([
      'official-a',
      'guild-c',
    ]);
  });

  it('groups events by day and sorts within each day', () => {
    const groups = groupUniversalCalendarEvents(sampleEvents);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.dayKey).toBe('2026-06-25');
    expect(groups[0]?.events.map((event) => event.id)).toEqual(['official-a', 'channel-b']);
    expect(groups[1]?.dayKey).toBe('2026-06-26');
    expect(groups[1]?.events.map((event) => event.id)).toEqual(['guild-c']);
  });

  it('builds a filtered day-group projection for the calendar panel', () => {
    const projection = buildUniversalCalendarProjection(sampleEvents, 'subscribed');

    expect(projection).toHaveLength(2);
    expect(projection[0]?.events.map((event) => event.id)).toEqual(['official-a']);
    expect(projection[1]?.events.map((event) => event.id)).toEqual(['guild-c']);
    expect(projection[0]?.dayLabel.length).toBeGreaterThan(0);
  });
});