import { readJsonFile, writeJsonFile } from '../storage.js';

export type StudioPreferences = {
  studioId: string;
  owner: string;
  logoUrl: string | null;
  updatedAtMs: number;
};

type StudioPreferencesStore = {
  studios: StudioPreferences[];
};

const STUDIO_PREFERENCES_PATH = 'data/projections/studio-preferences.json';

function emptyStore(): StudioPreferencesStore {
  return { studios: [] };
}

async function readStore(): Promise<StudioPreferencesStore> {
  return readJsonFile<StudioPreferencesStore>(STUDIO_PREFERENCES_PATH, emptyStore());
}

async function writeStore(store: StudioPreferencesStore): Promise<void> {
  await writeJsonFile(STUDIO_PREFERENCES_PATH, store);
}

function normalizeOwner(owner: string): string {
  return owner.trim().toLowerCase();
}

export async function getStudioPreferences(studioId: string): Promise<StudioPreferences | null> {
  const store = await readStore();

  return store.studios.find((row) => row.studioId === studioId) ?? null;
}

export type UpsertStudioPreferencesInput = {
  studioId: string;
  owner: string;
  logoUrl?: string | null;
};

export async function assertStudioOwnerWallet(studioId: string, owner: string): Promise<void> {
  const existing = await getStudioPreferences(studioId);

  if (existing && normalizeOwner(existing.owner) !== normalizeOwner(owner)) {
    throw new Error('not_studio_owner');
  }
}

export async function upsertStudioPreferences(
  input: UpsertStudioPreferencesInput
): Promise<StudioPreferences> {
  if (!input.owner.startsWith('0x') || !input.studioId.trim()) {
    throw new Error('invalid_payload');
  }

  await assertStudioOwnerWallet(input.studioId, input.owner);

  const owner = normalizeOwner(input.owner);
  const store = await readStore();
  const index = store.studios.findIndex((row) => row.studioId === input.studioId);
  const existing =
    index >= 0
      ? store.studios[index]!
      : {
          studioId: input.studioId,
          owner,
          logoUrl: null,
          updatedAtMs: Date.now(),
        };

  const next: StudioPreferences = {
    ...existing,
    owner,
    logoUrl:
      input.logoUrl === undefined
        ? existing.logoUrl
        : input.logoUrl && input.logoUrl.trim()
          ? input.logoUrl.trim()
          : null,
    updatedAtMs: Date.now(),
  };

  if (index >= 0) {
    store.studios[index] = next;
  } else {
    store.studios.unshift(next);
  }

  await writeStore(store);
  return next;
}