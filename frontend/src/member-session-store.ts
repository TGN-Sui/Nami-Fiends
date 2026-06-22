import { useSyncExternalStore } from 'react';

import { clearOnboardingDraft, loadOnboardingDraft, type OnboardingDraft } from './onboarding-draft.js';
import { isQuizComplete } from './onboarding-quiz.js';
import {
  memberHasPasswordCredential,
  saveMemberPasswordCredential,
  validatePasswordSetup,
  verifyMemberPasswordCredential,
} from './member-credential-store.js';
import { computePlayerScoreFromDraft, type PlayerScoreTier } from './player-score.js';

const SESSION_KEY = 'nami.member.session';
const ACCOUNTS_REGISTRY_KEY = 'nami.member.accounts';

export type MemberSession = {
  displayName: string;
  email: string;
  archetype: number;
  archetypeLabel: string;
  flavorBadgeId: string;
  quizAnswers: Record<string, string>;
  issuedPlayerScore: number;
  issuedPlayerScoreTier: PlayerScoreTier;
  playerScoreIssuedAtMs: number;
  signedUpAtMs: number;
};

let cachedSession: MemberSession | null | undefined;

function invalidateSessionCache(): void {
  cachedSession = undefined;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function readMemberAccountsRegistry(): Record<string, MemberSession> {
  try {
    const stored = window.localStorage.getItem(ACCOUNTS_REGISTRY_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<string, Partial<MemberSession>>;

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([email, snapshot]) => {
        if (typeof snapshot.displayName !== 'string' || typeof snapshot.email !== 'string') {
          return [];
        }

        return [
          [
            email,
            {
              displayName: snapshot.displayName,
              email: snapshot.email,
              archetype: typeof snapshot.archetype === 'number' ? snapshot.archetype : 2,
              archetypeLabel:
                typeof snapshot.archetypeLabel === 'string' ? snapshot.archetypeLabel : 'Cozy Voyager',
              flavorBadgeId:
                typeof snapshot.flavorBadgeId === 'string' ? snapshot.flavorBadgeId : 'Hearth Basic',
              quizAnswers:
                snapshot.quizAnswers !== null &&
                typeof snapshot.quizAnswers === 'object' &&
                !Array.isArray(snapshot.quizAnswers)
                  ? snapshot.quizAnswers
                  : {},
              issuedPlayerScore:
                typeof snapshot.issuedPlayerScore === 'number' ? snapshot.issuedPlayerScore : 0,
              issuedPlayerScoreTier:
                snapshot.issuedPlayerScoreTier === 'basic' ||
                snapshot.issuedPlayerScoreTier === 'verified' ||
                snapshot.issuedPlayerScoreTier === 'premium'
                  ? snapshot.issuedPlayerScoreTier
                  : 'basic',
              playerScoreIssuedAtMs:
                typeof snapshot.playerScoreIssuedAtMs === 'number'
                  ? snapshot.playerScoreIssuedAtMs
                  : typeof snapshot.signedUpAtMs === 'number'
                    ? snapshot.signedUpAtMs
                    : Date.now(),
              signedUpAtMs:
                typeof snapshot.signedUpAtMs === 'number' ? snapshot.signedUpAtMs : Date.now(),
            } satisfies MemberSession,
          ],
        ];
      }),
    );
  } catch {
    return {};
  }
}

