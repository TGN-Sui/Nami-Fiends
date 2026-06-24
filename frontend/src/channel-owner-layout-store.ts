import { useSyncExternalStore } from 'react';

import type { ChannelProfileSection } from './channel-profile-sections.js';

export type OwnerPanelId =
  | 'promotions'
  | 'supported-platforms'
  | 'brand-palette'
  | 'cover'
  | 'hero-background'
  | 'news-banner'
  | 'trailer'
  | 'custom-emojis'
  | 'banner-editor'
  | 'channel-data'
  | 'ownership-transfer';

export const DEFAULT_PROFILE_TAB_ORDER: ChannelProfileSection[] = [
  'news',
  'events',
  'reviews',
  'about',
  'chat',
  'owner',
];

export const DEFAULT_OWNER_PANEL_ORDER: OwnerPanelId[] = [
  'promotions',
  'supported-platforms',
  'brand-palette',
  'cover',
  'hero-background',
  'news-banner',
  'trailer',
  'custom-emojis',
  'banner-editor',
  'channel-data',
  'ownership-transfer',
];

export const OWNER_PANEL_LABELS: Record<OwnerPanelId, string> = {
  promotions: 'Promotions',
  'supported-platforms': 'Supported platforms',
  'brand-palette': 'Brand palette',
  cover: 'Cover image',
  'hero-background': 'Hero background',
  'news-banner': 'News banner',
  trailer: 'Game trailer',
  'custom-emojis': 'Channel emojis',
  'banner-editor': 'Focused banner alerts',
  'channel-data': 'Channel data',
  'ownership-transfer': 'Transfer ownership',
};

type ChannelLayoutState = {
  tabOrder: ChannelProfileSection[];
  ownerPanelOrder: OwnerPanelId[];
  collapsedOwnerPanels: OwnerPanelId[];
};

const LAYOUT_KEY_PREFIX = 'nami.channel-owner-layout.';
const EDIT_MODE_KEY_PREFIX = 'nami.channel-owner-edit-mode.';

let layoutVersion = 0;
let cachedLayouts: Record<string, ChannelLayoutState> | null = null;
let cachedEditModes: Record<string, boolean> | null = null;

function storageKey(channelId: string): string {
  return LAYOUT_KEY_PREFIX + channelId;
}

function editModeKey(channelId: string): string {
  return EDIT_MODE_KEY_PREFIX + channelId;
}

function dispatchLayoutChange(): void {
  layoutVersion += 1;
  cachedLayouts = null;
  cachedEditModes = null;
  window.dispatchEvent(new CustomEvent('nami-channel-owner-layout-changed'));
}

function sanitizeTabOrder(value: unknown): ChannelProfileSection[] {
  const allowed = new Set<ChannelProfileSection>(DEFAULT_PROFILE_TAB_ORDER);

  if (!Array.isArray(value)) {
    return [...DEFAULT_PROFILE_TAB_ORDER];
  }

  const seen = new Set<ChannelProfileSection>();
  const ordered: ChannelProfileSection[] = [];

  for (const entry of value) {
    if (typeof entry !== 'string' || !allowed.has(entry as ChannelProfileSection)) {
      continue;
    }

    const section = entry as ChannelProfileSection;

    if (seen.has(section)) {
      continue;
    }

    seen.add(section);
    ordered.push(section);
  }

  for (const section of DEFAULT_PROFILE_TAB_ORDER) {
    if (!seen.has(section)) {
      ordered.push(section);
    }
  }

  return ordered;
}

function sanitizeOwnerPanelOrder(value: unknown): OwnerPanelId[] {
  const allowed = new Set<OwnerPanelId>(DEFAULT_OWNER_PANEL_ORDER);

  if (!Array.isArray(value)) {
    return [...DEFAULT_OWNER_PANEL_ORDER];
  }

  const seen = new Set<OwnerPanelId>();
  const ordered: OwnerPanelId[] = [];

  for (const entry of value) {
    if (typeof entry !== 'string' || !allowed.has(entry as OwnerPanelId)) {
      continue;
    }

    const panel = entry as OwnerPanelId;

    if (seen.has(panel)) {
      continue;
    }

    seen.add(panel);
    ordered.push(panel);
  }

  for (const panel of DEFAULT_OWNER_PANEL_ORDER) {
    if (!seen.has(panel)) {
      ordered.push(panel);
    }
  }

  return ordered;
}

function sanitizeCollapsedPanels(value: unknown): OwnerPanelId[] {
  const allowed = new Set<OwnerPanelId>(DEFAULT_OWNER_PANEL_ORDER);

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is OwnerPanelId => typeof entry === 'string' && allowed.has(entry as OwnerPanelId),
  );
}

