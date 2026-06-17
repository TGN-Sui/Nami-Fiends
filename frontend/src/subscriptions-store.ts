import { useSyncExternalStore } from 'react';

import { channels, type NamiChannel, type NamiMember } from './uiMockData.js';

const SUBSCRIPTIONS_KEY = 'nami.user.subscriptions';

const defaultChannelIds = channels.slice(0, 4).map((channel) => channel.id);

let cachedChannelSnapshot: NamiChannel[] | null = null;
let cachedChannelIdsKey = '';

function invalidateChannelSnapshot(): void {
  cachedChannelSnapshot = null;
  cachedChannelIdsKey = '';
}

export function subscriptionSlotLimit(tier: NamiMember['tier']): number {
  if (tier === 'Elite') {
    return 8;
  }

  if (tier === 'Pro') {
    return 5;
  }

  if (tier === 'Adventurer') {
    return 3;
  }

  return 1;
}

export function readSubscribedChannelIds(): string[] {
  try {
    const stored = window.localStorage.getItem(SUBSCRIPTIONS_KEY);

    if (!stored) {
      return [...defaultChannelIds];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [...defaultChannelIds];
    }

    return parsed.filter((entry): entry is string => typeof entry === 'string');
  } catch {
    return [...defaultChannelIds];
  }
}

export function saveSubscribedChannelIds(channelIds: string[]): void {
  window.localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(channelIds));
  invalidateChannelSnapshot();
  window.dispatchEvent(new CustomEvent('nami-subscriptions-changed'));
}

export function readSubscribedChannels(): NamiChannel[] {
  const ids = readSubscribedChannelIds();
  const idsKey = ids.join('|');

  if (cachedChannelSnapshot && cachedChannelIdsKey === idsKey) {
    return cachedChannelSnapshot;
  }

  cachedChannelIdsKey = idsKey;
  cachedChannelSnapshot = ids
    .map((id) => channels.find((channel) => channel.id === id))
    .filter((channel): channel is NamiChannel => channel !== undefined);

  return cachedChannelSnapshot;
}

export function isChannelSubscribed(channelId: string): boolean {
  return readSubscribedChannelIds().includes(channelId);
}

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: 'already-subscribed' | 'slots-full' };

export function subscribeToChannel(channelId: string, tier: NamiMember['tier']): SubscribeResult {
  const currentIds = readSubscribedChannelIds();

  if (currentIds.includes(channelId)) {
    return { ok: false, reason: 'already-subscribed' };
  }

  const limit = subscriptionSlotLimit(tier);

  if (currentIds.length >= limit) {
    return { ok: false, reason: 'slots-full' };
  }

  saveSubscribedChannelIds([...currentIds, channelId]);
  return { ok: true };
}

export function unsubscribeFromChannel(channelId: string): void {
  saveSubscribedChannelIds(readSubscribedChannelIds().filter((id) => id !== channelId));
}

export function useSubscribedChannels(): NamiChannel[] {
  return useSyncExternalStore(subscribeToStore, readSubscribedChannels, readSubscribedChannels);
}

export function subscribeToStore(listener: () => void): () => void {
  function onChange(): void {
    invalidateChannelSnapshot();
    listener();
  }

  window.addEventListener('nami-subscriptions-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-subscriptions-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}