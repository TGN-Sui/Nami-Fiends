import { useSyncExternalStore } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';

const OWNER_ASSETS_KEY = 'nami.owner.platform-assets';
const MAX_LOGO_BYTES = 1024 * 1024;
const MAX_ICON_BYTES = 512 * 1024;

export type OwnerAssetCategory = 'brand' | 'profile' | 'badge' | 'button';

export type OwnerAssetSlot = {
  id: string;
  label: string;
  category: OwnerAssetCategory;
  hint: string;
};

export const OWNER_ASSET_SLOTS: OwnerAssetSlot[] = [
  {
    id: 'hub-sidebar-logo',
    label: 'Hub sidebar logo',
    category: 'brand',
    hint: 'Square mark shown in the sidebar.',
  },
  {
    id: 'hub-sidebar-wordmark',
    label: 'Hub wordmark',
    category: 'brand',
    hint: 'Wide logo beside the hub label.',
  },
  {
    id: 'platform-footer-mark',
    label: 'Platform footer mark',
    category: 'brand',
    hint: 'Small brand icon for footer areas.',
  },
  {
    id: 'default-member-avatar',
    label: 'Default member avatar',
    category: 'profile',
    hint: 'Fallback portrait when a member has no upload.',
  },
  {
    id: 'badge-default',
    label: 'Default badge icon',
    category: 'badge',
    hint: 'Fallback badge artwork for unmapped badges.',
  },
  {
    id: 'button-primary-icon',
    label: 'Primary button icon',
    category: 'button',
    hint: 'Optional accent icon for primary actions.',
  },
  {
    id: 'button-secondary-icon',
    label: 'Secondary button icon',
    category: 'button',
    hint: 'Optional accent icon for secondary actions.',
  },
  {
    id: 'badge-first-quest',
    label: 'First Quest badge',
    category: 'badge',
    hint: 'Collector book badge artwork.',
  },
  {
    id: 'badge-community-event',
    label: 'Community Event badge',
    category: 'badge',
    hint: 'Collector book badge artwork.',
  },
  {
    id: 'badge-verified-completion',
    label: 'Verified Completion badge',
    category: 'badge',
    hint: 'Collector book badge artwork.',
  },
  {
    id: 'badge-raid-captain',
    label: 'Raid Captain badge',
    category: 'badge',
    hint: 'Collector book badge artwork.',
  },
];

export type OwnerAssetMap = Record<string, string>;

const listeners = new Set<() => void>();
let cachedSnapshot: OwnerAssetMap | null = null;

function emit(): void {
  cachedSnapshot = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readAssets(): OwnerAssetMap {
  try {
    const stored = window.localStorage.getItem(OWNER_ASSETS_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as unknown;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === 'string' &&
          typeof entry[1] === 'string' &&
          entry[1].startsWith('data:image/')
      )
    );
  } catch {
    return {};
  }
}

function writeAssets(assets: OwnerAssetMap): void {
  window.localStorage.setItem(OWNER_ASSETS_KEY, JSON.stringify(assets));
  emit();
}

function getSnapshot(): OwnerAssetMap {
  if (!cachedSnapshot) {
    cachedSnapshot = readAssets();
  }

  return cachedSnapshot;
}

export function useNamiOwnerAssets(): OwnerAssetMap {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function readAllOwnerAssets(): OwnerAssetMap {
  return { ...readAssets() };
}

export function readOwnerAsset(slotId: string): string | null {
  return readAssets()[slotId] ?? null;
}

export function ownerAssetBadgeSlotId(badgeName: string): string {
  const slug = badgeName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug ? 'badge-' + slug : 'badge-default';
}

export function readOwnerAssetSlot(slotId: string): OwnerAssetSlot | undefined {
  return OWNER_ASSET_SLOTS.find((slot) => slot.id === slotId);
}

export function validateOwnerAssetFile(
  file: File,
  category: OwnerAssetCategory = 'brand'
): string | null {
  const accepted = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

  if (!accepted.has(file.type)) {
    return 'Use a PNG, JPG, WebP, or GIF image.';
  }

  const maxBytes = category === 'brand' || category === 'profile' ? MAX_LOGO_BYTES : MAX_ICON_BYTES;

  if (file.size > maxBytes) {
    return category === 'brand' || category === 'profile'
      ? 'Image must be 1 MB or smaller.'
      : 'Image must be 512 KB or smaller.';
  }

  return null;
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Could not read that image.'));
    };

    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

export function saveOwnerAssets(
  assets: OwnerAssetMap,
  actorOwner: string | null
): boolean {
  if (!isOfficialOwner(actorOwner)) {
    return false;
  }

  writeAssets(assets);
  return true;
}

export function clearOwnerAsset(slotId: string, actorOwner: string | null): boolean {
  if (!isOfficialOwner(actorOwner)) {
    return false;
  }

  const next = { ...readAssets() };
  delete next[slotId];
  writeAssets(next);
  return true;
}

export const OWNER_ASSET_ACCEPTED_FORMATS = 'PNG, JPG, WebP, GIF';