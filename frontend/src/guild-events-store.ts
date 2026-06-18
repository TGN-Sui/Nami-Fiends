import { useSyncExternalStore } from 'react';

import { getSelfMember } from './member-access.js';
import { guildOwnerEvents, type NamiEvent } from './events-data.js';
import { guildsForMember, namiGuilds, type NamiGuildRecord } from './nami-affiliations.js';

const EVENTS_KEY = 'nami.user.guild-events';
const NOTIFICATIONS_KEY = 'nami.user.guild-event-notifications';

export type StoredGuildEvent = NamiEvent & {
  createdAt: string;
  createdByMemberId: string;
  updatedAt?: string;
};

type GuildEventNotifications = Record<
  string,
  {
    unreadEventIds: string[];
  }
>;

const listeners = new Set<() => void>();
let cachedStoreSnapshot: { unreadCount: number } | null = null;

function emit(): void {
  cachedStoreSnapshot = null;
  listeners.forEach((listener) => listener());
}

function getStoreSnapshot(): { unreadCount: number } {
  if (!cachedStoreSnapshot) {
    cachedStoreSnapshot = {
      unreadCount: readGuildEventUnreadCount(),
    };
  }

  return cachedStoreSnapshot;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function seedGuildEvents(): Record<string, StoredGuildEvent[]> {
  const seeded: Record<string, StoredGuildEvent[]> = {};

  for (const event of guildOwnerEvents) {
    const guildId = event.guildId ?? 'guild-wave-raiders';
    const guild = namiGuilds.find((entry) => entry.id === 'guild-' + guildId) ?? namiGuilds[0]!;

    const stored: StoredGuildEvent = {
      ...event,
      guildId: guild.id,
      guildName: event.guildName ?? guild.name,
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
      createdByMemberId: guild.ownerMemberId,
    };

    seeded[guild.id] = [...(seeded[guild.id] ?? []), stored];
  }

  return seeded;
}

function readGuildEventsMap(): Record<string, StoredGuildEvent[]> {
  try {
    const stored = window.localStorage.getItem(EVENTS_KEY);

    if (!stored) {
      const seeded = seedGuildEvents();
      window.localStorage.setItem(EVENTS_KEY, JSON.stringify(seeded));
      return seeded;
    }

    const parsed = JSON.parse(stored);

    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, StoredGuildEvent[]>)
      : seedGuildEvents();
  } catch {
    return seedGuildEvents();
  }
}

function writeGuildEventsMap(events: Record<string, StoredGuildEvent[]>): void {
  window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  emit();
}

function readNotifications(): GuildEventNotifications {
  try {
    const stored = window.localStorage.getItem(NOTIFICATIONS_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);

    return typeof parsed === 'object' && parsed !== null ? (parsed as GuildEventNotifications) : {};
  } catch {
    return {};
  }
}

function writeNotifications(notifications: GuildEventNotifications): void {
  window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  emit();
}

export function getGuildEvents(guildId: string): StoredGuildEvent[] {
  return readGuildEventsMap()[guildId] ?? [];
}

export function canEditGuildEvent(event: StoredGuildEvent, memberId = getSelfMember().id): boolean {
  return event.createdByMemberId === memberId;
}

export function createGuildEvent(
  guild: NamiGuildRecord,
  title: string,
  createdByMemberId = getSelfMember().id
): StoredGuildEvent {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    throw new Error('Guild event title is required.');
  }

  const event: StoredGuildEvent = {
    id: 'guild-event-' + guild.id + '-' + Date.now(),
    title: trimmedTitle,
    description: 'New guild event created by ' + getSelfMember().name + '.',
    body:
      'Guild members can coordinate schedules, squad assignments, and reward unlocks from this event page.',
    dateLabel: 'Scheduling open',
    status: 'New',
    seats: guild.memberIds.length + '/' + Math.max(guild.memberIds.length, 12),
    source: 'guild',
    guildId: guild.id,
    guildName: guild.name,
    createdAt: new Date().toISOString(),
    createdByMemberId,
  };

  const eventsMap = readGuildEventsMap();

  writeGuildEventsMap({
    ...eventsMap,
    [guild.id]: [...(eventsMap[guild.id] ?? []), event],
  });

  notifyGuildMembersOfNewEvent(guild, event.id, createdByMemberId);

  return event;
}

export function updateGuildEvent(
  guildId: string,
  eventId: string,
  patch: Partial<Pick<StoredGuildEvent, 'title' | 'description' | 'body' | 'dateLabel' | 'status' | 'seats'>>,
  editorMemberId = getSelfMember().id
): StoredGuildEvent | null {
  const eventsMap = readGuildEventsMap();
  const guildEvents = eventsMap[guildId] ?? [];
  const targetIndex = guildEvents.findIndex((event) => event.id === eventId);

  if (targetIndex < 0) {
    return null;
  }

  const target = guildEvents[targetIndex]!;

  if (!canEditGuildEvent(target, editorMemberId)) {
    return null;
  }

  const updated: StoredGuildEvent = {
    ...target,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  const nextGuildEvents = [...guildEvents];
  nextGuildEvents[targetIndex] = updated;

  writeGuildEventsMap({
    ...eventsMap,
    [guildId]: nextGuildEvents,
  });

  return updated;
}

function notifyGuildMembersOfNewEvent(
  guild: NamiGuildRecord,
  eventId: string,
  createdByMemberId: string
): void {
  const notifications = readNotifications();

  for (const memberId of guild.memberIds) {
    if (memberId === createdByMemberId) {
      continue;
    }

    const current = notifications[memberId] ?? { unreadEventIds: [] };

    if (current.unreadEventIds.includes(eventId)) {
      continue;
    }

    notifications[memberId] = {
      unreadEventIds: [...current.unreadEventIds, eventId],
    };
  }

  writeNotifications(notifications);
}

export function readGuildEventUnreadCount(memberId = getSelfMember().id): number {
  return readNotifications()[memberId]?.unreadEventIds.length ?? 0;
}

export function markGuildEventsSeen(memberId = getSelfMember().id): void {
  const notifications = readNotifications();

  if (!notifications[memberId]) {
    return;
  }

  delete notifications[memberId];
  writeNotifications(notifications);
}

export function markGuildSeen(guildId: string, memberId = getSelfMember().id): void {
  const notifications = readNotifications();
  const current = notifications[memberId];

  if (!current) {
    return;
  }

  const guildEventIds = new Set(getGuildEvents(guildId).map((event) => event.id));
  const nextUnread = current.unreadEventIds.filter((eventId) => !guildEventIds.has(eventId));

  if (nextUnread.length === 0) {
    delete notifications[memberId];
  } else {
    notifications[memberId] = { unreadEventIds: nextUnread };
  }

  writeNotifications(notifications);
}

export function guildsWithUnreadEvents(memberId = getSelfMember().id): string[] {
  const unreadIds = new Set(readNotifications()[memberId]?.unreadEventIds ?? []);
  const guildIds: string[] = [];

  for (const guild of guildsForMember(memberId)) {
    const hasUnread = getGuildEvents(guild.id).some((event) => unreadIds.has(event.id));

    if (hasUnread) {
      guildIds.push(guild.id);
    }
  }

  return guildIds;
}

export function useGuildEventsStore(): {
  unreadCount: number;
} {
  return useSyncExternalStore(subscribe, getStoreSnapshot, getStoreSnapshot);
}