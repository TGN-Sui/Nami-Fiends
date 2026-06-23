import { isTestLaunchMode } from './app-config.js';
import { hasActiveMemberSession } from './member-session-store.js';

/** Signed-in testers on official testnet builds preview Elite-tier feature gates. */
export function hasTestLaunchTesterEliteAccess(): boolean {
  return isTestLaunchMode() && hasActiveMemberSession();
}