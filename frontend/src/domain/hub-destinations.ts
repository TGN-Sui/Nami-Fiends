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