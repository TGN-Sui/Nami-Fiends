import { useSyncExternalStore } from 'react';

import { shouldUseDevFixtures } from './app-config.js';

const X_VERIFICATION_KEY = 'nami.x.verification';

export type XVerificationState = {
  linked: boolean;
  verified: boolean;
  handle: string | null;
  verifiedAtMs: number | null;
};

let cachedState: XVerificationState | null = null;

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function defaultState(): XVerificationState {
  return {
    linked: false,
    verified: false,
    handle: null,
    verifiedAtMs: null,
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function readXVerificationState(): XVerificationState {
  if (cachedState) {
    return cachedState;
  }

  try {
    const stored = window.localStorage.getItem(X_VERIFICATION_KEY);

    if (!stored) {
      cachedState = defaultState();
      return cachedState;
    }

    const parsed = JSON.parse(stored) as Partial<XVerificationState>;

    cachedState = {
      linked: parsed.linked === true,
      verified: parsed.verified === true,
      handle: typeof parsed.handle === 'string' ? parsed.handle : null,
      verifiedAtMs: typeof parsed.verifiedAtMs === 'number' ? parsed.verifiedAtMs : null,
    };

    return cachedState;
  } catch {
    cachedState = defaultState();
    return cachedState;
  }
}

function saveState(state: XVerificationState): void {
  cachedState = state;
  window.localStorage.setItem(X_VERIFICATION_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('nami-x-verification-changed'));
  emit();
}

function invalidate(): void {
  cachedState = null;
}

export function useXVerificationState(): XVerificationState {
  return useSyncExternalStore(
    (listener) => {
      function onChange(): void {
        invalidate();
        listener();
      }

      window.addEventListener('nami-x-verification-changed', onChange);
      window.addEventListener('storage', onChange);

      return () => {
        window.removeEventListener('nami-x-verification-changed', onChange);
        window.removeEventListener('storage', onChange);
      };
    },
    readXVerificationState,
    readXVerificationState
  );
}

export type XVerificationActionResult =
  | { ok: true; message: string }
  | { ok: false; reason: string };

export function isXVerificationMockEnabled(): boolean {
  return shouldUseDevFixtures();
}

/** Simulates X.com OAuth authorization until the live OAuth callback ships. */
export function authorizeXAccount(mockHandle = 'npcgamer'): XVerificationActionResult {
  if (!isXVerificationMockEnabled()) {
    return {
      ok: false,
      reason: 'X.com authorization is not available until the live OAuth flow ships.',
    };
  }

  const now = Date.now();

  saveState({
    linked: true,
    verified: true,
    handle: mockHandle,
    verifiedAtMs: now,
  });

  return {
    ok: true,
    message: '@' + mockHandle + ' verified through X account authorization.',
  };
}

export function unlinkXAccount(): XVerificationActionResult {
  saveState(defaultState());

  return {
    ok: true,
    message: 'X.com account unlinked. Adventurer X-claim access revokes at next renewal check.',
  };
}

export function isXVerificationEligibleForAdventurerClaim(): boolean {
  return readXVerificationState().verified;
}