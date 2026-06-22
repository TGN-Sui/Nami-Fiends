import { useSyncExternalStore } from 'react';

import { gameHubBrowserFilters } from './gamehub-preferences.js';
import { canEditProfileCosmetics } from './member-access.js';
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

function withoutCosmeticEdits(edits: SelfProfileEdits): SelfProfileEdits {
  return {
    ...edits,
    badgeDisplay: '',
    titleDisplay: '',
    frameDisplay: '',
    themeDisplay: '',
    ringDisplay: '',
  };
}

export function saveSelfProfileEdits(edits: SelfProfileEdits): void {
  const payload = canEditProfileCosmetics() ? edits : withoutCosmeticEdits(edits);

  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(payload));
  cachedProfileEdits = null;
  window.dispatchEvent(new CustomEvent('nami-self-profile-changed'));
}

export type MemberProfilePreferences = {
  preferredPlatforms: string[];
  preferredGenres: string[];
};

function hashMemberSeed(memberId: string): number {
  return memberId.split('').reduce((total, character) => total + character.charCodeAt(0), 0);
}

function seededMemberPreferences(memberId: string): MemberProfilePreferences {
  const seed = hashMemberSeed(memberId);
  const preferredPlatforms = profilePlatformOptions.filter(
    (_, index) => (seed >> index) % 2 === 0
  );
  const preferredGenres = profileGenreOptions.filter((_, index) => (seed >> (index + 2)) % 3 !== 0);

  return {
    preferredPlatforms:
      preferredPlatforms.length > 0
        ? [...preferredPlatforms]
        : [profilePlatformOptions[seed % profilePlatformOptions.length]!],
    preferredGenres:
      preferredGenres.length > 0
        ? [...preferredGenres]
        : [profileGenreOptions[seed % profileGenreOptions.length]!],
  };
}

export function readMemberProfilePreferences(memberId: string): MemberProfilePreferences {
  if (memberId === SELF_MEMBER_ID) {
    const edits = readSelfProfileEdits();

    return {
      preferredPlatforms: edits.preferredPlatforms,
      preferredGenres: edits.preferredGenres,
    };
  }

  return seededMemberPreferences(memberId);
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

  if (canEditProfileCosmetics(member) && edits.badgeDisplay.trim()) {
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

