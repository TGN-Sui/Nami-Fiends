import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'nami.arcade.audio-preferences';
const DEFAULT_VOLUME = 0.72;

export type ArcadeAudioPreferences = {
  volume: number;
  muted: boolean;
};

const listeners = new Set<() => void>();
let cachedPreferences: ArcadeAudioPreferences | null = null;

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_VOLUME;
  }

  return Math.min(1, Math.max(0, value));
}

function normalizePreferences(value: Partial<ArcadeAudioPreferences> | null): ArcadeAudioPreferences {
  return {
    volume: clampVolume(value?.volume ?? DEFAULT_VOLUME),
    muted: Boolean(value?.muted),
  };
}

function readPreferences(): ArcadeAudioPreferences {
  if (cachedPreferences) {
    return cachedPreferences;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      cachedPreferences = normalizePreferences(null);
      return cachedPreferences;
    }

    const parsed = JSON.parse(stored) as Partial<ArcadeAudioPreferences>;
    cachedPreferences = normalizePreferences(parsed);
    return cachedPreferences;
  } catch {
    cachedPreferences = normalizePreferences(null);
    return cachedPreferences;
  }
}

function writePreferences(next: ArcadeAudioPreferences): void {
  cachedPreferences = normalizePreferences(next);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedPreferences));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readArcadeAudioPreferences(): ArcadeAudioPreferences {
  return readPreferences();
}

export function setArcadeAudioVolume(volume: number): void {
  const current = readPreferences();

  writePreferences({
    ...current,
    volume: clampVolume(volume),
    muted: false,
  });
}

export function setArcadeAudioMuted(muted: boolean): void {
  const current = readPreferences();

  writePreferences({
    ...current,
    muted,
  });
}

export function toggleArcadeAudioMuted(): boolean {
  const current = readPreferences();
  const nextMuted = !current.muted;

  writePreferences({
    ...current,
    muted: nextMuted,
  });

  return nextMuted;
}

export function useArcadeAudioPreferences(): ArcadeAudioPreferences {
  return useSyncExternalStore(subscribe, readPreferences, readPreferences);
}

export function resetArcadeAudioPreferencesForTests(): void {
  cachedPreferences = null;
  window.localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener());
}