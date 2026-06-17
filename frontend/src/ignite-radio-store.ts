import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'nami.ignite-radio.enabled';
const POSITION_KEY = 'nami.ignite-radio.position';

export type IgniteRadioPosition = {
  x: number;
  y: number;
};

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function readIgniteRadioEnabled(): boolean {
  return readEnabled();
}

export function saveIgniteRadioEnabled(enabled: boolean): void {
  window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('nami-ignite-radio-changed'));
}

export function readIgniteRadioPosition(): IgniteRadioPosition | null {
  try {
    const stored = window.localStorage.getItem(POSITION_KEY);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<IgniteRadioPosition>;

    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') {
      return null;
    }

    return { x: parsed.x, y: parsed.y };
  } catch {
    return null;
  }
}

export function saveIgniteRadioPosition(position: IgniteRadioPosition): void {
  window.localStorage.setItem(POSITION_KEY, JSON.stringify(position));
  window.dispatchEvent(new CustomEvent('nami-ignite-radio-changed'));
}

export function clearIgniteRadioPosition(): void {
  window.localStorage.removeItem(POSITION_KEY);
  window.dispatchEvent(new CustomEvent('nami-ignite-radio-changed'));
}

function subscribeIgniteRadio(onStoreChange: () => void): () => void {
  function handleChange(): void {
    onStoreChange();
  }

  window.addEventListener('nami-ignite-radio-changed', handleChange);
  window.addEventListener('storage', handleChange);

  return () => {
    window.removeEventListener('nami-ignite-radio-changed', handleChange);
    window.removeEventListener('storage', handleChange);
  };
}

export function useIgniteRadioEnabled(): boolean {
  return useSyncExternalStore(subscribeIgniteRadio, readEnabled, () => false);
}