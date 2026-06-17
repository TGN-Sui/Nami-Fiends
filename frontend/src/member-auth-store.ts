import { useSyncExternalStore } from 'react';

const SIGNED_OUT_KEY = 'nami.auth.signed-out';

function dispatchAuthChange(): void {
  window.dispatchEvent(new CustomEvent('nami-auth-changed'));
}

export function isSignedOut(): boolean {
  try {
    return window.sessionStorage.getItem(SIGNED_OUT_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markSignedOut(): void {
  try {
    window.sessionStorage.setItem(SIGNED_OUT_KEY, 'true');
  } catch {
    // Ignore storage failures in restricted environments.
  }

  dispatchAuthChange();
}

export function clearSignedOut(): void {
  try {
    window.sessionStorage.removeItem(SIGNED_OUT_KEY);
  } catch {
    // Ignore storage failures in restricted environments.
  }

  dispatchAuthChange();
}

function subscribeAuth(onStoreChange: () => void): () => void {
  function handleChange(): void {
    onStoreChange();
  }

  window.addEventListener('nami-auth-changed', handleChange);

  return () => {
    window.removeEventListener('nami-auth-changed', handleChange);
  };
}

export function useSignedOut(): boolean {
  return useSyncExternalStore(subscribeAuth, isSignedOut, () => false);
}