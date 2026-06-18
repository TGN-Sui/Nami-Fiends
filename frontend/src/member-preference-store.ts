export type MemberPreferenceState = {
  muted: boolean;
  blocked: boolean;
};

const DEFAULT_PREFERENCE: MemberPreferenceState = {
  muted: false,
  blocked: false,
};

function preferenceStorageKey(memberId: string): string {
  return 'nami-member-preferences-' + memberId;
}

export function readMemberPreference(memberId: string): MemberPreferenceState {
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

export function saveMemberPreference(memberId: string, preference: MemberPreferenceState): void {
  window.localStorage.setItem(preferenceStorageKey(memberId), JSON.stringify(preference));
}

export function countMutedMembers(memberIds: string[]): number {
  return memberIds.filter((memberId) => readMemberPreference(memberId).muted).length;
}

export function countBlockedMembers(memberIds: string[]): number {
  return memberIds.filter((memberId) => readMemberPreference(memberId).blocked).length;
}