function upsertMemberAccountRegistry(session: MemberSession): void {
  const registry = readMemberAccountsRegistry();
  registry[normalizeEmail(session.email)] = session;

  try {
    window.localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(registry));
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

/** Signup identity name — set at registration and not updated by passport display edits. */
export function readSignupDisplayName(session: MemberSession): string {
  return session.displayName.trim();
}

export function authenticateMemberCredentials(
  email: string,
  password?: string
): MemberSession | null {
  if (!isValidEmail(email)) {
    return null;
  }

  const normalizedEmail = normalizeEmail(email);
  const requiresPassword = memberHasPasswordCredential(normalizedEmail);

  if (requiresPassword) {
    if (!password || !verifyMemberPasswordCredential(normalizedEmail, password)) {
      return null;
    }
  }

  const activeSession = readMemberSession();

  if (activeSession && normalizeEmail(activeSession.email) === normalizedEmail) {
    return activeSession;
  }

  const registryMatch = readMemberAccountsRegistry()[normalizedEmail];

  if (!registryMatch) {
    return null;
  }

  saveMemberSession(registryMatch);

  return registryMatch;
}

export function readMemberSession(): MemberSession | null {
  if (cachedSession !== undefined) {
    return cachedSession;
  }

  try {
    const stored = window.localStorage.getItem(SESSION_KEY);

    if (!stored) {
      cachedSession = null;
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<MemberSession>;

    if (typeof parsed.displayName !== 'string' || typeof parsed.email !== 'string') {
      cachedSession = null;
      return null;
    }

    const session: MemberSession = {
      displayName: parsed.displayName,
      email: parsed.email,
      archetype: typeof parsed.archetype === 'number' ? parsed.archetype : 2,
      archetypeLabel: typeof parsed.archetypeLabel === 'string' ? parsed.archetypeLabel : 'Cozy Voyager',
      flavorBadgeId: typeof parsed.flavorBadgeId === 'string' ? parsed.flavorBadgeId : 'Hearth Basic',
      quizAnswers:
        parsed.quizAnswers !== null &&
        typeof parsed.quizAnswers === 'object' &&
        !Array.isArray(parsed.quizAnswers)
          ? parsed.quizAnswers
          : {},
      issuedPlayerScore: typeof parsed.issuedPlayerScore === 'number' ? parsed.issuedPlayerScore : 0,
      issuedPlayerScoreTier:
        parsed.issuedPlayerScoreTier === 'basic' ||
        parsed.issuedPlayerScoreTier === 'verified' ||
        parsed.issuedPlayerScoreTier === 'premium'
          ? parsed.issuedPlayerScoreTier
          : 'basic',
      playerScoreIssuedAtMs:
        typeof parsed.playerScoreIssuedAtMs === 'number'
          ? parsed.playerScoreIssuedAtMs
          : typeof parsed.signedUpAtMs === 'number'
            ? parsed.signedUpAtMs
            : Date.now(),
      signedUpAtMs: typeof parsed.signedUpAtMs === 'number' ? parsed.signedUpAtMs : Date.now(),
    };

    if (!readMemberAccountsRegistry()[normalizeEmail(session.email)]) {
      upsertMemberAccountRegistry(session);
    }

    cachedSession = session;

    return cachedSession;
  } catch {
    cachedSession = null;
    return null;
  }
}

export function saveMemberSession(session: MemberSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  upsertMemberAccountRegistry(session);
  invalidateSessionCache();
  window.dispatchEvent(new CustomEvent('nami-member-session-changed'));
}

export function clearMemberSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
  invalidateSessionCache();
  window.dispatchEvent(new CustomEvent('nami-member-session-changed'));
}

export function isDraftReadyForSignup(draft: OnboardingDraft, password: string, confirmPassword: string): boolean {
  return (
    draft.displayName.trim().length >= 2 &&
    isValidEmail(draft.email) &&
    draft.emailVerified &&
    isQuizComplete(draft.quizAnswers) &&
    validatePasswordSetup(password, confirmPassword).ok
  );
}

export function completeSignupFromDraft(
  draft: OnboardingDraft,
  password: string,
  confirmPassword: string
): MemberSession | null {
  if (!isDraftReadyForSignup(draft, password, confirmPassword)) {
    return null;
  }

  const issuedScore = computePlayerScoreFromDraft({
    displayName: draft.displayName,
    email: draft.email,
    quizAnswers: draft.quizAnswers,
    socialXVerified: draft.socialXVerified,
    socialTwitchVerified: draft.socialTwitchVerified,
    optionalPlatformLinks: draft.optionalPlatformLinks,
  });
  const issuedAtMs = Date.now();

  const session: MemberSession = {
    displayName: draft.displayName.trim(),
    email: draft.email.trim().toLowerCase(),
    archetype: draft.archetype,
    archetypeLabel: draft.archetypeLabel,
    flavorBadgeId: draft.flavorBadgeId,
    quizAnswers: { ...draft.quizAnswers },
    issuedPlayerScore: issuedScore.total,
    issuedPlayerScoreTier: issuedScore.tier,
    playerScoreIssuedAtMs: issuedAtMs,
    signedUpAtMs: issuedAtMs,
  };

  saveMemberSession(session);
  saveMemberPasswordCredential(session.email, password);
  clearOnboardingDraft();

  return session;
}

export function listRegisteredMemberAccounts(): MemberSession[] {
  const registry = readMemberAccountsRegistry();
  const activeSession = readMemberSession();
  const byEmail = new Map<string, MemberSession>();

  for (const session of Object.values(registry)) {
    byEmail.set(normalizeEmail(session.email), session);
  }

  if (activeSession) {
    byEmail.set(normalizeEmail(activeSession.email), activeSession);
  }

  return [...byEmail.values()].sort((left, right) => right.signedUpAtMs - left.signedUpAtMs);
}

export function hasActiveMemberSession(): boolean {
  return readMemberSession() !== null;
}

export function bootstrapSessionFromDraft(): MemberSession | null {
  const draft = loadOnboardingDraft();

  if (!draft) {
    return readMemberSession();
  }

  return readMemberSession();
}

function getSessionSnapshot(): MemberSession | null {
  return readMemberSession();
}

function subscribeSession(onStoreChange: () => void): () => void {
  function handleChange(): void {
    invalidateSessionCache();
    onStoreChange();
  }

  window.addEventListener('nami-member-session-changed', handleChange);

  return () => {
    window.removeEventListener('nami-member-session-changed', handleChange);
  };
}

export function useMemberSession(): MemberSession | null {
  return useSyncExternalStore(subscribeSession, getSessionSnapshot, getSessionSnapshot);
}