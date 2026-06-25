import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { channels, members } from './uiMockData.js';

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

vi.mock('./channel-cover-store.js', () => ({
  resolveChannelCoverUrl: () => 'data:image/png;base64,cover',
}));

import {
  clearBannerNotifications,
  closeBannerNotificationOverlay,
  dismissActiveBannerNotification,
  enqueueChannelBannerNotification,
  isChannelBannerAlertsEnabled,
  openActiveBannerNotification,
  openBannerReminderQueue,
  publishChannelBannerAlertForOwner,
  readActiveBannerNotificationId,
  readChannelBannerContent,
  saveChannelBannerContent,
  readWaitingBannerNotificationCount,
  simulateChannelBannerBurst,
  subscribeToChannelBannerAlerts,
} from './channel-banner-notifications-store.js';

describe('channel-banner-notifications-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setTimeout: vi.fn(),
      clearInterval: vi.fn(),
      setInterval: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tracks banner alert subscriptions per channel', () => {
    const channelId = channels[0]!.id;

    expect(isChannelBannerAlertsEnabled(channelId)).toBe(false);

    const result = subscribeToChannelBannerAlerts(channelId);

    expect(result.ok).toBe(true);
    expect(isChannelBannerAlertsEnabled(channelId)).toBe(true);
  });

  it('queues simultaneous banners and advances with slowmode dismissals', () => {
    const firstChannel = channels[0]!.id;
    const secondChannel = channels[1]!.id;

    subscribeToChannelBannerAlerts(firstChannel);
    subscribeToChannelBannerAlerts(secondChannel);

    simulateChannelBannerBurst([firstChannel, secondChannel]);

    expect(readWaitingBannerNotificationCount()).toBe(2);

    dismissActiveBannerNotification();

    expect(readWaitingBannerNotificationCount()).toBe(1);

    openActiveBannerNotification();

    expect(readWaitingBannerNotificationCount()).toBe(0);
    expect(readActiveBannerNotificationId()).toBeNull();
  });

  it('marks a single waiting banner as viewed when the overlay is closed', () => {
    const channelId = channels[0]!.id;

    subscribeToChannelBannerAlerts(channelId);
    simulateChannelBannerBurst([channelId]);

    expect(readWaitingBannerNotificationCount()).toBe(1);

    closeBannerNotificationOverlay();

    expect(readWaitingBannerNotificationCount()).toBe(0);
    expect(readActiveBannerNotificationId()).toBeNull();
  });

  it('closes the overlay without advancing or clearing the waiting indicator', () => {
    const firstChannel = channels[0]!.id;
    const secondChannel = channels[1]!.id;

    subscribeToChannelBannerAlerts(firstChannel);
    subscribeToChannelBannerAlerts(secondChannel);
    simulateChannelBannerBurst([firstChannel, secondChannel]);

    closeBannerNotificationOverlay();

    expect(readWaitingBannerNotificationCount()).toBe(2);
    expect(readActiveBannerNotificationId()).toBeNull();
  });

  it('clears the waiting indicator after each viewed banner from the reminder queue', () => {
    const firstChannel = channels[0]!.id;
    const secondChannel = channels[1]!.id;

    subscribeToChannelBannerAlerts(firstChannel);
    subscribeToChannelBannerAlerts(secondChannel);
    simulateChannelBannerBurst([firstChannel, secondChannel]);

    dismissActiveBannerNotification();
    dismissActiveBannerNotification();

    expect(readWaitingBannerNotificationCount()).toBe(0);
    expect(readActiveBannerNotificationId()).toBeNull();

    simulateChannelBannerBurst([firstChannel]);
    dismissActiveBannerNotification();

    expect(readWaitingBannerNotificationCount()).toBe(0);

    simulateChannelBannerBurst([firstChannel, secondChannel]);
    expect(readWaitingBannerNotificationCount()).toBe(2);

    openBannerReminderQueue();
    dismissActiveBannerNotification();

    expect(readWaitingBannerNotificationCount()).toBe(1);

    openBannerReminderQueue();
    dismissActiveBannerNotification();

    expect(readWaitingBannerNotificationCount()).toBe(0);
  });

  it('lets channel owners publish without enabling Get Banners on their own channel', () => {
    clearBannerNotifications();

    const channelId = channels[0]!.id;

    expect(isChannelBannerAlertsEnabled(channelId)).toBe(false);

    const published = publishChannelBannerAlertForOwner(channelId);

    expect(published).not.toBeNull();
    expect(readWaitingBannerNotificationCount()).toBe(1);
    expect(readActiveBannerNotificationId()).toBe(published?.id ?? null);
  });

  it('ignores enqueue when alerts are disabled for that channel', () => {
    clearBannerNotifications();

    const created = enqueueChannelBannerNotification(channels[0]!.id);

    expect(created).toBeNull();
    expect(readWaitingBannerNotificationCount()).toBe(0);
  });

  it('carries tagged member shoutouts into published banner alerts', () => {
    clearBannerNotifications();

    const channel = channels[0]!;
    const member = members[1]!;

    saveChannelBannerContent(channel.id, {
      ...readChannelBannerContent(channel.id, channel),
      shoutoutMemberId: member.id,
      shoutoutMemberName: member.name,
      updatedAtMs: Date.now(),
    });

    const published = publishChannelBannerAlertForOwner(channel.id);

    expect(published?.shoutoutMemberId).toBe(member.id);
    expect(published?.shoutoutMemberName).toBe(member.name);
  });
});