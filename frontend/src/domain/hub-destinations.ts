import type { NamiPage } from './types.js';

export type HubDestinationPage = Extract<NamiPage, 'hub' | 'gamehub' | 'arcade'>;

export type HubDestinationItem = {
  page: HubDestinationPage;
  label: string;
  shortLabel: string;
  fallbackGlyph: string;
  assetSlotId: string;
};

export const hubDestinationItems: HubDestinationItem[] = [
  {
    page: 'hub',
    label: 'Nami Hub',
    shortLabel: 'Hub',
    fallbackGlyph: 'N',
    assetSlotId: 'hub-sidebar-logo',
  },
  {
    page: 'gamehub',
    label: 'Game Hub',
    shortLabel: 'Games',
    fallbackGlyph: 'G',
    assetSlotId: 'sidebar-nav-gamehub',
  },
  {
    page: 'arcade',
    label: 'Arcade',
    shortLabel: 'Arcade',
    fallbackGlyph: 'A',
    assetSlotId: 'sidebar-nav-arcade',
  },
];

export function isHubDestinationPage(page: NamiPage): page is HubDestinationPage {
  return page === 'hub' || page === 'gamehub' || page === 'arcade';
}

export type HubTriangleSlot = 'top-left' | 'top-right' | 'bottom';

const HUB_TRIANGLE_SLOT_ORDER: HubTriangleSlot[] = ['top-left', 'top-right', 'bottom'];

/** Default downward-pointing triangle: Games top-left, Hub top-right, Arcade bottom. */
export const HUB_TRIANGLE_DEFAULT_SLOT: Record<HubDestinationPage, HubTriangleSlot> = {
  gamehub: 'top-left',
  hub: 'top-right',
  arcade: 'bottom',
};

export function resolveHubTriangleAnchor(activePage: NamiPage): HubDestinationPage {
  return isHubDestinationPage(activePage) ? activePage : 'arcade';
}

export function hubTriangleRotationOffset(anchorPage: HubDestinationPage): number {
  const activeIndex = HUB_TRIANGLE_SLOT_ORDER.indexOf(HUB_TRIANGLE_DEFAULT_SLOT[anchorPage]);
  const bottomIndex = HUB_TRIANGLE_SLOT_ORDER.indexOf('bottom');

  return (bottomIndex - activeIndex + HUB_TRIANGLE_SLOT_ORDER.length) % HUB_TRIANGLE_SLOT_ORDER.length;
}

export function hubTriangleSlotForPage(
  page: HubDestinationPage,
  anchorPage: HubDestinationPage,
): HubTriangleSlot {
  const offset = hubTriangleRotationOffset(anchorPage);
  const pageIndex = HUB_TRIANGLE_SLOT_ORDER.indexOf(HUB_TRIANGLE_DEFAULT_SLOT[page]);

  return HUB_TRIANGLE_SLOT_ORDER[(pageIndex + offset) % HUB_TRIANGLE_SLOT_ORDER.length]!;
}

export function hubTriangleSlotClassName(slot: HubTriangleSlot): string {
  return 'is-hub-slot-' + slot;
}