import { useSyncExternalStore } from 'react';

import { shouldUseDevFixtures } from './app-config.js';

export type OfficialSocialPlatform = 'x' | 'twitch';
export type OfficialSocialAuthScope = 'game' | 'gamer';

export type OfficialSocialAuthSlot = {
  verified: boolean;
  handle: string | null;
  authorizer: 'x-official-oauth' | 'twitch-official-oauth' | null;
  verifiedAtMs: number | null;
};

export type GameScopedOfficialSocialAuthState = {
  platform: OfficialSocialPlatform | null;
  verified: boolean;
  handle: string | null;
  authorizer: 'x-official-oauth' | 'twitch-official-oauth' | null;
  verifiedAtMs: number | null;
};

export type GamerScopedOfficialSocialAuthState = {
  x: OfficialSocialAuthSlot;
  twitch: OfficialSocialAuthSlot;
};

export type OfficialSocialAuthResult =
  | { ok: true; message: string; handle: string }
  | { ok: false; reason: string };

const GAME_STORAGE_KEY = 'nami.game.official-social-auth';
const GAMER_STORAGE_KEY = 'nami.gamer.official-social-auth';

let cachedGameState: GameScopedOfficialSocialAuthState | null = null;
let cachedGamerState: GamerScopedOfficialSocialAuthState | null = null;

const gameListeners = new Set<() => void>();
const gamerListeners = new Set<() => void>();

function defaultSlot(): OfficialSocialAuthSlot {
  return {
    verified: false,
    handle: null,
    authorizer: null,
    verifiedAtMs: null,
  };
}

function defaultGameState(): GameScopedOfficialSocialAuthState {
  return {
    platform: null,
    verified: false,
    handle: null,
    authorizer: null,
    verifiedAtMs: null,
  };
}

function defaultGamerState(): GamerScopedOfficialSocialAuthState {
  return {
    x: defaultSlot(),
    twitch: defaultSlot(),
  };
}

function emitGame(): void {
  gameListeners.forEach((listener) => listener());
}

function emitGamer(): void {
  gamerListeners.forEach((listener) => listener());
}

function invalidateGame(): void {
  cachedGameState = null;
}

function invalidateGamer(): void {
  cachedGamerState = null;
}

export function normalizeOfficialXHandle(value: string): string {
  return value.trim().replace(/^@+/, '');
}

export function normalizeOfficialTwitchChannel(value: string): string {
  return value.trim().replace(/^@+/, '').toLowerCase();
}

function saveGameState(state: GameScopedOfficialSocialAuthState): void {
  cachedGameState = state;
  window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('nami-game-official-social-auth-changed'));
  emitGame();
}

function saveGamerState(state: GamerScopedOfficialSocialAuthState): void {
  cachedGamerState = state;
  window.localStorage.setItem(GAMER_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('nami-gamer-official-social-auth-changed'));
  emitGamer();
}

function parseSlot(value: unknown): OfficialSocialAuthSlot {
  const parsed = value as Partial<OfficialSocialAuthSlot>;

  return {
    verified: parsed.verified === true,
    handle: typeof parsed.handle === 'string' ? parsed.handle : null,
    authorizer:
      parsed.authorizer === 'x-official-oauth' || parsed.authorizer === 'twitch-official-oauth'
        ? parsed.authorizer
        : null,
    verifiedAtMs: typeof parsed.verifiedAtMs === 'number' ? parsed.verifiedAtMs : null,
  };
}

