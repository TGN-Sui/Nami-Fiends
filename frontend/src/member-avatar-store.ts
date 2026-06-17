import { useSyncExternalStore } from 'react';

import {
  isMemberPreferencesApiAvailable,
  syncMemberPreferencesToBackend,
} from './member-preferences-api.js';
import { applyMembershipTierToMember } from './membership-plans-store.js';
import { withMemberProfile } from './member-profile-store.js';
import { members, type NamiMember } from './uiMockData.js';

const AVATAR_STORAGE_KEY = 'nami.self.avatar';

const SELF_MEMBER_ID = 'm1';

let cachedSelfMember: NamiMember | null = null;
let preferencesSyncOwner: string | null = null;

function invalidateSelfMemberCache(): void {
  cachedSelfMember = null;
}

export function setMemberPreferencesSyncOwner(owner: string | null): void {
  preferencesSyncOwner = owner?.startsWith('0x') ? owner : null;
}

function pushAvatarPreferenceToBackend(avatarUrl: string | null): void {
  if (!preferencesSyncOwner || !isMemberPreferencesApiAvailable()) {
    return;
  }

  void syncMemberPreferencesToBackend({
    owner: preferencesSyncOwner,
    avatarUrl,
  }).catch(() => {
    // Preference sync is best-effort during demo wiring.
  });
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
  pushAvatarPreferenceToBackend(dataUrl);
}

export function clearSelfAvatarOverride(): void {
  window.localStorage.removeItem(AVATAR_STORAGE_KEY);
  invalidateSelfMemberCache();
  window.dispatchEvent(new CustomEvent('nami-self-avatar-changed'));
  pushAvatarPreferenceToBackend(null);
}

export function resolveMemberAvatarImageUrl(member: NamiMember): string | null {
  if (member.id === SELF_MEMBER_ID) {
    const override = readSelfAvatarOverride();

    if (override?.trim()) {
      return override.trim();
    }
  }

  const avatarImageUrl = member.avatarImageUrl?.trim();

  return avatarImageUrl ? avatarImageUrl : null;
}

export function resolveSelfAvatarImageUrl(): string | null {
  return resolveMemberAvatarImageUrl(getSelfMemberSnapshot());
}

export function withMemberAvatar(member: NamiMember): NamiMember {
  if (member.id !== SELF_MEMBER_ID) {
    return member;
  }

  const avatarImageUrl = resolveMemberAvatarImageUrl(member);

  if (!avatarImageUrl) {
    return member;
  }

  return {
    ...member,
    avatarImageUrl,
  };
}

function getSelfMemberSnapshot(): NamiMember {
  if (cachedSelfMember) {
    return cachedSelfMember;
  }

  const baseMember = members.find((member) => member.id === SELF_MEMBER_ID) ?? members[0]!;
  cachedSelfMember = applyMembershipTierToMember(withMemberProfile(withMemberAvatar(baseMember)));

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

export function useSelfAvatarImageUrl(): string | null {
  const member = useSelfMember();

  return resolveMemberAvatarImageUrl(member);
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