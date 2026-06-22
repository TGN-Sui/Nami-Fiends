import { LANDING_GENRE_LOUNGES } from './landing-content.js';
import { MOBILE_GAMING_GENRE } from './platform-genre-options.js';

export const GAME_ONBOARDING_GENRES = [...LANDING_GENRE_LOUNGES, MOBILE_GAMING_GENRE] as const;

export type GameStoreLinkKey =
  | 'steamStoreUrl'
  | 'epicStoreUrl'
  | 'xboxStoreUrl'
  | 'playstationStoreUrl'
  | 'otherStoreUrl';

export const GAME_STORE_LINK_FIELDS: Array<{ key: GameStoreLinkKey; label: string }> = [
  { key: 'steamStoreUrl', label: 'Steam store' },
  { key: 'epicStoreUrl', label: 'Epic Games store' },
  { key: 'xboxStoreUrl', label: 'Xbox store' },
  { key: 'playstationStoreUrl', label: 'PlayStation store' },
  { key: 'otherStoreUrl', label: 'Other store' },
];

export type GameStoreUrls = Record<GameStoreLinkKey, string>;

export function createEmptyGameStoreUrls(): GameStoreUrls {
  return {
    steamStoreUrl: '',
    epicStoreUrl: '',
    xboxStoreUrl: '',
    playstationStoreUrl: '',
    otherStoreUrl: '',
  };
}

export function formatGameGenresForDisplay(genres: string[]): string {
  const trimmed = genres.map((genre) => genre.trim()).filter((genre) => genre.length > 0);

  if (trimmed.length === 0) {
    return '';
  }

  return trimmed.join(' / ');
}

export function primaryGameGenre(genres: string[]): string {
  const trimmed = genres.map((genre) => genre.trim()).filter((genre) => genre.length > 0);

  return trimmed[0] ?? 'Indie';
}