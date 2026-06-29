import { useSyncExternalStore } from 'react';

import { ARCADE_BRICKED_UP_SPRITE_SLOTS } from './arcade-bricked-up-sprites.js';
import {
  OFFICIAL_ARCADE_CABINETS,
  readArcadeCabinetOwnerAssetSlots,
} from './arcade-cabinets.js';

import { isOfficialOwner } from './nami-capabilities.js';
import { isPlatformOwnerAssetsApiAvailable } from './platform-owner-assets-api.js';
import {
  hydratePlatformOwnerAssetsFromServer,
  platformOwnerAssetsSyncErrorMessage,
  readLastPlatformOwnerAssetsSyncError,
  syncPlatformOwnerAssetsToServer,
} from './platform-owner-assets-sync.js';
import {
  ensureOwnerAssetsHydrated as hydrateOwnerAssetsPersistence,
  persistOwnerAssets,
  readPersistedOwnerAssets,
  resetOwnerAssetsPersistenceForTests,
} from './owner-assets-persistence.js';
import {
  validateOwnerAssetFile,
  type OwnerAssetCategory,
} from './owner-asset-validation.js';

export { prepareOwnerAssetImage, readImageFileAsDataUrl } from './owner-asset-image.js';
export type { OwnerAssetCategory } from './owner-asset-validation.js';
export { validateOwnerAssetFile } from './owner-asset-validation.js';

export async function ensureOwnerAssetsHydrated(): Promise<void> {
  await hydrateOwnerAssetsPersistence();

  const hydratedFromServer = await hydratePlatformOwnerAssetsFromServer();

  if (hydratedFromServer) {
    emit();
  }
}

export type OwnerAssetSlot = {
  id: string;
  label: string;
  category: OwnerAssetCategory;
  hint: string;
};

export type OwnerAssetSlotSection = {
  id: string;
  label: string;
  hint: string;
  slots: OwnerAssetSlot[];
};

const ARCADE_SHELL_OWNER_ASSET_SLOTS: OwnerAssetSlot[] = [
  {
    id: 'arcade-background',
    label: 'Arcade CRT background',
    category: 'scene',
    hint:
      'Full background inside the Nami Arcade cabinet viewport. Recommended 1920 × 1080 (16:9) image or looping MP4/WebM video.',
  },
  {
    id: 'arcade-stage-background',
    label: 'Arcade title stage',
    category: 'scene',
    hint:
      'Full-page backdrop on attract and cabinet select. Per-cabinet stage loops replace this only while a machine is active.',
  },
];

function readArcadeMusicOwnerAssetSlots(): OwnerAssetSlot[] {
  return [
    {
      id: 'arcade-lobby-music',
      label: 'Arcade lobby music',
      category: 'scene',
      hint:
        'MP3 loop for the title screen and cabinet picker. Ducks during walk-up intros and pauses when a run starts.',
    },
    ...OFFICIAL_ARCADE_CABINETS.filter((cabinet) => cabinet.gameId).map((cabinet) => ({
      id: 'arcade-game-music-' + cabinet.gameId,
      label: cabinet.title + ' game music',
      category: 'scene' as const,
      hint:
        'MP3 loop for ' + cabinet.title + ' gameplay. Replaces lobby music during an active run.',
    })),
  ];
}

