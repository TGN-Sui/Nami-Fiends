import type { OwnerPanelId } from './channel-owner-layout-store.js';

export type OwnerSettingsGroup = 'brand-media' | 'promotions' | 'alerts' | 'advanced';

export type OwnerSettingsGroupDefinition = {
  id: OwnerSettingsGroup;
  label: string;
  description: string;
  panels: OwnerPanelId[];
};

export const OWNER_SETTINGS_GROUPS: OwnerSettingsGroupDefinition[] = [
  {
    id: 'brand-media',
    label: 'Brand & media',
    description: 'Palette, covers, trailer, and supported platforms.',
    panels: ['brand-palette', 'supported-platforms', 'cover', 'hero-background', 'news-banner', 'trailer'],
  },
  {
    id: 'promotions',
    label: 'Promotions',
    description: 'Hub featured spots, partner carousel, and super banners.',
    panels: ['promotions'],
  },
  {
    id: 'alerts',
    label: 'Alerts & emojis',
    description: 'Focused banner alerts and custom channel emojis.',
    panels: ['banner-editor', 'custom-emojis'],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Channel data and owner layout customization.',
    panels: ['channel-data'],
  },
];

const GROUP_KEY_PREFIX = 'nami.channel-owner-settings-group.';

export function readOwnerSettingsGroup(channelId: string): OwnerSettingsGroup {
  try {
    const stored = window.localStorage.getItem(GROUP_KEY_PREFIX + channelId);

    if (
      stored === 'brand-media' ||
      stored === 'promotions' ||
      stored === 'alerts' ||
      stored === 'advanced'
    ) {
      return stored;
    }
  } catch {
    // ignore
  }

  return 'brand-media';
}

export function saveOwnerSettingsGroup(channelId: string, group: OwnerSettingsGroup): void {
  window.localStorage.setItem(GROUP_KEY_PREFIX + channelId, group);
}

export function ownerSettingsGroupForPanel(panelId: OwnerPanelId): OwnerSettingsGroup {
  for (const group of OWNER_SETTINGS_GROUPS) {
    if (group.panels.includes(panelId)) {
      return group.id;
    }
  }

  return 'advanced';
}