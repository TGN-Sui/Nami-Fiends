import { useSyncExternalStore } from 'react';

import { canToggleStreamingStatus, getSelfMember } from './member-access.js';
import {
  isMemberPreferencesApiAvailable,
  syncMemberPreferencesToBackend,
} from './member-preferences-api.js';

const ONLINE_STATUS_KEY = 'nami.member.streaming-online';
const SELF_MEMBER_ID = 'm1';

type MemberOnlineStatusMap = Record<string, boolean>;

const listeners = new Set<() => void>();
let cachedSnapshot: MemberOnlineStatusMap | null = null;
let preferencesSyncOwner: string | null = null;

export function setMemberOnlinePreferencesSyncOwner(owner: string | null): void {
  preferencesSyncOwner = owner?.startsWith('0x') ? owner : null;
}

function pushStreamingPreferenceToBackend(enabled: boolean): void {
  if (!preferencesSyncOwner || !isMemberPreferencesApiAvailable()) {
    return;
  }

  void syncMemberPreferencesToBackend({
    owner: preferencesSyncOwner,
    streamingOnline: enabled,
  }).catch(() => {
    // Preference sync is best-effort during demo wiring.
  });
}

function emit(): void {
  cachedSnapshot = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStatusMap(): MemberOnlineStatusMap {
  try {
    const stored = window.localStorage.getItem(ONLINE_STATUS_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);

    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }

    const next: MemberOnlineStatusMap = {};

    for (const [memberId, value] of Object.entries(parsed)) {
      if (typeof value === 'boolean') {
        next[memberId] = value;
      }
    }

    return next;
  } catch {
    return {};
  }
}

function writeStatusMap(map: MemberOnlineStatusMap): void {
  window.localStorage.setItem(ONLINE_STATUS_KEY, JSON.stringify(map));
  emit();
}

function getSnapshot(): MemberOnlineStatusMap {
  if (!cachedSnapshot) {
    cachedSnapshot = readStatusMap();
  }

  return cachedSnapshot;
}

export function isMemberStreamingOnline(memberId: string): boolean {
  return readStatusMap()[memberId] === true;
}

export function readSelfStreamingOnline(): boolean {
  return isMemberStreamingOnline(SELF_MEMBER_ID);
}

export function setSelfStreamingOnline(enabled: boolean): void {
  if (!canToggleStreamingStatus(getSelfMember())) {
    return;
  }

  const next = { ...readStatusMap(), [SELF_MEMBER_ID]: enabled };
  writeStatusMap(next);
  pushStreamingPreferenceToBackend(enabled);
}

export function useMemberStreamingOnline(memberId: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot()[memberId] === true,
    () => getSnapshot()[memberId] === true
  );
}

export function useSelfStreamingOnline(): {
  isStreamingOnline: boolean;
  setStreamingOnline: (enabled: boolean) => void;
} {
  const isStreamingOnline = useSyncExternalStore(
    subscribe,
    () => readSelfStreamingOnline(),
    () => readSelfStreamingOnline()
  );

  return {
    isStreamingOnline,
    setStreamingOnline: setSelfStreamingOnline,
  };
}