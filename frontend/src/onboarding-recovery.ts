import { isTestLaunchMode, readAppConfig } from './app-config.js';
import { isZkLoginProductionReady } from './zklogin-config.js';

export function shouldShowRecoveryOnboardingNote(): boolean {
  return isTestLaunchMode(readAppConfig());
}

export function recoveryEmailOnboardingHint(): string {
  return 'Your verified signup email is the recovery anchor if you lose access to Google sign-in or need passport help.';
}

export function zkLoginAccountLinkHint(): string {
  return 'No Nami account is linked to this Google sign-in yet. Sign up first, then return here — your verified email ties every sign-in method together.';
}

export function recoverySettingsHint(): string {
  return 'If you lose wallet or zkLogin access, open a recovery request from Settings → Protocol once your passport is on-chain.';
}

export function zkLoginLaunchReadinessMessage(): string {
  if (!isTestLaunchMode()) {
    return 'zkLogin is optional in dev builds. Set VITE_ZKLOGIN_CLIENT_ID to test the Google path locally.';
  }

  if (isZkLoginProductionReady()) {
    return 'zkLogin is configured for this testnet origin. Sign in with Google to derive your Sui address.';
  }

  return 'Configure VITE_ZKLOGIN_CLIENT_ID and VITE_ZKLOGIN_REDIRECT_URL for this deploy origin before public testnet launch.';
}