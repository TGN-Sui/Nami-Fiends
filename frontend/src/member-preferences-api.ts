import { readIndexerUrl } from './protocol-env.js';

export type MemberPreferences = {
  owner: string;
  avatarUrl: string | null;
  streamingOnline: boolean;
  updatedAtMs: number;
};

function apiBaseUrl(): string | null {
  return readIndexerUrl();
}

async function preferencesFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
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
    throw new Error(payload.message ?? payload.error ?? 'Preferences request failed.');
  }

  return payload;
}

export function isMemberPreferencesApiAvailable(): boolean {
  return apiBaseUrl() !== null;
}

export async function fetchMemberPreferences(owner: string): Promise<MemberPreferences | null> {
  const payload = await preferencesFetch<{ preferences: MemberPreferences }>(
    '/api/member-preferences/owner/' + encodeURIComponent(owner)
  );

  return payload?.preferences ?? null;
}

export async function syncMemberPreferencesToBackend(input: {
  owner: string;
  avatarUrl?: string | null;
  streamingOnline?: boolean;
}): Promise<MemberPreferences | null> {
  const payload = await preferencesFetch<{ preferences: MemberPreferences }>(
    '/api/member-preferences/sync',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );

  return payload?.preferences ?? null;
}

export async function uploadAvatarToBackend(input: {
  owner: string;
  contentType: string;
  dataBase64: string;
}): Promise<{ url: string; filename: string } | null> {
  const base = apiBaseUrl();

  if (!base) {
    return null;
  }

  const response = await fetch(base + '/api/media/avatar', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as {
    url?: string;
    filename?: string;
    message?: string;
    error?: string;
  };

  if (!response.ok || !payload.url) {
    throw new Error(payload.message ?? payload.error ?? 'Avatar upload failed.');
  }

  return { url: payload.url, filename: payload.filename ?? '' };
}