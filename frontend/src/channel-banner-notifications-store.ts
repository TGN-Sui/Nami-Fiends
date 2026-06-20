import { useSyncExternalStore } from 'react';

import { shouldUseDevFixtures } from './app-config.js';
import { canSubscribeToChannelBanners, getSelfMember } from './member-access.js';
import {
  preApprovedOwnerCapabilityAllowed,
  preApprovedOwnerRestrictionMessage,
} from './game-owner-approval-guards.js';
import { resolveChannelCoverUrl } from './channel-cover-store.js';
import { channels, type NamiChannel } from './uiMockData.js';

const BANNER_SUBSCRIPTIONS_KEY = 'nami.user.banner-subscriptions';
const BANNER_CONTENT_KEY = 'nami.channel.banner-content';
const BANNER_NOTIFICATIONS_KEY = 'nami.user.banner-notifications';
const BANNER_ACTIVE_KEY = 'nami.user.banner-active-notification';

export type ChannelBannerContent = {
  coverUrl: string;
  headline: string;
  body: string;
  updatedAtMs: number;
};

export type ChannelBannerNotification = {
  id: string;
  channelId: string;
  coverUrl: string;
  headline: string;
  body: string;
  createdAtMs: number;
  presented: boolean;
  opened: boolean;
};

type BannerContentMap = Record<string, ChannelBannerContent>;

let storeVersion = 0;

function dispatchBannerStoreChange(): void {
  storeVersion += 1;
  window.dispatchEvent(new CustomEvent('nami-banner-notifications-changed'));
}

function subscribeBannerStore(listener: () => void): () => void {
  function onChange(): void {
    listener();
  }

  window.addEventListener('nami-banner-notifications-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-banner-notifications-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getStoreVersion(): number {
  return storeVersion;
}

export function useChannelBannerNotificationsStore(): number {
  return useSyncExternalStore(subscribeBannerStore, getStoreVersion, () => 0);
}

function readJsonRecord<T>(key: string): Record<string, T> {
  try {
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);

    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }

    return parsed as Record<string, T>;
  } catch {
    return {};
  }
}

function writeJsonRecord<T>(key: string, value: Record<string, T>): void {
  window.localStorage.setItem(key, JSON.stringify(value));
  dispatchBannerStoreChange();
}