const CORE_PLATFORM_OWNER_ASSET_SLOTS: OwnerAssetSlot[] = [
  {
    id: 'sidebar-official-logo',
    label: 'Official Nami logo',
    category: 'brand',
    hint: 'Official mark on the landing page (top center) and sidebar rail (top left).',
  },
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
    id: 'sidebar-nav-gamehub',
    label: 'Game hub sidebar icon',
    category: 'button',
    hint: 'Icon for the game hub in the sidebar rail.',
  },
  {
    id: 'sidebar-nav-arcade',
    label: 'Arcade nav icon',
    category: 'button',
    hint: 'Sidebar icon for the Nami Arcade destination.',
  },
  {
    id: 'sidebar-nav-userProfile',
    label: 'Profile nav icon',
    category: 'button',
    hint: 'Sidebar icon for My Profile.',
  },
  {
    id: 'sidebar-nav-guilds',
    label: 'Guild nav icon',
    category: 'button',
    hint: 'Sidebar icon for My Guild.',
  },
  {
    id: 'sidebar-nav-messages',
    label: 'Messages nav icon',
    category: 'button',
    hint: 'Sidebar icon for Messages.',
  },
  {
    id: 'sidebar-nav-events',
    label: 'Events nav icon',
    category: 'button',
    hint: 'Sidebar icon for My Events.',
  },
  {
    id: 'sidebar-nav-settings',
    label: 'Settings nav icon',
    category: 'button',
    hint: 'Sidebar icon for Settings.',
  },
  {
    id: 'sidebar-nav-radio',
    label: 'Ignite Radio nav icon',
    category: 'button',
    hint: 'Sidebar icon for Ignite Radio.',
  },
  {
    id: 'badge-book-cover-sphere',
    label: 'Badge book cover emblem',
    category: 'brand',
    hint: 'Circular logo on the badge book front cover.',
  },
  {
    id: 'badge-book-cover-title',
    label: 'Badge book title logo',
    category: 'brand',
    hint: 'Branded title image replacing the Nami Badges heading.',
  },
  {
    id: 'passport-header-mark',
    label: 'Passport header mark',
    category: 'brand',
    hint: 'Logo or wordmark in the passport card header.',
  },
  {
    id: 'passport-tier-chip',
    label: 'Passport tier chip',
    category: 'button',
    hint: 'Tier label icon in the passport card header.',
  },
  {
    id: 'passport-tier-badge',
    label: 'Passport tier badge',
    category: 'button',
    hint: 'Circular tier badge beside the conduct signal on passports.',
  },
  {
    id: 'passport-official-team-mark',
    label: 'Official team passport mark',
    category: 'brand',
    hint: 'Header mark shown on Official Nami Team passports.',
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
    hint: 'Fallback portrait when a member has no upload. Replaces the built-in silhouette placeholder.',
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

let cachedArcadeOwnerAssetSlots: OwnerAssetSlot[] | null = null;

export function readPlatformOwnerAssetSlots(): OwnerAssetSlot[] {
  return CORE_PLATFORM_OWNER_ASSET_SLOTS;
}

export function readArcadeOwnerAssetSlots(): OwnerAssetSlot[] {
  if (cachedArcadeOwnerAssetSlots) {
    return cachedArcadeOwnerAssetSlots;
  }

  cachedArcadeOwnerAssetSlots = [
    ...ARCADE_SHELL_OWNER_ASSET_SLOTS,
    ...readArcadeMusicOwnerAssetSlots(),
    ...readArcadeCabinetOwnerAssetSlots(),
    ...ARCADE_BRICKED_UP_SPRITE_SLOTS,
  ];
  return cachedArcadeOwnerAssetSlots;
}

export function readArcadeOwnerAssetSlotSections(): OwnerAssetSlotSection[] {
  return [
    {
      id: 'shell',
      label: 'Arcade shell',
      hint: 'CRT interior and the global title-screen stage backdrop.',
      slots: ARCADE_SHELL_OWNER_ASSET_SLOTS,
    },
    {
      id: 'music',
      label: 'Music loops',
      hint: 'Lobby MP3 plus one gameplay loop per live cabinet game id.',
      slots: readArcadeMusicOwnerAssetSlots(),
    },
    {
      id: 'cabinets',
      label: 'Cabinet media',
      hint: 'Per-machine walk-up intro, active stage loop, and CRT viewport overrides.',
      slots: readArcadeCabinetOwnerAssetSlots(),
    },
    {
      id: 'bricked-up-sprites',
      label: 'Bricked Up sprites',
      hint:
        'Per-object gameplay sprites for bricks, paddle, ball, hazards, mystery drops, shots, and blasts. Upload in Owner edit mode or from Settings → Arcade artwork.',
      slots: ARCADE_BRICKED_UP_SPRITE_SLOTS,
    },
  ];
}

/** Platform badges, logos, portraits, and nav icons — excludes arcade media. */
export function readOwnerAssetSlots(): OwnerAssetSlot[] {
  return readPlatformOwnerAssetSlots();
}

/** @deprecated Use readPlatformOwnerAssetSlots(). */
export const OWNER_ASSET_SLOTS = CORE_PLATFORM_OWNER_ASSET_SLOTS;

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
  return readPersistedOwnerAssets();
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

export function ownerAssetNavSlotId(page: string): string {
  return 'sidebar-nav-' + page;
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
  return (
    readPlatformOwnerAssetSlots().find((slot) => slot.id === slotId) ??
    readArcadeOwnerAssetSlots().find((slot) => slot.id === slotId)
  );
}

export type OwnerAssetSaveError = 'unauthorized' | 'quota' | 'storage' | 'sync';

function classifyPersistenceError(error: unknown): OwnerAssetSaveError {
  if (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.code === 22)
  ) {
    return 'quota';
  }

  return 'storage';
}

export function ownerAssetSaveErrorMessage(error: OwnerAssetSaveError): string {
  if (error === 'unauthorized') {
    return 'Only the Nami Official owner can save platform artwork.';
  }

  if (error === 'quota') {
    return 'Artwork storage is full. Remove unused slots in Visual Assets, or upload a smaller image.';
  }

  if (error === 'sync') {
    return platformOwnerAssetsSyncErrorMessage(
      readLastPlatformOwnerAssetsSyncError() ?? 'request_failed'
    );
  }

  return 'Could not save artwork. Try again in a moment.';
}

export async function saveOwnerAssets(
  assets: OwnerAssetMap,
  actorOwner: string | null
): Promise<OwnerAssetSaveError | null> {
  if (!isOfficialOwner(actorOwner)) {
    return 'unauthorized';
  }

  try {
    await persistOwnerAssets(assets);
    emit();

    const syncResult = await syncPlatformOwnerAssetsToServer(assets, actorOwner);

    if (!syncResult.ok && isPlatformOwnerAssetsApiAvailable()) {
      return 'sync';
    }

    if (syncResult.ok) {
      emit();
    }

    return null;
  } catch (error) {
    return classifyPersistenceError(error);
  }
}

export async function clearOwnerAsset(
  slotId: string,
  actorOwner: string | null
): Promise<OwnerAssetSaveError | null> {
  if (!isOfficialOwner(actorOwner)) {
    return 'unauthorized';
  }

  const next = { ...readAssets() };
  delete next[slotId];
  return saveOwnerAssets(next, actorOwner);
}

export const OWNER_ASSET_ACCEPTED_FORMATS = 'PNG, JPG, WebP, GIF';

export function resetOwnerAssetsForTests(): void {
  resetOwnerAssetsPersistenceForTests();
  cachedSnapshot = null;
}