import type { OfficialSocialPlatform } from './official-social-auth-store.js';
import {
  authorizeGameOfficialTwitchAccount,
  authorizeGameOfficialXAccount,
  clearGameScopedOfficialSocialAuth,
  isGameOfficialSocialVerified,
  isOfficialSocialAuthMockEnabled,
  isOfficialSocialAuthorizerAvailable,
  officialSocialAuthorizerStatusMessage,
  readGameScopedOfficialSocialAuthState,
  unlinkGameOfficialSocialAuth,
  useGameScopedOfficialSocialAuthState,
  type GameScopedOfficialSocialAuthState,
  type OfficialSocialAuthResult,
} from './official-social-auth-store.js';

export type GameOfficialSocialPlatform = OfficialSocialPlatform;

export type GameOfficialSocialAuthState = GameScopedOfficialSocialAuthState;

export type GameOfficialSocialAuthResult = OfficialSocialAuthResult;

export const readGameOfficialSocialAuthState = readGameScopedOfficialSocialAuthState;
export const clearGameOfficialSocialAuth = clearGameScopedOfficialSocialAuth;
export const useGameOfficialSocialAuthState = useGameScopedOfficialSocialAuthState;

export function isGameOfficialSocialAuthMockEnabled(): boolean {
  return isOfficialSocialAuthMockEnabled();
}

export function isGameOfficialSocialAuthorizerAvailable(platform: OfficialSocialPlatform): boolean {
  return isOfficialSocialAuthorizerAvailable(platform);
}

export function gameOfficialSocialAuthorizerStatusMessage(platform: OfficialSocialPlatform): string {
  return officialSocialAuthorizerStatusMessage('game', platform);
}

export {
  authorizeGameOfficialTwitchAccount,
  authorizeGameOfficialXAccount,
  isGameOfficialSocialVerified,
  unlinkGameOfficialSocialAuth,
};