function readAllLayouts(): Record<string, ChannelLayoutState> {
  if (cachedLayouts) {
    return cachedLayouts;
  }

  const layouts: Record<string, ChannelLayoutState> = {};

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (!key || !key.startsWith(LAYOUT_KEY_PREFIX)) {
        continue;
      }

      const channelId = key.slice(LAYOUT_KEY_PREFIX.length);
      const stored = window.localStorage.getItem(key);

      if (!stored) {
        continue;
      }

      const parsed = JSON.parse(stored) as Partial<ChannelLayoutState>;

      layouts[channelId] = {
        tabOrder: sanitizeTabOrder(parsed.tabOrder),
        ownerPanelOrder: sanitizeOwnerPanelOrder(parsed.ownerPanelOrder),
        collapsedOwnerPanels: sanitizeCollapsedPanels(parsed.collapsedOwnerPanels),
      };
    }
  } catch {
    cachedLayouts = {};
    return cachedLayouts;
  }

  cachedLayouts = layouts;
  return layouts;
}

function readAllEditModes(): Record<string, boolean> {
  if (cachedEditModes) {
    return cachedEditModes;
  }

  const modes: Record<string, boolean> = {};

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (!key || !key.startsWith(EDIT_MODE_KEY_PREFIX)) {
        continue;
      }

      const channelId = key.slice(EDIT_MODE_KEY_PREFIX.length);
      modes[channelId] = window.localStorage.getItem(key) === '1';
    }
  } catch {
    cachedEditModes = {};
    return cachedEditModes;
  }

  cachedEditModes = modes;
  return modes;
}

function readLayout(channelId: string): ChannelLayoutState {
  return (
    readAllLayouts()[channelId] ?? {
      tabOrder: [...DEFAULT_PROFILE_TAB_ORDER],
      ownerPanelOrder: [...DEFAULT_OWNER_PANEL_ORDER],
      collapsedOwnerPanels: [],
    }
  );
}

function writeLayout(channelId: string, layout: ChannelLayoutState): void {
  window.localStorage.setItem(storageKey(channelId), JSON.stringify(layout));
  dispatchLayoutChange();
}

function subscribe(listener: () => void): () => void {
  function onChange(): void {
    listener();
  }

  window.addEventListener('nami-channel-owner-layout-changed', onChange);

  return () => {
    window.removeEventListener('nami-channel-owner-layout-changed', onChange);
  };
}

function readLayoutVersion(): number {
  return layoutVersion;
}

export function useChannelOwnerLayout(channelId: string): ChannelLayoutState {
  useSyncExternalStore(subscribe, readLayoutVersion, () => 0);
  return readLayout(channelId);
}

export function useChannelOwnerEditMode(channelId: string): boolean {
  useSyncExternalStore(subscribe, readLayoutVersion, () => 0);
  return readAllEditModes()[channelId] ?? false;
}

export function setChannelOwnerEditMode(channelId: string, enabled: boolean): void {
  if (enabled) {
    window.localStorage.setItem(editModeKey(channelId), '1');
  } else {
    window.localStorage.removeItem(editModeKey(channelId));
  }

  dispatchLayoutChange();
}

export function reorderProfileTabs(channelId: string, tabOrder: ChannelProfileSection[]): void {
  const layout = readLayout(channelId);

  writeLayout(channelId, {
    ...layout,
    tabOrder: sanitizeTabOrder(tabOrder),
  });
}

export function reorderOwnerPanels(channelId: string, ownerPanelOrder: OwnerPanelId[]): void {
  const layout = readLayout(channelId);

  writeLayout(channelId, {
    ...layout,
    ownerPanelOrder: sanitizeOwnerPanelOrder(ownerPanelOrder),
  });
}

export function toggleOwnerPanelCollapsed(channelId: string, panelId: OwnerPanelId): void {
  const layout = readLayout(channelId);
  const collapsed = new Set(layout.collapsedOwnerPanels);
  const isCollapsed = collapsed.has(panelId);

  if (isCollapsed) {
    collapsed.delete(panelId);
  } else {
    collapsed.add(panelId);
  }

  writeLayout(channelId, {
    ...layout,
    collapsedOwnerPanels: [...collapsed],
  });
}

export function isOwnerPanelCollapsed(channelId: string, panelId: OwnerPanelId): boolean {
  return readLayout(channelId).collapsedOwnerPanels.includes(panelId);
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);

  if (!moved) {
    return items;
  }

  next.splice(toIndex, 0, moved);
  return next;
}