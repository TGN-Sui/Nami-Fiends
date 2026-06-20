import { clearSignedOut } from './member-auth-store.js';
import { clearGameApprovalWelcomeState } from './game-approval-welcome-store.js';
import { clearGameOnboardingDraft } from './game-onboarding-draft.js';
import { clearContactCodeVerification } from './contact-code-verification-store.js';
import { clearAllOfficialSocialAuth } from './official-social-auth-store.js';
import { clearGameOwnerSession } from './game-owner-session-store.js';
import { clearMemberSession } from './member-session-store.js';
import { clearOnboardingDraft } from './onboarding-draft.js';
import { saveUserSurfaceRole } from './surface-preferences.js';
import { clearZkLoginSession } from './zklogin.js';

/** Clears local signup/session state so the landing page treats the user as logged out. */
export function clearLocalNamiSession(): void {
  clearMemberSession();
  clearGameOwnerSession();
  clearOnboardingDraft();
  clearGameOnboardingDraft();
  clearGameApprovalWelcomeState();
  clearAllOfficialSocialAuth();
  clearContactCodeVerification();
  clearZkLoginSession();
  clearSignedOut();
  saveUserSurfaceRole('member');
}