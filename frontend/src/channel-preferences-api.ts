import { readIndexerUrl } from './protocol-env.js';
import { createWalletAuthPayload } from './wallet-auth.js';

export type ChannelPreferences = {
  channelId: string;
  owner: string;
  coverUrl: string | null;
  updatedAtMs: number;
};

function apiBaseUrl(): string | null {
  return readIndexerUrl();
}

async function channelPreferencesFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
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
    throw new Error(payload.message ?? payload.error ?? 'Channel preferences request failed.');
  }

  return payload;
}

export function isChannelPreferencesApiAvailable(): boolean {
  return apiBaseUrl() !== null;
}

export async function fetchChannelPreferences(channelId: string): Promise<ChannelPreferences | null> {
  const payload = await channelPreferencesFetch<{ preferences: ChannelPreferences }>(
    '/api/channel-preferences/' + encodeURIComponent(channelId)
  );

  return payload?.preferences ?? null;
}

export async function syncChannelPreferencesToBackend(input: {
  owner: string;
  channelId: string;
  coverUrl?: string | null;
}): Promise<ChannelPreferences | null> {
  const auth = await createWalletAuthPayload(input.owner);

  const payload = await channelPreferencesFetch<{ preferences: ChannelPreferences }>(
    '/api/channel-preferences/sync',
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

export async function uploadChannelCoverToBackend(input: {
  owner: string;
  channelId: string;
  contentType: string;
  dataBase64: string;
}): Promise<{ url: string; filename: string } | null> {
  const base = apiBaseUrl();

  if (!base) {
    return null;
  }

  const auth = await createWalletAuthPayload(input.owner);

  const response = await fetch(base + '/api/media/channel-cover', {
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
    throw new Error(payload.message ?? payload.error ?? 'Channel cover upload failed.');
  }

  return { url: payload.url, filename: payload.filename ?? '' };
}