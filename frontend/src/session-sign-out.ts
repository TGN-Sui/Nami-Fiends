import { clearSignedOut } from './member-auth-store.js';
import { clearMemberSession } from './member-session-store.js';
import { clearOnboardingDraft } from './onboarding-draft.js';
import { clearZkLoginSession } from './zklogin.js';

/** Clears local signup/session state so the landing page treats the user as logged out. */
export function clearLocalNamiSession(): void {
  clearMemberSession();
  clearOnboardingDraft();
  clearZkLoginSession();
  clearSignedOut();
}