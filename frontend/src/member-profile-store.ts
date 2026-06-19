import { useSyncExternalStore } from 'react';

import { gameHubBrowserFilters } from './gamehub-preferences.js';
import { readMemberSession } from './member-session-store.js';
import { type NamiMember } from './uiMockData.js';

const PROFILE_STORAGE_KEY = 'nami.self.profile';

const SELF_MEMBER_ID = 'm1';

export const profilePlatformOptions = ['PC', 'Console', 'Mobile'] as const;

const platformOptionSet = new Set<string>(profilePlatformOptions);

export const profileGenreOptions = gameHubBrowserFilters.filter(
  (filter) => filter !== 'All' && filter !== 'Verified' && !platformOptionSet.has(filter)
);

export type SelfProfileEdits = {
  displayName: string;
  dailyStatus: string;
  bio: string;
  badgeDisplay: string;
  titleDisplay: string;
  frameDisplay: string;
  themeDisplay: string;
  ringDisplay: string;
  preferredPlatforms: string[];
  preferredGenres: string[];
};

const defaultProfileEdits = (): SelfProfileEdits => ({
  displayName: '',
  dailyStatus: '',
  bio: '',
  badgeDisplay: '',
  titleDisplay: '',
  frameDisplay: '',
  themeDisplay: '',
  ringDisplay: '',
  preferredPlatforms: [],
  preferredGenres: [],
});

export function readSelfProfileEdits(): SelfProfileEdits {
  try {
    const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);

    if (!stored) {
      return defaultProfileEdits();
    }

    const parsed = JSON.parse(stored) as Partial<SelfProfileEdits>;

    return {
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : '',
      dailyStatus: typeof parsed.dailyStatus === 'string' ? parsed.dailyStatus : '',
      bio: typeof parsed.bio === 'string' ? parsed.bio : '',
      badgeDisplay: typeof parsed.badgeDisplay === 'string' ? parsed.badgeDisplay : '',
      titleDisplay: typeof parsed.titleDisplay === 'string' ? parsed.titleDisplay : '',
      frameDisplay: typeof parsed.frameDisplay === 'string' ? parsed.frameDisplay : '',
      themeDisplay: typeof parsed.themeDisplay === 'string' ? parsed.themeDisplay : '',
      ringDisplay: typeof parsed.ringDisplay === 'string' ? parsed.ringDisplay : '',
      preferredPlatforms: Array.isArray(parsed.preferredPlatforms)
        ? parsed.preferredPlatforms.filter((entry): entry is string => typeof entry === 'string')
        : [],
      preferredGenres: Array.isArray(parsed.preferredGenres)
        ? parsed.preferredGenres.filter((entry): entry is string => typeof entry === 'string')
        : [],
    };
  } catch {
    return defaultProfileEdits();
  }
}

export function saveSelfProfileEdits(edits: SelfProfileEdits): void {
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(edits));
  cachedProfileEdits = null;
  window.dispatchEvent(new CustomEvent('nami-self-profile-changed'));
}

export function withMemberProfile(member: NamiMember): NamiMember {
  if (member.id !== SELF_MEMBER_ID) {
    return member;
  }

  const edits = readSelfProfileEdits();
  const session = readMemberSession();
  let nextMember = member;

  const displayName = edits.displayName.trim() || session?.displayName.trim() || '';

  if (displayName) {
    nextMember = { ...nextMember, name: displayName };
  }

  if (edits.badgeDisplay.trim()) {
    nextMember = { ...nextMember, badge: edits.badgeDisplay.trim() };
  }

  return nextMember;
}

let cachedProfileEdits: SelfProfileEdits | null = null;

function getProfileEditsSnapshot(): SelfProfileEdits {
  if (!cachedProfileEdits) {
    cachedProfileEdits = readSelfProfileEdits();
  }

  return cachedProfileEdits;
}

function subscribeProfileEdits(onStoreChange: () => void): () => void {
  function handleChange(): void {
    cachedProfileEdits = null;
    onStoreChange();
  }

  window.addEventListener('nami-self-profile-changed', handleChange);

  return () => {
    window.removeEventListener('nami-self-profile-changed', handleChange);
  };
}

export function useSelfProfileEdits(): SelfProfileEdits {
  return useSyncExternalStore(subscribeProfileEdits, getProfileEditsSnapshot, getProfileEditsSnapshot);
}

