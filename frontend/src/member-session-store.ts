import { useSyncExternalStore } from 'react';

import { clearOnboardingDraft, loadOnboardingDraft, type OnboardingDraft } from './onboarding-draft.js';
import { isQuizComplete } from './onboarding-quiz.js';

const SESSION_KEY = 'nami.member.session';

export type MemberSession = {
  displayName: string;
  email: string;
  archetype: number;
  archetypeLabel: string;
  flavorBadgeId: string;
  signedUpAtMs: number;
};

let cachedSession: MemberSession | null | undefined;

function invalidateSessionCache(): void {
  cachedSession = undefined;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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

    cachedSession = {
      displayName: parsed.displayName,
      email: parsed.email,
      archetype: typeof parsed.archetype === 'number' ? parsed.archetype : 2,
      archetypeLabel: typeof parsed.archetypeLabel === 'string' ? parsed.archetypeLabel : 'Cozy Voyager',
      flavorBadgeId: typeof parsed.flavorBadgeId === 'string' ? parsed.flavorBadgeId : 'Hearth Basic',
      signedUpAtMs: typeof parsed.signedUpAtMs === 'number' ? parsed.signedUpAtMs : Date.now(),
    };

    return cachedSession;
  } catch {
    cachedSession = null;
    return null;
  }
}

export function saveMemberSession(session: MemberSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  invalidateSessionCache();
  window.dispatchEvent(new CustomEvent('nami-member-session-changed'));
}

export function clearMemberSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
  invalidateSessionCache();
  window.dispatchEvent(new CustomEvent('nami-member-session-changed'));
}

export function isDraftReadyForSignup(draft: OnboardingDraft): boolean {
  return (
    draft.displayName.trim().length >= 2 &&
    isValidEmail(draft.email) &&
    isQuizComplete(draft.quizAnswers)
  );
}

export function completeSignupFromDraft(draft: OnboardingDraft): MemberSession | null {
  if (!isDraftReadyForSignup(draft)) {
    return null;
  }

  const session: MemberSession = {
    displayName: draft.displayName.trim(),
    email: draft.email.trim().toLowerCase(),
    archetype: draft.archetype,
    archetypeLabel: draft.archetypeLabel,
    flavorBadgeId: draft.flavorBadgeId,
    signedUpAtMs: Date.now(),
  };

  saveMemberSession(session);
  clearOnboardingDraft();

  return session;
}

export function hasActiveMemberSession(): boolean {
  return readMemberSession() !== null;
}

export function bootstrapSessionFromDraft(): MemberSession | null {
  const draft = loadOnboardingDraft();

  if (!draft || !isDraftReadyForSignup(draft)) {
    return readMemberSession();
  }

  return completeSignupFromDraft(draft) ?? readMemberSession();
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