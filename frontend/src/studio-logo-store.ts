import { useSyncExternalStore } from 'react';

import {
  isStudioPreferencesApiAvailable,
  syncStudioPreferencesToBackend,
} from './studio-preferences-api.js';
import { type NamiDeveloperProfile } from './uiMockData.js';

const LOGO_STORAGE_PREFIX = 'nami.studio.logo.';

let logoVersion = 0;
let studioPreferencesSyncOwner: string | null = null;

function logoStorageKey(studioId: string): string {
  return LOGO_STORAGE_PREFIX + studioId;
}

function dispatchLogoChange(): void {
  logoVersion += 1;
  window.dispatchEvent(new CustomEvent('nami-studio-logo-changed'));
}

export function setStudioPreferencesSyncOwner(owner: string | null): void {
  studioPreferencesSyncOwner = owner?.startsWith('0x') ? owner : null;
}

function pushStudioLogoToBackend(studioId: string, logoUrl: string | null): void {
  if (!studioPreferencesSyncOwner || !isStudioPreferencesApiAvailable()) {
    return;
  }

  void syncStudioPreferencesToBackend({
    owner: studioPreferencesSyncOwner,
    studioId,
    logoUrl,
  }).catch(() => {
    // Studio preference sync is best-effort during demo wiring.
  });
}

export function readStudioLogoOverride(studioId: string): string | null {
  try {
    const stored = window.localStorage.getItem(logoStorageKey(studioId));

    if (!stored || stored.trim() === '') {
      return null;
    }

    return stored;
  } catch {
    return null;
  }
}

export function hydrateStudioLogoOverride(studioId: string, logoUrl: string): void {
  window.localStorage.setItem(logoStorageKey(studioId), logoUrl);
  dispatchLogoChange();
}

export function saveStudioLogoOverride(studioId: string, logoUrl: string): void {
  window.localStorage.setItem(logoStorageKey(studioId), logoUrl);
  dispatchLogoChange();
  pushStudioLogoToBackend(studioId, logoUrl);
}

export function clearStudioLogoOverride(studioId: string): void {
  window.localStorage.removeItem(logoStorageKey(studioId));
  dispatchLogoChange();
  pushStudioLogoToBackend(studioId, null);
}

export function resolveStudioLogoUrl(developer: NamiDeveloperProfile): string | undefined {
  const override = readStudioLogoOverride(developer.id);

  if (override) {
    return override;
  }

  return developer.logoImageUrl;
}

export function withStudioLogo(developer: NamiDeveloperProfile): NamiDeveloperProfile {
  const logoImageUrl = resolveStudioLogoUrl(developer);

  if (!logoImageUrl || logoImageUrl === developer.logoImageUrl) {
    return developer;
  }

  return {
    ...developer,
    logoImageUrl,
  };
}

function subscribeStudioLogos(onStoreChange: () => void): () => void {
  function handleChange(): void {
    onStoreChange();
  }

  window.addEventListener('nami-studio-logo-changed', handleChange);

  return () => {
    window.removeEventListener('nami-studio-logo-changed', handleChange);
  };
}

function getLogoVersionSnapshot(): number {
  return logoVersion;
}

export function useStudioLogoVersion(): number {
  return useSyncExternalStore(subscribeStudioLogos, getLogoVersionSnapshot, () => 0);
}