import { config } from '../config.js';
import { readJsonFile, writeJsonFile } from '../storage.js';

export type TutorialStatus = 'pending' | 'completed' | 'skipped';

export type MemberPreferences = {
  owner: string;
  avatarUrl: string | null;
  streamingOnline: boolean;
  hubFirstVisitCompleted: boolean;
  superBannerSeenIds: string[];
  tutorialStatus: TutorialStatus;
  tutorialVersion: number;
  updatedAtMs: number;
};

type PreferencesStore = {
  preferences: MemberPreferences[];
};

const PREFERENCES_PATH = `${config.dataDir}/projections/member-preferences.json`;

function emptyStore(): PreferencesStore {
  return { preferences: [] };
}

async function readStore(): Promise<PreferencesStore> {
  return readJsonFile<PreferencesStore>(PREFERENCES_PATH, emptyStore());
}

async function writeStore(store: PreferencesStore): Promise<void> {
  await writeJsonFile(PREFERENCES_PATH, store);
}

function normalizeOwner(owner: string): string {
  return owner.trim().toLowerCase();
}

function defaultPreferences(owner: string): MemberPreferences {
  return {
    owner: normalizeOwner(owner),
    avatarUrl: null,
    streamingOnline: false,
    hubFirstVisitCompleted: false,
    superBannerSeenIds: [],
    tutorialStatus: 'pending',
    tutorialVersion: 0,
    updatedAtMs: Date.now(),
  };
}

export async function getMemberPreferences(owner: string): Promise<MemberPreferences | null> {
  const store = await readStore();
  const normalized = normalizeOwner(owner);

  return store.preferences.find((row) => row.owner === normalized) ?? null;
}

export type UpsertMemberPreferencesInput = {
  owner: string;
  avatarUrl?: string | null;
  streamingOnline?: boolean;
  hubFirstVisitCompleted?: boolean;
  superBannerSeenIds?: string[];
  appendSuperBannerSeenId?: string;
  tutorialStatus?: TutorialStatus;
  tutorialVersion?: number;
};

export async function upsertMemberPreferences(
  input: UpsertMemberPreferencesInput
): Promise<MemberPreferences> {
  if (!input.owner.startsWith('0x')) {
    throw new Error('invalid_owner');
  }

  const owner = normalizeOwner(input.owner);
  const store = await readStore();
  const index = store.preferences.findIndex((row) => row.owner === owner);
  const existing = index >= 0 ? store.preferences[index]! : defaultPreferences(input.owner);
  const now = Date.now();

  const seenIds = [...existing.superBannerSeenIds];

  if (input.superBannerSeenIds) {
    seenIds.splice(0, seenIds.length, ...input.superBannerSeenIds.filter((id) => id.trim()));
  }

  if (input.appendSuperBannerSeenId?.trim()) {
    const nextId = input.appendSuperBannerSeenId.trim();

    if (!seenIds.includes(nextId)) {
      seenIds.push(nextId);
    }
  }

  const next: MemberPreferences = {
    ...existing,
    owner,
    avatarUrl:
      input.avatarUrl === undefined
        ? existing.avatarUrl
        : input.avatarUrl && input.avatarUrl.trim()
          ? input.avatarUrl.trim()
          : null,
    streamingOnline:
      typeof input.streamingOnline === 'boolean' ? input.streamingOnline : existing.streamingOnline,
    hubFirstVisitCompleted:
      typeof input.hubFirstVisitCompleted === 'boolean'
        ? input.hubFirstVisitCompleted
        : existing.hubFirstVisitCompleted,
    superBannerSeenIds: seenIds.slice(-128),
    tutorialStatus: input.tutorialStatus ?? existing.tutorialStatus,
    tutorialVersion:
      typeof input.tutorialVersion === 'number' && input.tutorialVersion >= 0
        ? input.tutorialVersion
        : existing.tutorialVersion,
    updatedAtMs: now,
  };

  if (index >= 0) {
    store.preferences[index] = next;
  } else {
    store.preferences.unshift(next);
  }

  await writeStore(store);
  return next;
}