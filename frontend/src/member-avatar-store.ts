import { useSyncExternalStore } from 'react';

import { withMemberProfile } from './member-profile-store.js';
import { members, type NamiMember } from './uiMockData.js';

const AVATAR_STORAGE_KEY = 'nami.self.avatar';

const SELF_MEMBER_ID = 'm1';

let cachedSelfMember: NamiMember | null = null;

function invalidateSelfMemberCache(): void {
  cachedSelfMember = null;
}

export function readSelfAvatarOverride(): string | null {
  try {
    return window.localStorage.getItem(AVATAR_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveSelfAvatarOverride(dataUrl: string): void {
  window.localStorage.setItem(AVATAR_STORAGE_KEY, dataUrl);
  invalidateSelfMemberCache();
  window.dispatchEvent(new CustomEvent('nami-self-avatar-changed'));
}

export function clearSelfAvatarOverride(): void {
  window.localStorage.setItem(AVATAR_STORAGE_KEY, '');
  invalidateSelfMemberCache();
  window.dispatchEvent(new CustomEvent('nami-self-avatar-changed'));
}

export function withMemberAvatar(member: NamiMember): NamiMember {
  if (member.id !== SELF_MEMBER_ID) {
    return member;
  }

  const override = readSelfAvatarOverride();

  if (override === null) {
    return member;
  }

  if (!override) {
    const { avatarImageUrl: _removed, ...memberWithoutAvatar } = member;

    return memberWithoutAvatar;
  }

  return {
    ...member,
    avatarImageUrl: override,
  };
}

function getSelfMemberSnapshot(): NamiMember {
  if (cachedSelfMember) {
    return cachedSelfMember;
  }

  const baseMember = members.find((member) => member.id === SELF_MEMBER_ID) ?? members[0]!;
  cachedSelfMember = withMemberProfile(withMemberAvatar(baseMember));

  return cachedSelfMember;
}

function subscribeSelfMember(onStoreChange: () => void): () => void {
  function handleChange(): void {
    invalidateSelfMemberCache();
    onStoreChange();
  }

  window.addEventListener('nami-self-avatar-changed', handleChange);
  window.addEventListener('nami-self-profile-changed', handleChange);
  window.addEventListener('nami-member-session-changed', handleChange);

  return () => {
    window.removeEventListener('nami-self-avatar-changed', handleChange);
    window.removeEventListener('nami-self-profile-changed', handleChange);
    window.removeEventListener('nami-member-session-changed', handleChange);
  };
}

export function useSelfMember(): NamiMember {
  return useSyncExternalStore(subscribeSelfMember, getSelfMemberSnapshot, getSelfMemberSnapshot);
}

export const PROFILE_EDIT_PANEL_ID = 'profile-edit-panel';
export const PROFILE_EDIT_FOCUS_KEY = 'nami-focus-profile-edit';
export const AVATAR_UPLOAD_FOCUS_KEY = PROFILE_EDIT_FOCUS_KEY;

export function requestProfileEditFocus(): void {
  try {
    window.sessionStorage.setItem(PROFILE_EDIT_FOCUS_KEY, 'true');
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

export function requestAvatarUploadFocus(): void {
  requestProfileEditFocus();
}

export function consumeProfileEditFocus(): boolean {
  try {
    const shouldFocus = window.sessionStorage.getItem(PROFILE_EDIT_FOCUS_KEY) === 'true';

    if (shouldFocus) {
      window.sessionStorage.removeItem(PROFILE_EDIT_FOCUS_KEY);
    }

    return shouldFocus;
  } catch {
    return false;
  }
}

export function consumeAvatarUploadFocus(): boolean {
  return consumeProfileEditFocus();
}