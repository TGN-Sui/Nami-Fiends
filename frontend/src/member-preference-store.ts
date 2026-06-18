import { useSyncExternalStore } from 'react';

export type MemberPreferenceState = {
  muted: boolean;
  blocked: boolean;
};

const DEFAULT_PREFERENCE: MemberPreferenceState = {
  muted: false,
  blocked: false,
};

const listeners = new Set<() => void>();
const preferenceCache = new Map<string, MemberPreferenceState>();
let storeVersion = 0;

function preferenceStorageKey(memberId: string): string {
  return 'nami-member-preferences-' + memberId;
}

function emit(): void {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readPreferenceFromStorage(memberId: string): MemberPreferenceState {
  try {
    const savedPreference = window.localStorage.getItem(preferenceStorageKey(memberId));

    if (!savedPreference) {
      return DEFAULT_PREFERENCE;
    }

    const parsedPreference = JSON.parse(savedPreference) as Partial<MemberPreferenceState>;

    return {
      muted: Boolean(parsedPreference.muted),
      blocked: Boolean(parsedPreference.blocked),
    };
  } catch {
    return DEFAULT_PREFERENCE;
  }
}

export function readMemberPreference(memberId: string): MemberPreferenceState {
  const cached = preferenceCache.get(memberId);

  if (cached) {
    return cached;
  }

  const preference = readPreferenceFromStorage(memberId);
  preferenceCache.set(memberId, preference);
  return preference;
}

export function saveMemberPreference(memberId: string, preference: MemberPreferenceState): void {
  preferenceCache.set(memberId, preference);
  window.localStorage.setItem(preferenceStorageKey(memberId), JSON.stringify(preference));
  emit();
}

export function useMemberPreferencesVersion(): number {
  return useSyncExternalStore(subscribe, () => storeVersion, () => storeVersion);
}

export function countMutedMembers(memberIds: string[]): number {
  return memberIds.filter((memberId) => readMemberPreference(memberId).muted).length;
}

export function countBlockedMembers(memberIds: string[]): number {
  return memberIds.filter((memberId) => readMemberPreference(memberId).blocked).length;
}