import { useSyncExternalStore } from 'react';

import { shouldUseDevFixtures } from './app-config.js';
import type { GameOfficialSocialPlatform } from './game-onboarding-draft.js';

const STORAGE_KEY = 'nami.game.official-social-auth';

export type GameOfficialSocialAuthState = {
  platform: GameOfficialSocialPlatform | null;
  verified: boolean;
  handle: string | null;
  authorizer: 'x-official-oauth' | 'twitch-official-oauth' | null;
  verifiedAtMs: number | null;
};

export type GameOfficialSocialAuthResult =
  | { ok: true; message: string; handle: string }
  | { ok: false; reason: string };

let cachedState: GameOfficialSocialAuthState | null = null;

const listeners = new Set<() => void>();

function defaultState(): GameOfficialSocialAuthState {
  return {
    platform: null,
    verified: false,
    handle: null,
    authorizer: null,
    verifiedAtMs: null,
  };
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function invalidate(): void {
  cachedState = null;
}

function normalizeXHandle(value: string): string {
  return value.trim().replace(/^@+/, '');
}

function normalizeTwitchChannel(value: string): string {
  return value.trim().replace(/^@+/, '').toLowerCase();
}

function saveState(state: GameOfficialSocialAuthState): void {
  cachedState = state;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('nami-game-official-social-auth-changed'));
  emit();
}

export function readGameOfficialSocialAuthState(): GameOfficialSocialAuthState {
  if (cachedState) {
    return cachedState;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      cachedState = defaultState();
      return cachedState;
    }

    const parsed = JSON.parse(stored) as Partial<GameOfficialSocialAuthState>;

    cachedState = {
      platform:
        parsed.platform === 'x' || parsed.platform === 'twitch' ? parsed.platform : null,
      verified: parsed.verified === true,
      handle: typeof parsed.handle === 'string' ? parsed.handle : null,
      authorizer:
        parsed.authorizer === 'x-official-oauth' || parsed.authorizer === 'twitch-official-oauth'
          ? parsed.authorizer
          : null,
      verifiedAtMs: typeof parsed.verifiedAtMs === 'number' ? parsed.verifiedAtMs : null,
    };

    return cachedState;
  } catch {
    cachedState = defaultState();
    return cachedState;
  }
}

export function clearGameOfficialSocialAuth(): void {
  saveState(defaultState());
}

export function isGameOfficialSocialAuthMockEnabled(): boolean {
  return shouldUseDevFixtures();
}

export function isGameOfficialSocialAuthorizerAvailable(
  platform: GameOfficialSocialPlatform,
): boolean {
  if (isGameOfficialSocialAuthMockEnabled()) {
    return true;
  }

  if (platform === 'x') {
    return import.meta.env.VITE_X_OAUTH_CLIENT_ID !== undefined;
  }

  return import.meta.env.VITE_TWITCH_OAUTH_CLIENT_ID !== undefined;
}

export function gameOfficialSocialAuthorizerStatusMessage(
  platform: GameOfficialSocialPlatform,
): string {
  if (isGameOfficialSocialAuthorizerAvailable(platform)) {
    return platform === 'x'
      ? 'Sign in with your official game X account through X authorization.'
      : 'Sign in with your official Twitch channel through Twitch authorization.';
  }

  return platform === 'x'
    ? 'Official X authorization ships with the live OAuth receiving server. Enable dev fixtures to test the authorizer flow locally.'
    : 'Official Twitch authorization ships with the live OAuth receiving server. Enable dev fixtures to test the authorizer flow locally.';
}

/** Simulates official X OAuth until the live game-studio authorizer ships. */
export function authorizeGameOfficialXAccount(
  mockHandle = 'officialgame',
): GameOfficialSocialAuthResult {
  if (!isGameOfficialSocialAuthorizerAvailable('x')) {
    return {
      ok: false,
      reason:
        'Official X sign-in is not available yet. Use dev fixtures or wait for the live X authorizer.',
    };
  }

  const handle = normalizeXHandle(mockHandle);

  if (handle.length < 2) {
    return { ok: false, reason: 'Official X authorization did not return a valid handle.' };
  }

  const now = Date.now();

  saveState({
    platform: 'x',
    verified: true,
    handle,
    authorizer: 'x-official-oauth',
    verifiedAtMs: now,
  });

  return {
    ok: true,
    message: '@' + handle + ' verified through official X authorization.',
    handle,
  };
}

/** Simulates official Twitch OAuth until the live game-studio authorizer ships. */
export function authorizeGameOfficialTwitchAccount(
  mockChannel = 'officialgamechannel',
): GameOfficialSocialAuthResult {
  if (!isGameOfficialSocialAuthorizerAvailable('twitch')) {
    return {
      ok: false,
      reason:
        'Official Twitch sign-in is not available yet. Use dev fixtures or wait for the live Twitch authorizer.',
    };
  }

  const handle = normalizeTwitchChannel(mockChannel);

  if (handle.length < 2) {
    return { ok: false, reason: 'Official Twitch authorization did not return a valid channel.' };
  }

  const now = Date.now();

  saveState({
    platform: 'twitch',
    verified: true,
    handle,
    authorizer: 'twitch-official-oauth',
    verifiedAtMs: now,
  });

  return {
    ok: true,
    message: handle + ' verified through official Twitch authorization.',
    handle,
  };
}

export function unlinkGameOfficialSocialAuth(): GameOfficialSocialAuthResult {
  clearGameOfficialSocialAuth();

  return {
    ok: true,
    message: 'Official social authorization removed. Sign in again to continue.',
    handle: '',
  };
}

export function useGameOfficialSocialAuthState(): GameOfficialSocialAuthState {
  return useSyncExternalStore(
    (listener) => {
      function onChange(): void {
        invalidate();
        listener();
      }

      window.addEventListener('nami-game-official-social-auth-changed', onChange);
      window.addEventListener('storage', onChange);

      return () => {
        window.removeEventListener('nami-game-official-social-auth-changed', onChange);
        window.removeEventListener('storage', onChange);
      };
    },
    readGameOfficialSocialAuthState,
    readGameOfficialSocialAuthState,
  );
}