export function readGameScopedOfficialSocialAuthState(): GameScopedOfficialSocialAuthState {
  if (cachedGameState) {
    return cachedGameState;
  }

  try {
    const stored = window.localStorage.getItem(GAME_STORAGE_KEY);

    if (!stored) {
      cachedGameState = defaultGameState();
      return cachedGameState;
    }

    const parsed = JSON.parse(stored) as Partial<GameScopedOfficialSocialAuthState>;

    cachedGameState = {
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

    return cachedGameState;
  } catch {
    cachedGameState = defaultGameState();
    return cachedGameState;
  }
}

export function readGamerScopedOfficialSocialAuthState(): GamerScopedOfficialSocialAuthState {
  if (cachedGamerState) {
    return cachedGamerState;
  }

  try {
    const stored = window.localStorage.getItem(GAMER_STORAGE_KEY);

    if (!stored) {
      cachedGamerState = defaultGamerState();
      return cachedGamerState;
    }

    const parsed = JSON.parse(stored) as Partial<GamerScopedOfficialSocialAuthState>;

    cachedGamerState = {
      x: parseSlot(parsed.x),
      twitch: parseSlot(parsed.twitch),
    };

    return cachedGamerState;
  } catch {
    cachedGamerState = defaultGamerState();
    return cachedGamerState;
  }
}

export function clearGameScopedOfficialSocialAuth(): void {
  saveGameState(defaultGameState());
}

export function clearGamerScopedOfficialSocialAuth(): void {
  saveGamerState(defaultGamerState());
}

export function clearAllOfficialSocialAuth(): void {
  clearGameScopedOfficialSocialAuth();
  clearGamerScopedOfficialSocialAuth();
}

export function isOfficialSocialAuthMockEnabled(): boolean {
  return shouldUseDevFixtures();
}

export function isOfficialSocialAuthorizerAvailable(platform: OfficialSocialPlatform): boolean {
  if (isOfficialSocialAuthMockEnabled()) {
    return true;
  }

  if (platform === 'x') {
    return import.meta.env.VITE_X_OAUTH_CLIENT_ID !== undefined;
  }

  return import.meta.env.VITE_TWITCH_OAUTH_CLIENT_ID !== undefined;
}

export function officialSocialAuthorizerStatusMessage(
  scope: OfficialSocialAuthScope,
  platform: OfficialSocialPlatform,
): string {
  if (isOfficialSocialAuthorizerAvailable(platform)) {
    if (scope === 'game') {
      return platform === 'x'
        ? 'Sign in with your official game X account through X authorization.'
        : 'Sign in with your official Twitch channel through Twitch authorization.';
    }

    return platform === 'x'
      ? 'Sign in with your X account through official X authorization.'
      : 'Sign in with your Twitch account through official Twitch authorization.';
  }

  return platform === 'x'
    ? 'Official X authorization ships with the live OAuth receiving server. Enable dev fixtures to test the authorizer flow locally.'
    : 'Official Twitch authorization ships with the live OAuth receiving server. Enable dev fixtures to test the authorizer flow locally.';
}

function authorizeGamePlatform(
  platform: OfficialSocialPlatform,
  mockHandle: string,
): OfficialSocialAuthResult {
  if (!isOfficialSocialAuthorizerAvailable(platform)) {
    return {
      ok: false,
      reason:
        platform === 'x'
          ? 'Official X sign-in is not available yet. Use dev fixtures or wait for the live X authorizer.'
          : 'Official Twitch sign-in is not available yet. Use dev fixtures or wait for the live Twitch authorizer.',
    };
  }

  const handle =
    platform === 'x'
      ? normalizeOfficialXHandle(mockHandle)
      : normalizeOfficialTwitchChannel(mockHandle);

  if (handle.length < 2) {
    return {
      ok: false,
      reason:
        platform === 'x'
          ? 'Official X authorization did not return a valid handle.'
          : 'Official Twitch authorization did not return a valid channel.',
    };
  }

  const now = Date.now();

  saveGameState({
    platform,
    verified: true,
    handle,
    authorizer: platform === 'x' ? 'x-official-oauth' : 'twitch-official-oauth',
    verifiedAtMs: now,
  });

  return {
    ok: true,
    message:
      platform === 'x'
        ? '@' + handle + ' verified through official X authorization.'
        : handle + ' verified through official Twitch authorization.',
    handle,
  };
}

function authorizeGamerPlatform(
  platform: OfficialSocialPlatform,
  mockHandle: string,
): OfficialSocialAuthResult {
  if (!isOfficialSocialAuthorizerAvailable(platform)) {
    return {
      ok: false,
      reason:
        platform === 'x'
          ? 'Official X sign-in is not available yet. Use dev fixtures or wait for the live X authorizer.'
          : 'Official Twitch sign-in is not available yet. Use dev fixtures or wait for the live Twitch authorizer.',
    };
  }

  const handle =
    platform === 'x'
      ? normalizeOfficialXHandle(mockHandle)
      : normalizeOfficialTwitchChannel(mockHandle);

  if (handle.length < 2) {
    return {
      ok: false,
      reason:
        platform === 'x'
          ? 'Official X authorization did not return a valid handle.'
          : 'Official Twitch authorization did not return a valid channel.',
    };
  }

  const state = readGamerScopedOfficialSocialAuthState();
  const now = Date.now();
  const slot: OfficialSocialAuthSlot = {
    verified: true,
    handle,
    authorizer: platform === 'x' ? 'x-official-oauth' : 'twitch-official-oauth',
    verifiedAtMs: now,
  };

  saveGamerState({
    ...state,
    x: platform === 'x' ? slot : state.x,
    twitch: platform === 'twitch' ? slot : state.twitch,
  });

  return {
    ok: true,
    message:
      platform === 'x'
        ? '@' + handle + ' verified through official X authorization.'
        : handle + ' verified through official Twitch authorization.',
    handle,
  };
}

export function authorizeGameOfficialXAccount(
  mockHandle = 'officialgame',
): OfficialSocialAuthResult {
  return authorizeGamePlatform('x', mockHandle);
}

export function authorizeGameOfficialTwitchAccount(
  mockChannel = 'officialgamechannel',
): OfficialSocialAuthResult {
  return authorizeGamePlatform('twitch', mockChannel);
}

export function authorizeGamerOfficialXAccount(mockHandle = 'npcgamer'): OfficialSocialAuthResult {
  return authorizeGamerPlatform('x', mockHandle);
}

export function authorizeGamerOfficialTwitchAccount(
  mockChannel = 'npcgamerchannel',
): OfficialSocialAuthResult {
  return authorizeGamerPlatform('twitch', mockChannel);
}

export function unlinkGameOfficialSocialAuth(): OfficialSocialAuthResult {
  clearGameScopedOfficialSocialAuth();

  return {
    ok: true,
    message: 'Official social authorization removed. Sign in again to continue.',
    handle: '',
  };
}

export function unlinkGamerOfficialSocialAuth(
  platform: OfficialSocialPlatform,
): OfficialSocialAuthResult {
  const state = readGamerScopedOfficialSocialAuthState();

  saveGamerState({
    ...state,
    x: platform === 'x' ? defaultSlot() : state.x,
    twitch: platform === 'twitch' ? defaultSlot() : state.twitch,
  });

  return {
    ok: true,
    message:
      platform === 'x'
        ? 'X authorization removed. Sign in again to boost your Player Score.'
        : 'Twitch authorization removed. Sign in again to boost your Player Score.',
    handle: '',
  };
}

export function isGameOfficialSocialVerified(
  platform: OfficialSocialPlatform,
): boolean {
  const state = readGameScopedOfficialSocialAuthState();

  return (
    state.platform === platform &&
    state.verified &&
    state.handle !== null &&
    state.handle.length >= 2
  );
}

export function isGamerOfficialSocialVerified(platform: OfficialSocialPlatform): boolean {
  const slot = readGamerScopedOfficialSocialAuthState()[platform];

  return slot.verified && slot.handle !== null && slot.handle.length >= 2;
}

export function useGameScopedOfficialSocialAuthState(): GameScopedOfficialSocialAuthState {
  return useSyncExternalStore(
    (listener) => {
      function onChange(): void {
        invalidateGame();
        listener();
      }

      window.addEventListener('nami-game-official-social-auth-changed', onChange);
      window.addEventListener('storage', onChange);

      return () => {
        window.removeEventListener('nami-game-official-social-auth-changed', onChange);
        window.removeEventListener('storage', onChange);
      };
    },
    readGameScopedOfficialSocialAuthState,
    readGameScopedOfficialSocialAuthState,
  );
}

export function useGamerScopedOfficialSocialAuthState(): GamerScopedOfficialSocialAuthState {
  return useSyncExternalStore(
    (listener) => {
      function onChange(): void {
        invalidateGamer();
        listener();
      }

      window.addEventListener('nami-gamer-official-social-auth-changed', onChange);
      window.addEventListener('storage', onChange);

      return () => {
        window.removeEventListener('nami-gamer-official-social-auth-changed', onChange);
        window.removeEventListener('storage', onChange);
      };
    },
    readGamerScopedOfficialSocialAuthState,
    readGamerScopedOfficialSocialAuthState,
  );
}