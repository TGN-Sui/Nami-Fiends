import { LANDING_GENRE_LOUNGES } from './landing-content.js';

export const SUPPORTED_PLATFORMS = ['PC', 'Console', 'Mobile'] as const;

export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

export const MOBILE_GAMING_GENRE = 'Mobile Gaming';

export const MEMBER_CONTENT_GENRES = [
  'Games',
  'IRL',
  'Music & DJs',
  'Creative',
  'Esports',
  MOBILE_GAMING_GENRE,
] as const;

export type MemberContentGenre = (typeof MEMBER_CONTENT_GENRES)[number];

/** Top Genre Lounge bubble genres by active-member rank (first 20 of 23 IGDB lounges). */
export const PROFILE_GENRE_LOUNGE_COUNT = 20;

export const PROFILE_GENRE_LOUNGE_OPTIONS = LANDING_GENRE_LOUNGES.slice(
  0,
  PROFILE_GENRE_LOUNGE_COUNT
) as readonly (typeof LANDING_GENRE_LOUNGES)[number][];

export function normalizeSupportedPlatforms(platforms: string[] | undefined | null): SupportedPlatform[] {
  const normalized = new Set<SupportedPlatform>();

  for (const platform of platforms ?? []) {
    const value = platform.trim().toLowerCase();

    if (value === 'pc') {
      normalized.add('PC');
    } else if (value === 'console') {
      normalized.add('Console');
    } else if (value === 'mobile') {
      normalized.add('Mobile');
    }
  }

  return SUPPORTED_PLATFORMS.filter((platform) => normalized.has(platform));
}

export function formatSupportedPlatforms(platforms: string[] | undefined | null): string {
  const normalized = normalizeSupportedPlatforms(platforms);

  return normalized.length > 0 ? normalized.join(' · ') : '';
}