function readJsonArray<T>(key: string): T[] {
  try {
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(key: string, value: T[]): void {
  window.localStorage.setItem(key, JSON.stringify(value));
  dispatchBannerStoreChange();
}

export function defaultChannelBannerContent(channel: NamiChannel): ChannelBannerContent {
  return {
    coverUrl: resolveChannelCoverUrl(channel) ?? '',
    headline: channel.name,
    body: channel.banner || channel.tagline,
    updatedAtMs: Date.now(),
  };
}

export function readBannerSubscriptionChannelIds(): string[] {
  return readJsonArray<string>(BANNER_SUBSCRIPTIONS_KEY).filter(
    (entry): entry is string => typeof entry === 'string',
  );
}

export function isChannelBannerAlertsEnabled(channelId: string): boolean {
  return readBannerSubscriptionChannelIds().includes(channelId);
}

export type BannerAlertsSubscribeResult =
  | { ok: true; alreadyEnabled: boolean }
  | { ok: false; reason: 'unknown-channel' | 'not-verified' };

export function subscribeToChannelBannerAlerts(channelId: string): BannerAlertsSubscribeResult {
  if (!canSubscribeToChannelBanners(getSelfMember())) {
    return { ok: false, reason: 'not-verified' };
  }

  if (!channels.some((channel) => channel.id === channelId)) {
    return { ok: false, reason: 'unknown-channel' };
  }

  const currentIds = readBannerSubscriptionChannelIds();

  if (currentIds.includes(channelId)) {
    return { ok: true, alreadyEnabled: true };
  }

  writeJsonArray(BANNER_SUBSCRIPTIONS_KEY, [...currentIds, channelId]);
  return { ok: true, alreadyEnabled: false };
}

export function unsubscribeFromChannelBannerAlerts(channelId: string): void {
  writeJsonArray(
    BANNER_SUBSCRIPTIONS_KEY,
    readBannerSubscriptionChannelIds().filter((id) => id !== channelId),
  );
}

export function readChannelBannerContent(channelId: string, channel?: NamiChannel): ChannelBannerContent {
  const stored = readJsonRecord<ChannelBannerContent>(BANNER_CONTENT_KEY)[channelId];
  const fallbackChannel = channel ?? channels.find((entry) => entry.id === channelId);

  if (stored && stored.headline.trim() !== '') {
    return stored;
  }

  if (fallbackChannel) {
    return defaultChannelBannerContent(fallbackChannel);
  }

  return {
    coverUrl: '',
    headline: 'Channel update',
    body: 'New activity from this game channel.',
    updatedAtMs: Date.now(),
  };
}

export function saveChannelBannerContent(channelId: string, content: ChannelBannerContent): void {
  const map = readJsonRecord<ChannelBannerContent>(BANNER_CONTENT_KEY);

  map[channelId] = {
    ...content,
    updatedAtMs: Date.now(),
  };

  writeJsonRecord(BANNER_CONTENT_KEY, map);
}

export function readBannerNotifications(): ChannelBannerNotification[] {
  return readJsonArray<ChannelBannerNotification>(BANNER_NOTIFICATIONS_KEY)
    .filter((entry) => typeof entry?.id === 'string' && typeof entry?.channelId === 'string')
    .sort((left, right) => left.createdAtMs - right.createdAtMs);
}

function writeBannerNotifications(notifications: ChannelBannerNotification[]): void {
  writeJsonArray(BANNER_NOTIFICATIONS_KEY, notifications);
}

export function readActiveBannerNotificationId(): string | null {
  try {
    const stored = window.localStorage.getItem(BANNER_ACTIVE_KEY);

    return stored && stored.trim() !== '' ? stored : null;
  } catch {
    return null;
  }
}

function writeActiveBannerNotificationId(notificationId: string | null): void {
  if (!notificationId) {
    window.localStorage.removeItem(BANNER_ACTIVE_KEY);
  } else {
    window.localStorage.setItem(BANNER_ACTIVE_KEY, notificationId);
  }

  dispatchBannerStoreChange();
}

export function readWaitingBannerNotificationCount(): number {
  return readBannerNotifications().filter((notification) => !notification.presented).length;
}

/** @deprecated Use readWaitingBannerNotificationCount — waiting means not yet viewed in the popup. */
export function readUnopenedBannerNotificationCount(): number {
  return readWaitingBannerNotificationCount();
}

export function readActiveBannerNotification(): ChannelBannerNotification | null {
  const activeId = readActiveBannerNotificationId();

  if (!activeId) {
    return null;
  }

  return readBannerNotifications().find((notification) => notification.id === activeId) ?? null;
}

function createBannerNotification(channelId: string): ChannelBannerNotification | null {
  const channel = channels.find((entry) => entry.id === channelId);

  if (!channel) {
    return null;
  }

  const content = readChannelBannerContent(channelId, channel);

  return {
    id: 'banner-' + channelId + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    channelId,
    coverUrl: content.coverUrl,
    headline: content.headline,
    body: content.body,
    createdAtMs: Date.now(),
    presented: false,
    opened: false,
  };
}

export function enqueueChannelBannerNotification(channelId: string): ChannelBannerNotification | null {
  if (!isChannelBannerAlertsEnabled(channelId)) {
    return null;
  }

  const notification = createBannerNotification(channelId);

  if (!notification) {
    return null;
  }

  const nextNotifications = [...readBannerNotifications(), notification];

  writeBannerNotifications(nextNotifications);

  if (!readActiveBannerNotificationId()) {
    writeActiveBannerNotificationId(notification.id);
  }

  return notification;
}

export function publishChannelBannerAlert(channelId: string): ChannelBannerNotification | null {
  return enqueueChannelBannerNotification(channelId);
}

function deliverChannelBannerNotification(channelId: string): ChannelBannerNotification | null {
  const notification = createBannerNotification(channelId);

  if (!notification) {
    return null;
  }

  const nextNotifications = [...readBannerNotifications(), notification];

  writeBannerNotifications(nextNotifications);

  if (!readActiveBannerNotificationId()) {
    writeActiveBannerNotificationId(notification.id);
  }

  return notification;
}

/** Owner publish — delivers to subscribers without requiring the owner to enable Get Banners. */
export function publishChannelBannerAlertForOwner(
  channelId: string,
): ChannelBannerNotification | null {
  if (!preApprovedOwnerCapabilityAllowed('send-banners', channelId)) {
    return null;
  }

  return deliverChannelBannerNotification(channelId);
}

function updateBannerNotification(
  notificationId: string,
  updater: (notification: ChannelBannerNotification) => ChannelBannerNotification,
): void {
  const nextNotifications = readBannerNotifications().map((notification) => {
    return notification.id === notificationId ? updater(notification) : notification;
  });

  writeBannerNotifications(nextNotifications);
}

function activateNextPresentableBanner(): ChannelBannerNotification | null {
  const nextNotification =
    readBannerNotifications().find((notification) => !notification.presented) ?? null;

  writeActiveBannerNotificationId(nextNotification?.id ?? null);
  return nextNotification;
}

export function dismissActiveBannerNotification(): ChannelBannerNotification | null {
  const activeId = readActiveBannerNotificationId();

  if (activeId) {
    updateBannerNotification(activeId, (notification) => ({
      ...notification,
      presented: true,
    }));
  }

  return activateNextPresentableBanner();
}

export function openActiveBannerNotification(): ChannelBannerNotification | null {
  const activeId = readActiveBannerNotificationId();

  if (!activeId) {
    return null;
  }

  updateBannerNotification(activeId, (notification) => ({
    ...notification,
    presented: true,
    opened: true,
  }));

  writeActiveBannerNotificationId(null);
  return null;
}

export function closeBannerNotificationOverlay(): void {
  if (readWaitingBannerNotificationCount() === 1) {
    dismissActiveBannerNotification();
    return;
  }

  writeActiveBannerNotificationId(null);
}

export function openBannerReminderQueue(): ChannelBannerNotification | null {
  const active = readActiveBannerNotification();

  if (active) {
    return active;
  }

  const reminderTarget =
    readBannerNotifications().find((notification) => !notification.presented) ?? null;

  writeActiveBannerNotificationId(reminderTarget?.id ?? null);
  return reminderTarget;
}

export function clearBannerNotifications(): void {
  writeBannerNotifications([]);
  writeActiveBannerNotificationId(null);
}

export function simulateChannelBannerBurst(channelIds?: string[]): ChannelBannerNotification[] {
  const targets =
    channelIds && channelIds.length > 0
      ? channelIds.filter((channelId) => isChannelBannerAlertsEnabled(channelId))
      : readBannerSubscriptionChannelIds();

  const created: ChannelBannerNotification[] = [];

  for (const channelId of targets) {
    const notification = createBannerNotification(channelId);

    if (!notification) {
      continue;
    }

    created.push(notification);
  }

  if (created.length === 0) {
    return created;
  }

  const nextNotifications = [...readBannerNotifications(), ...created];

  writeBannerNotifications(nextNotifications);

  if (!readActiveBannerNotificationId()) {
    writeActiveBannerNotificationId(created[0]!.id);
  }

  return created;
}

export function scheduleWelcomeBannerNotification(channelId: string, delayMs = 2800): void {
  window.setTimeout(() => {
    enqueueChannelBannerNotification(channelId);
  }, delayMs);
}

let simulationTimer: number | null = null;

export function startChannelBannerSimulation(intervalMs = 55_000): () => void {
  if (!shouldUseDevFixtures()) {
    return () => undefined;
  }

  if (simulationTimer !== null) {
    window.clearInterval(simulationTimer);
  }

  simulationTimer = window.setInterval(() => {
    const subscriptions = readBannerSubscriptionChannelIds();

    if (subscriptions.length === 0) {
      return;
    }

    if (Math.random() > 0.42) {
      return;
    }

    const channelId = subscriptions[Math.floor(Math.random() * subscriptions.length)]!;

    enqueueChannelBannerNotification(channelId);
  }, intervalMs);

  return () => {
    if (simulationTimer !== null) {
      window.clearInterval(simulationTimer);
      simulationTimer = null;
    }
  };
}

export function resolveBannerNotificationChannel(
  notification: ChannelBannerNotification,
): NamiChannel | undefined {
  return channels.find((channel) => channel.id === notification.channelId);
}