import { useSyncExternalStore } from 'react';

import { shouldAutoSeedLocalData } from './app-config.js';
import { isNamiTeamMember } from './channel-surface.js';
import { getSelfMember } from './member-access.js';
import {
  channelOwnerEvents,
  officialNamiHubEvents,
  subscribedUserEvents,
  type NamiEvent,
} from './events-data.js';
import { readSubscribedChannelIds } from './subscriptions-store.js';
import { channels, members, type NamiChannel } from './uiMockData.js';

export type BubbleLeaderboardSize = 10 | 25 | 50;

export type StoredEvent = NamiEvent & {
  startsAtUtc: string;
  durationMinutes: number;
  createdAt: string;
  createdByMemberId: string;
  updatedAt?: string;
};

export type EventNotification = {
  id: string;
  eventId: string;
  memberId: string;
  message: string;
  kind: 'new-event' | 'starting-soon' | 'live';
  createdAt: string;
  read: boolean;
};

const INTERESTED_KEY = 'nami.user.event-interested';
const STORED_EVENTS_KEY = 'nami.user.stored-events';
const EVENT_NOTIFICATIONS_KEY = 'nami.user.event-notifications';
const POPUP_SESSION_KEY = 'nami.user.event-live-popup-session';
const TIMEZONE_KEY = 'nami.user.timezone';
const BUBBLE_SIZE_KEY = 'nami.hub.bubble-leaderboard-size';

const DEMO_START_OFFSET_HOURS: Record<string, number> = {
  'nami-launch-festival': 0.35,
  'nami-creator-showcase': 30,
  'fiends-tournament': -0.15,
  'walrus-guild-run': 22,
  'pebble-builder-night': 48,
  'guild-raid-night': 20,
  'guild-cosmetic-drop': 52,
};

const listeners = new Set<() => void>();
let cachedRevision = 0;
let cachedStoreSnapshot: { revision: number } | null = null;

