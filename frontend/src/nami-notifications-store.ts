import { useSyncExternalStore } from 'react';

import { getSelfMember } from './member-access.js';
import {
  guildByName,
  guildsForMember,
  namiGuilds,
  namiSquads,
  squadByName,
  squadsForMember,
} from './nami-affiliations.js';
import { extractTagsFromMessage, type NamiTagTarget } from './nami-tag-registry.js';
import { members } from './uiMockData.js';

const NOTIFICATIONS_KEY = 'nami.user.tag-notifications';
const PREFERENCES_KEY = 'nami.user.notification-preferences';

export type TagNotificationContext = 'channel' | 'global' | 'private';

export type TagNotification = {
  id: string;
  createdAt: string;
  read: boolean;
  authorName: string;
  bodyPreview: string;
  context: TagNotificationContext;
  contextLabel: string;
  tagLabel: string;
  tagKind: NamiTagTarget['kind'];
  targetId: string;
};

type NotificationPreferences = {
  tagMentionsEnabled: boolean;
};

const listeners = new Set<() => void>();
let cachedSnapshot: TagNotification[] | null = null;

function emit(): void {
  cachedSnapshot = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function nowIso(): string {
  return new Date().toISOString();
}

function readPreferences(): NotificationPreferences {
  try {
    const stored = window.localStorage.getItem(PREFERENCES_KEY);

    if (!stored) {
      return { tagMentionsEnabled: true };
    }

    const parsed = JSON.parse(stored) as Partial<NotificationPreferences>;

    return {
      tagMentionsEnabled: parsed.tagMentionsEnabled !== false,
    };
  } catch {
    return { tagMentionsEnabled: true };
  }
}

function writePreferences(preferences: NotificationPreferences): void {
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  emit();
}

function readNotifications(): TagNotification[] {
  try {
    const stored = window.localStorage.getItem(NOTIFICATIONS_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as TagNotification[]) : [];
  } catch {
    return [];
  }
}

function writeNotifications(notifications: TagNotification[]): void {
  window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 120)));
  emit();
}

function buildSnapshot(): TagNotification[] {
  return readNotifications();
}

function getSnapshot(): TagNotification[] {
  if (!cachedSnapshot) {
    cachedSnapshot = buildSnapshot();
  }

  return cachedSnapshot;
}

export function useTagNotifications(): TagNotification[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useUnreadTagNotificationCount(): number {
  const notifications = useTagNotifications();

  return notifications.filter((notification) => !notification.read).length;
}

export function readUnreadTagNotificationCount(): number {
  return readNotifications().filter((notification) => !notification.read).length;
}

export function readTagMentionNotificationsEnabled(): boolean {
  return readPreferences().tagMentionsEnabled;
}

export function saveTagMentionNotificationsEnabled(enabled: boolean): void {
  writePreferences({ tagMentionsEnabled: enabled });
}

export function markAllTagNotificationsRead(): void {
  writeNotifications(readNotifications().map((notification) => ({ ...notification, read: true })));
}

export function markTagNotificationRead(notificationId: string): void {
  writeNotifications(
    readNotifications().map((notification) => {
      if (notification.id !== notificationId) {
        return notification;
      }

      return { ...notification, read: true };
    })
  );
}

function shouldNotifyForTarget(target: NamiTagTarget): boolean {
  const selfMember = getSelfMember();
  const selfId = selfMember.id;
  const selfName = selfMember.name.toLowerCase();

  if (target.kind === 'member') {
    return target.id === selfId || target.label.toLowerCase() === selfName;
  }

  if (target.kind === 'guild') {
    const guild = namiGuilds.find((entry) => entry.id === target.id) ?? guildByName(target.label);

    if (!guild) {
      return false;
    }

    return (
      guild.ownerMemberId === selfId ||
      guild.memberIds.includes(selfId) ||
      guildsForMember(selfId).some((entry) => entry.id === guild.id)
    );
  }

  if (target.kind === 'squad') {
    const squad = namiSquads.find((entry) => entry.id === target.id) ?? squadByName(target.label);

    if (!squad) {
      return false;
    }

    return squad.memberIds.includes(selfId) || squadsForMember(selfId).some((entry) => entry.id === squad.id);
  }

  if (target.kind === 'channel') {
    return false;
  }

  if (target.kind === 'studio' || target.kind === 'dev') {
    return false;
  }

  return false;
}

export function processMessageTags(input: {
  body: string;
  authorName: string;
  context: TagNotificationContext;
  contextLabel: string;
}): void {
  if (!readTagMentionNotificationsEnabled()) {
    return;
  }

  const selfMember = getSelfMember();

  if (input.authorName === selfMember.name) {
    return;
  }

  const tags = extractTagsFromMessage(input.body);
  const relevantTags = tags.filter((tag) => shouldNotifyForTarget(tag));

  if (relevantTags.length === 0) {
    return;
  }

  const existing = readNotifications();
  const createdAt = nowIso();
  const preview = input.body.trim().slice(0, 140);

  const incoming = relevantTags.map((tag, index) => ({
    id: 'tag-' + Date.now() + '-' + index,
    createdAt,
    read: false,
    authorName: input.authorName,
    bodyPreview: preview,
    context: input.context,
    contextLabel: input.contextLabel,
    tagLabel: tag.label,
    tagKind: tag.kind,
    targetId: tag.id,
  }));

  writeNotifications([...incoming, ...existing]);
}

const DEMO_SEED_KEY = 'nami.user.tag-notifications-demo-seeded';

export function seedDemoTagNotifications(): void {
  if (window.localStorage.getItem(DEMO_SEED_KEY)) {
    return;
  }

  const demoMessages = [
    {
      body: 'LFG for ranked runs tonight @Robbos — voice room is open.',
      authorName: 'DeadlySin',
      context: 'global' as const,
      contextLabel: 'Global Chat · Official Nami Global',
    },
    {
      body: 'Looking for members for tonight’s &Wave Raiders run. Ping @DeadlySin if you are in.',
      authorName: 'Robbos',
      context: 'channel' as const,
      contextLabel: 'Game Chat · FIENDS',
    },
  ];

  for (const message of demoMessages) {
    processMessageTags(message);
  }

  window.localStorage.setItem(DEMO_SEED_KEY, '1');
}

export function memberNameForTagNotification(notification: TagNotification): string | null {
  if (notification.tagKind !== 'member') {
    return null;
  }

  return members.find((member) => member.id === notification.targetId)?.name ?? notification.tagLabel;
}