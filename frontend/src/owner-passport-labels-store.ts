import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'nami.owner.passportLabels';

export type OwnerPassportLabels = {
  primaryLabel: string;
  secondaryLabel: string;
  updatedAtMs: number;
};

const DEFAULT_LABELS: OwnerPassportLabels = {
  primaryLabel: 'Nami CEO',
  secondaryLabel: 'Nami Fiend',
  updatedAtMs: 0,
};

let cachedLabels: OwnerPassportLabels | null = null;

function normalizeLabels(value: Partial<OwnerPassportLabels> | null): OwnerPassportLabels {
  if (!value) {
    return { ...DEFAULT_LABELS, updatedAtMs: Date.now() };
  }

  const primaryLabel = value.primaryLabel?.trim() || DEFAULT_LABELS.primaryLabel;
  const secondaryLabel = value.secondaryLabel?.trim() || DEFAULT_LABELS.secondaryLabel;

  return {
    primaryLabel,
    secondaryLabel,
    updatedAtMs: typeof value.updatedAtMs === 'number' ? value.updatedAtMs : Date.now(),
  };
}

function dispatchChange(): void {
  cachedLabels = null;
  window.dispatchEvent(new CustomEvent('nami-owner-passport-labels-changed'));
}

export function readOwnerPassportLabels(): OwnerPassportLabels {
  if (cachedLabels) {
    return cachedLabels;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      cachedLabels = normalizeLabels(null);
      return cachedLabels;
    }

    cachedLabels = normalizeLabels(JSON.parse(stored) as Partial<OwnerPassportLabels>);
    return cachedLabels;
  } catch {
    cachedLabels = normalizeLabels(null);
    return cachedLabels;
  }
}

export function saveOwnerPassportLabels(
  patch: Partial<Pick<OwnerPassportLabels, 'primaryLabel' | 'secondaryLabel'>>
): OwnerPassportLabels {
  const current = readOwnerPassportLabels();
  const next = normalizeLabels({
    ...current,
    ...patch,
    updatedAtMs: Date.now(),
  });

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cachedLabels = next;
  dispatchChange();

  return next;
}

function subscribe(listener: () => void): () => void {
  function onChange(): void {
    cachedLabels = null;
    listener();
  }

  window.addEventListener('nami-owner-passport-labels-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-owner-passport-labels-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useOwnerPassportLabels(): OwnerPassportLabels {
  return useSyncExternalStore(subscribe, readOwnerPassportLabels, readOwnerPassportLabels);
}

export function resetOwnerPassportLabelsForTests(): void {
  cachedLabels = null;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}