function emit(): void {
  cachedRevision += 1;
  cachedStoreSnapshot = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getRevision(): number {
  return cachedRevision;
}

export function readBubbleLeaderboardSize(): BubbleLeaderboardSize {
  try {
    const stored = window.localStorage.getItem(BUBBLE_SIZE_KEY);

    if (stored === '10' || stored === '25' || stored === '50') {
      return Number(stored) as BubbleLeaderboardSize;
    }
  } catch {
    // Ignore storage failures.
  }

  return 50;
}

export function saveBubbleLeaderboardSize(size: BubbleLeaderboardSize): void {
  window.localStorage.setItem(BUBBLE_SIZE_KEY, String(size));
  emit();
}

export function useBubbleLeaderboardSize(): BubbleLeaderboardSize {
  return useSyncExternalStore(subscribe, readBubbleLeaderboardSize, readBubbleLeaderboardSize);
}

export function readViewerTimezone(): string {
  try {
    const stored = window.localStorage.getItem(TIMEZONE_KEY);

    if (stored && stored.trim().length > 0) {
      return stored;
    }
  } catch {
    // Ignore storage failures.
  }

  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function saveViewerTimezone(timezone: string): void {
  window.localStorage.setItem(TIMEZONE_KEY, timezone.trim());
  emit();
}

function resolveStartsAtUtc(event: NamiEvent, stored?: StoredEvent): string {
  if (stored?.startsAtUtc) {
    return stored.startsAtUtc;
  }

  if (event.startsAtUtc) {
    return event.startsAtUtc;
  }

  const offsetHours = DEMO_START_OFFSET_HOURS[event.id] ?? 24;

  return new Date(Date.now() + offsetHours * 3_600_000).toISOString();
}

function enrichEvent(event: NamiEvent, stored?: StoredEvent): StoredEvent {
  const enriched: StoredEvent = {
    ...event,
    startsAtUtc: resolveStartsAtUtc(event, stored),
    durationMinutes: stored?.durationMinutes ?? event.durationMinutes ?? 120,
    createdAt: stored?.createdAt ?? new Date(Date.now() - 86_400_000).toISOString(),
    createdByMemberId:
      stored?.createdByMemberId ??
      event.createdByMemberId ??
      (event.source === 'official' ? 'm1' : 'm2'),
  };

  if (stored?.updatedAt) {
    enriched.updatedAt = stored.updatedAt;
  }

  return enriched;
}

function readStoredEventsMap(): Record<string, StoredEvent> {
  try {
    const stored = window.localStorage.getItem(STORED_EVENTS_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);

    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, StoredEvent>) : {};
  } catch {
    return {};
  }
}

function writeStoredEventsMap(map: Record<string, StoredEvent>, notify = true): void {
  window.localStorage.setItem(STORED_EVENTS_KEY, JSON.stringify(map));

  if (notify) {
    emit();
  }
}

function seedCatalogEvents(): Record<string, StoredEvent> {
  const seeded: Record<string, StoredEvent> = {};

  for (const event of [...officialNamiHubEvents, ...subscribedUserEvents]) {
    seeded[event.id] = enrichEvent(event);
  }

  for (const channel of channels.slice(0, 6)) {
    for (const event of channelOwnerEvents(channel)) {
      seeded[event.id] = enrichEvent(event);
    }
  }

  writeStoredEventsMap(seeded, false);

  return seeded;
}

function readCatalogEventsMap(): Record<string, StoredEvent> {
  const stored = readStoredEventsMap();

  if (Object.keys(stored).length === 0) {
    return shouldAutoSeedLocalData() ? seedCatalogEvents() : {};
  }

  const merged: Record<string, StoredEvent> = { ...stored };

  for (const event of [...officialNamiHubEvents, ...subscribedUserEvents]) {
    merged[event.id] = enrichEvent(event, stored[event.id]);
  }

  return merged;
}

export function getAllCatalogEvents(): StoredEvent[] {
  return Object.values(readCatalogEventsMap()).sort((left, right) => {
    return new Date(left.startsAtUtc).getTime() - new Date(right.startsAtUtc).getTime();
  });
}

export function getEventById(eventId: string): StoredEvent | undefined {
  return readCatalogEventsMap()[eventId];
}

export function getChannelEvents(channel: NamiChannel): StoredEvent[] {
  const map = readCatalogEventsMap();

  return Object.values(map).filter((event) => event.channelId === channel.id);
}

export function formatEventTimeInTimezone(
  startsAtUtc: string,
  timezone = readViewerTimezone()
): string {
  const start = new Date(startsAtUtc);
  const now = new Date();

  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const startDay = dayFormatter.format(start);
  const nowDay = dayFormatter.format(now);
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const tomorrowDay = dayFormatter.format(tomorrow);

  let dayLabel = startDay;

  if (startDay === nowDay) {
    dayLabel = 'Today';
  } else if (startDay === tomorrowDay) {
    dayLabel = 'Tomorrow';
  } else {
    dayLabel = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(start);
  }

  return dayLabel + ' · ' + timeFormatter.format(start);
}

export function isEventLive(event: Pick<StoredEvent, 'startsAtUtc' | 'durationMinutes'>): boolean {
  const start = new Date(event.startsAtUtc).getTime();
  const end = start + event.durationMinutes * 60_000;
  const now = Date.now();

  return now >= start && now < end;
}

export function isEventStartingSoon(
  event: Pick<StoredEvent, 'startsAtUtc' | 'durationMinutes'>,
  withinMinutes = 15
): boolean {
  const start = new Date(event.startsAtUtc).getTime();
  const now = Date.now();

  return now < start && start - now <= withinMinutes * 60_000;
}

export function eventImportanceClass(event: StoredEvent): string {
  if (isEventLive(event)) {
    return ' is-event-live-importance';
  }

  if (isEventStartingSoon(event)) {
    return ' is-event-soon-importance';
  }

  return '';
}

function readInterestedMap(): Record<string, string[]> {
  try {
    const stored = window.localStorage.getItem(INTERESTED_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);

    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

function writeInterestedMap(map: Record<string, string[]>): void {
  window.localStorage.setItem(INTERESTED_KEY, JSON.stringify(map));
  emit();
}

export function isEventInterested(eventId: string, memberId = getSelfMember().id): boolean {
  return (readInterestedMap()[eventId] ?? []).includes(memberId);
}

export function readInterestedEventIds(memberId = getSelfMember().id): string[] {
  const interested: string[] = [];

  for (const [eventId, memberIds] of Object.entries(readInterestedMap())) {
    if (memberIds.includes(memberId)) {
      interested.push(eventId);
    }
  }

  return interested;
}

export function readInterestedCount(eventId: string): number {
  return (readInterestedMap()[eventId] ?? []).length;
}

function pushEventNotification(input: Omit<EventNotification, 'id' | 'createdAt' | 'read'>): void {
  const existing = readEventNotifications(input.memberId);
  const duplicate = existing.some(
    (entry) => entry.eventId === input.eventId && entry.kind === input.kind && !entry.read
  );

  if (duplicate) {
    return;
  }

  const next: EventNotification = {
    id: 'event-notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
    read: false,
    ...input,
  };

  const all = readAllEventNotifications();
  writeEventNotifications([next, ...all].slice(0, 120));
}

function readAllEventNotifications(): EventNotification[] {
  try {
    const stored = window.localStorage.getItem(EVENT_NOTIFICATIONS_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as EventNotification[]) : [];
  } catch {
    return [];
  }
}

function writeEventNotifications(notifications: EventNotification[]): void {
  window.localStorage.setItem(EVENT_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  emit();
}

export function readEventNotifications(memberId = getSelfMember().id): EventNotification[] {
  return readAllEventNotifications().filter((entry) => entry.memberId === memberId);
}

export function markEventNotificationsRead(memberId = getSelfMember().id): void {
  writeEventNotifications(
    readAllEventNotifications().map((entry) => {
      if (entry.memberId !== memberId) {
        return entry;
      }

      return { ...entry, read: true };
    })
  );
}

export function toggleEventInterest(eventId: string, memberId = getSelfMember().id): boolean {
  const map = readInterestedMap();
  const current = map[eventId] ?? [];
  const interested = current.includes(memberId);
  const event = getEventById(eventId);

  if (interested) {
    map[eventId] = current.filter((entry) => entry !== memberId);
    writeInterestedMap(map);
    return false;
  }

  map[eventId] = [...current, memberId];
  writeInterestedMap(map);

  if (event) {
    pushEventNotification({
      eventId,
      memberId,
      kind: 'starting-soon',
      message:
        'You will be notified before "' +
        event.title +
        '" starts in your timezone (' +
        formatEventTimeInTimezone(event.startsAtUtc) +
        ').',
    });
  }

  return true;
}

export function canEditOfficialEvent(member = getSelfMember()): boolean {
  return isNamiTeamMember(member);
}

export function canEditChannelEvent(
  event: StoredEvent,
  memberId = getSelfMember().id
): boolean {
  return event.createdByMemberId === memberId || event.source !== 'official';
}

export function createChannelEvent(
  channel: NamiChannel,
  input: {
    title: string;
    description: string;
    body: string;
    startsAtUtc: string;
    durationMinutes?: number;
  },
  createdByMemberId = getSelfMember().id
): StoredEvent {
  const event: StoredEvent = {
    id: channel.id + '-event-' + Date.now(),
    title: input.title.trim(),
    description: input.description.trim(),
    body: input.body.trim(),
    dateLabel: formatEventTimeInTimezone(input.startsAtUtc),
    status: 'Scheduled',
    seats: '0 interested',
    source: 'channel',
    channelId: channel.id,
    channelName: channel.name,
    startsAtUtc: input.startsAtUtc,
    durationMinutes: input.durationMinutes ?? 120,
    createdAt: new Date().toISOString(),
    createdByMemberId,
  };

  const map = readCatalogEventsMap();
  map[event.id] = event;
  writeStoredEventsMap(map);

  notifySubscribedMembersOfEvent(event);

  return event;
}

export function updateStoredEvent(
  eventId: string,
  patch: Partial<
    Pick<
      StoredEvent,
      'title' | 'description' | 'body' | 'dateLabel' | 'status' | 'seats' | 'startsAtUtc' | 'durationMinutes'
    >
  >,
  editorMemberId = getSelfMember().id
): StoredEvent | null {
  const map = readCatalogEventsMap();
  const current = map[eventId];

  if (!current) {
    return null;
  }

  if (current.source === 'official' && !canEditOfficialEvent(members.find((m) => m.id === editorMemberId) ?? getSelfMember())) {
    return null;
  }

  if (current.source !== 'official' && current.createdByMemberId !== editorMemberId) {
    return null;
  }

  const updated: StoredEvent = {
    ...current,
    ...patch,
    dateLabel:
      patch.startsAtUtc !== undefined
        ? formatEventTimeInTimezone(patch.startsAtUtc)
        : (patch.dateLabel ?? current.dateLabel),
    updatedAt: new Date().toISOString(),
  };

  map[eventId] = updated;
  writeStoredEventsMap(map);

  return updated;
}

export function createOfficialEvent(
  input: {
    title: string;
    description: string;
    body: string;
    startsAtUtc: string;
    durationMinutes?: number;
  },
  createdByMemberId = getSelfMember().id
): StoredEvent | null {
  if (!canEditOfficialEvent(members.find((member) => member.id === createdByMemberId) ?? getSelfMember())) {
    return null;
  }

  const event: StoredEvent = {
    id: 'official-event-' + Date.now(),
    title: input.title.trim(),
    description: input.description.trim(),
    body: input.body.trim(),
    dateLabel: formatEventTimeInTimezone(input.startsAtUtc),
    status: 'Official',
    seats: 'Unlimited',
    source: 'official',
    startsAtUtc: input.startsAtUtc,
    durationMinutes: input.durationMinutes ?? 120,
    createdAt: new Date().toISOString(),
    createdByMemberId,
  };

  const map = readCatalogEventsMap();
  map[event.id] = event;
  writeStoredEventsMap(map);

  notifySubscribedMembersOfEvent(event);

  return event;
}

export function notifySubscribedMembersOfEvent(event: StoredEvent): void {
  const subscribedChannelIds = new Set(readSubscribedChannelIds());
  const subscriberIds = new Set<string>();

  for (const member of members) {
    if (member.id === event.createdByMemberId) {
      continue;
    }

    if (event.channelId && !subscribedChannelIds.has(event.channelId)) {
      continue;
    }

    subscriberIds.add(member.id);
  }

  for (const memberId of subscriberIds) {
    pushEventNotification({
      eventId: event.id,
      memberId,
      kind: 'new-event',
      message:
        'New event from ' +
        (event.channelName ?? 'Nami') +
        ': "' +
        event.title +
        '" · ' +
        formatEventTimeInTimezone(event.startsAtUtc, readViewerTimezone()),
    });
  }
}

export function getLiveInterestedEvents(memberId = getSelfMember().id): StoredEvent[] {
  const interestedIds = new Set(readInterestedEventIds(memberId));

  return getAllCatalogEvents().filter((event) => interestedIds.has(event.id) && isEventLive(event));
}

export function getStartingSoonInterestedEvents(memberId = getSelfMember().id): StoredEvent[] {
  const interestedIds = new Set(readInterestedEventIds(memberId));

  return getAllCatalogEvents().filter(
    (event) => interestedIds.has(event.id) && isEventStartingSoon(event)
  );
}

export function shouldShowLiveEventPopup(memberId = getSelfMember().id): boolean {
  const sessionKey = window.sessionStorage.getItem(POPUP_SESSION_KEY);

  if (sessionKey === 'dismissed-' + memberId) {
    return false;
  }

  return getLiveInterestedEvents(memberId).length > 0;
}

export function dismissLiveEventPopup(memberId = getSelfMember().id): void {
  window.sessionStorage.setItem(POPUP_SESSION_KEY, 'dismissed-' + memberId);
  emit();
}

function ensureEventInterested(eventId: string, memberId: string): void {
  const map = readInterestedMap();
  const current = map[eventId] ?? [];

  if (current.includes(memberId)) {
    return;
  }

  map[eventId] = [...current, memberId];
  writeInterestedMap(map);
}

function forceStoredEventPatch(
  eventId: string,
  patch: Partial<
    Pick<StoredEvent, 'startsAtUtc' | 'durationMinutes' | 'status' | 'dateLabel' | 'title' | 'description'>
  >
): StoredEvent | null {
  const map = readCatalogEventsMap();
  const current = map[eventId];

  if (!current) {
    return null;
  }

  const updated: StoredEvent = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  map[eventId] = updated;
  writeStoredEventsMap(map);

  return updated;
}

export function simulateLiveInterestedEventPopup(
  eventIds: string[] = ['nami-launch-festival', 'fiends-tournament'],
  memberId = getSelfMember().id
): StoredEvent[] {
  window.sessionStorage.removeItem(POPUP_SESSION_KEY);

  const now = Date.now();
  const simulated: StoredEvent[] = [];

  for (const [index, eventId] of eventIds.entries()) {
    const startsAtUtc = new Date(now - (8 + index * 4) * 60_000).toISOString();
    const updated = forceStoredEventPatch(eventId, {
      startsAtUtc,
      durationMinutes: 120,
      status: 'Live',
      dateLabel: formatEventTimeInTimezone(startsAtUtc),
    });

    if (!updated) {
      continue;
    }

    ensureEventInterested(eventId, memberId);
    pushEventNotification({
      eventId,
      memberId,
      kind: 'live',
      message: '"' + updated.title + '" is live now.',
    });
    simulated.push(updated);
  }

  return simulated;
}

export function simulateStartingSoonInterestedEvent(
  eventId = 'nami-launch-festival',
  memberId = getSelfMember().id,
  startsInMinutes = 10
): StoredEvent | null {
  const startsAtUtc = new Date(Date.now() + startsInMinutes * 60_000).toISOString();
  const updated = forceStoredEventPatch(eventId, {
    startsAtUtc,
    durationMinutes: 120,
    status: 'Starting soon',
    dateLabel: formatEventTimeInTimezone(startsAtUtc),
  });

  if (!updated) {
    return null;
  }

  ensureEventInterested(eventId, memberId);
  syncEventReminderNotifications(memberId);

  return updated;
}

export function syncEventReminderNotifications(memberId = getSelfMember().id): void {
  for (const event of getStartingSoonInterestedEvents(memberId)) {
    pushEventNotification({
      eventId: event.id,
      memberId,
      kind: 'starting-soon',
      message:
        '"' +
        event.title +
        '" starts soon · ' +
        formatEventTimeInTimezone(event.startsAtUtc) +
        '. Tap Interested on the event page to join.',
    });
  }

  for (const event of getLiveInterestedEvents(memberId)) {
    pushEventNotification({
      eventId: event.id,
      memberId,
      kind: 'live',
      message: '"' + event.title + '" is live now.',
    });
  }
}

function getEventsStoreSnapshot(): { revision: number } {
  if (!cachedStoreSnapshot) {
    cachedStoreSnapshot = { revision: getRevision() };
  }

  return cachedStoreSnapshot;
}

export function useEventsStore(): { revision: number } {
  return useSyncExternalStore(subscribe, getEventsStoreSnapshot, getEventsStoreSnapshot);
}