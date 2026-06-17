import { readIndexerUrl } from './protocol-env.js';
import { createWalletAuthPayload } from './wallet-auth.js';

export type StudioPreferences = {
  studioId: string;
  owner: string;
  logoUrl: string | null;
  updatedAtMs: number;
};

function apiBaseUrl(): string | null {
  return readIndexerUrl();
}

async function studioPreferencesFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const base = apiBaseUrl();

  if (!base) {
    return null;
  }

  const response = await fetch(base + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 404) {
    return null;
  }

  const payload = (await response.json()) as T & { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? 'Studio preferences request failed.');
  }

  return payload;
}

export function isStudioPreferencesApiAvailable(): boolean {
  return apiBaseUrl() !== null;
}

export async function fetchStudioPreferences(studioId: string): Promise<StudioPreferences | null> {
  const payload = await studioPreferencesFetch<{ preferences: StudioPreferences }>(
    '/api/studio-preferences/' + encodeURIComponent(studioId)
  );

  return payload?.preferences ?? null;
}

export async function syncStudioPreferencesToBackend(input: {
  owner: string;
  studioId: string;
  logoUrl?: string | null;
}): Promise<StudioPreferences | null> {
  const auth = await createWalletAuthPayload(input.owner);

  const payload = await studioPreferencesFetch<{ preferences: StudioPreferences }>(
    '/api/studio-preferences/sync',
    {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        auth,
      }),
    }
  );

  return payload?.preferences ?? null;
}

export async function uploadStudioLogoToBackend(input: {
  owner: string;
  studioId: string;
  contentType: string;
  dataBase64: string;
}): Promise<{ url: string; filename: string } | null> {
  const base = apiBaseUrl();

  if (!base) {
    return null;
  }

  const auth = await createWalletAuthPayload(input.owner);

  const response = await fetch(base + '/api/media/studio-logo', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...input,
      auth,
    }),
  });

  const payload = (await response.json()) as {
    url?: string;
    filename?: string;
    message?: string;
    error?: string;
  };

  if (!response.ok || !payload.url) {
    throw new Error(payload.message ?? payload.error ?? 'Studio logo upload failed.');
  }

  return { url: payload.url, filename: payload.filename ?? '' };
}