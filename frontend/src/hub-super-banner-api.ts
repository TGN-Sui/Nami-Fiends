import { readIndexerUrl } from './protocol-env.js';
import { createWalletAuthPayload } from './wallet-auth.js';

export type HubSuperBannerCampaign = {
  id: string;
  channelId: string;
  coverUrl: string;
  headline: string;
  body: string;
  sentAtMs: number;
  expiresAtMs: number;
};

function apiBaseUrl(): string | null {
  return readIndexerUrl();
}

export function isHubSuperBannerApiAvailable(): boolean {
  return apiBaseUrl() !== null;
}

export async function fetchActiveHubSuperBanners(): Promise<HubSuperBannerCampaign[]> {
  const base = apiBaseUrl();

  if (!base) {
    return [];
  }

  const response = await fetch(base + '/api/hub/super-banners/active');

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { campaigns?: HubSuperBannerCampaign[] };
  return Array.isArray(payload.campaigns) ? payload.campaigns : [];
}

export async function activateHubSuperBannerOnBackend(input: {
  owner: string;
  channelId: string;
}): Promise<{ status: string; expiresAtMs: number } | null> {
  const base = apiBaseUrl();

  if (!base) {
    return null;
  }

  const auth = await createWalletAuthPayload(input.owner);

  const response = await fetch(base + '/api/hub/super-banners/activate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...input,
      auth,
    }),
  });

  const payload = (await response.json()) as {
    entitlement?: { status: string; expiresAtMs: number };
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? payload.message ?? 'Super Banner activation failed.');
  }

  return payload.entitlement ?? null;
}

export async function publishHubSuperBannerToBackend(input: {
  owner: string;
  channelId: string;
  coverUrl: string;
  headline: string;
  body: string;
}): Promise<HubSuperBannerCampaign | null> {
  const base = apiBaseUrl();

  if (!base) {
    return null;
  }

  const auth = await createWalletAuthPayload(input.owner);

  const response = await fetch(base + '/api/hub/super-banners/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...input,
      auth,
    }),
  });

  const payload = (await response.json()) as {
    campaign?: HubSuperBannerCampaign;
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? payload.message ?? 'Super Banner publish failed.');
  }

  return payload.campaign ?? null;
}