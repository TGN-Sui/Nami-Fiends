import { useSyncExternalStore } from 'react';

import { clearOnboardingDraft, loadOnboardingDraft, type OnboardingDraft } from './onboarding-draft.js';
import { isQuizComplete } from './onboarding-quiz.js';
import {
  memberHasPasswordCredential,
  saveMemberPasswordCredential,
  validatePasswordSetup,
  verifyMemberPasswordCredential,
} from './member-credential-store.js';
import { safeLocalStorageSetItem } from './local-storage-safe.js';
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
  avatarUrl?: string;
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

/** Inline upload avatars belong in nami.self.avatar — not the multi-account registry. */
function shouldPersistAvatarUrlInRegistry(avatarUrl: string): boolean {
  const trimmed = avatarUrl.trim();

  if (!trimmed || trimmed.startsWith('data:') || trimmed.length > 2048) {
    return false;
  }

  return trimmed.startsWith('https://') || trimmed.startsWith('http://');
}

export function compactMemberSessionForRegistry(session: MemberSession): MemberSession {
  if (!session.avatarUrl || shouldPersistAvatarUrlInRegistry(session.avatarUrl)) {
    return session;
  }

  const { avatarUrl: _removed, ...rest } = session;

  return rest;
}

function compactMemberAccountsRegistry(
  registry: Record<string, MemberSession>
): Record<string, MemberSession> {
  return Object.fromEntries(
    Object.entries(registry).map(([email, account]) => [
      email,
      compactMemberSessionForRegistry(account),
    ])
  );
}

function writeMemberAccountsRegistry(registry: Record<string, MemberSession>): boolean {
  return safeLocalStorageSetItem(
    ACCOUNTS_REGISTRY_KEY,
    JSON.stringify(compactMemberAccountsRegistry(registry))
  );
}

export function repairMemberAccountsRegistryStorage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const raw = window.localStorage.getItem(ACCOUNTS_REGISTRY_KEY);

  if (!raw) {
    return false;
  }

  const registry = readMemberAccountsRegistry();
  const compacted = compactMemberAccountsRegistry(registry);
  const nextRaw = JSON.stringify(compacted);

  if (nextRaw.length >= raw.length) {
    return false;
  }

  writeMemberAccountsRegistry(compacted);
  return true;
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
              ...(typeof snapshot.avatarUrl === 'string' &&
              snapshot.avatarUrl.trim() !== '' &&
              shouldPersistAvatarUrlInRegistry(snapshot.avatarUrl)
                ? { avatarUrl: snapshot.avatarUrl.trim() }
                : {}),
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
  const email = normalizeEmail(session.email);
  const existing = registry[email];
  registry[email] = compactMemberSessionForRegistry({
    ...session,
    ...(existing?.avatarUrl && !session.avatarUrl && shouldPersistAvatarUrlInRegistry(existing.avatarUrl)
      ? { avatarUrl: existing.avatarUrl }
      : {}),
  });

  writeMemberAccountsRegistry(registry);

  void import('./officials-submissions-api.js').then(({ syncRegisteredMemberAccountToServer }) => {
    syncRegisteredMemberAccountToServer(registry[email]!).catch(() => {
      // Best-effort — registry sync is retried on the next signup or session save.
    });
  });
}

export function updateRegisteredMemberAvatarUrl(email: string, avatarUrl: string | null): void {
  const normalizedEmail = normalizeEmail(email);
  const registry = readMemberAccountsRegistry();
  const existing = registry[normalizedEmail];

  if (!existing) {
    return;
  }

  const next = compactMemberSessionForRegistry(
    avatarUrl && shouldPersistAvatarUrlInRegistry(avatarUrl)
      ? { ...existing, avatarUrl: avatarUrl.trim() }
      : (({ avatarUrl: _removed, ...rest }) => rest)(existing)
  );

  registry[normalizedEmail] = next;

  if (writeMemberAccountsRegistry(registry)) {
    window.dispatchEvent(new CustomEvent('nami-member-session-changed'));
  }

  void import('./officials-submissions-api.js').then(({ syncRegisteredMemberAccountToServer }) => {
    syncRegisteredMemberAccountToServer(next).catch(() => {
      // Best-effort avatar registry sync.
    });
  });
}

export function readRegisteredMemberAvatarUrl(memberId: string): string | null {
  if (memberId === 'm1') {
    try {
      const selfAvatar = window.localStorage.getItem('nami.self.avatar')?.trim();

      if (selfAvatar) {
        return selfAvatar;
      }
    } catch {
      // Ignore storage failures in restricted environments.
    }
  }

  for (const account of Object.values(readMemberAccountsRegistry())) {
    const id =
      readMemberSession() && normalizeEmail(readMemberSession()!.email) === normalizeEmail(account.email)
        ? 'm1'
        : memberIdForAccountEmail(account.email);

    if (id !== memberId) {
      continue;
    }

    const avatarUrl = account.avatarUrl?.trim();

    return avatarUrl ? avatarUrl : null;
  }

  return null;
}

function memberIdForAccountEmail(email: string): string {
  let hash = 0;

  for (const char of normalizeEmail(email)) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }

  return 'member-' + Math.abs(hash).toString(36);
}

export function mergeRegisteredMemberAccountsFromServer(accounts: MemberSession[]): void {
  const registry = readMemberAccountsRegistry();

  for (const account of accounts) {
    if (typeof account.email !== 'string' || typeof account.displayName !== 'string') {
      continue;
    }

    const email = normalizeEmail(account.email);

    if (!isValidEmail(email)) {
      continue;
    }

    const existing = registry[email];

    registry[email] = {
      displayName: account.displayName,
      email,
      archetype: typeof account.archetype === 'number' ? account.archetype : 2,
      archetypeLabel:
        typeof account.archetypeLabel === 'string' ? account.archetypeLabel : 'Cozy Voyager',
      flavorBadgeId:
        typeof account.flavorBadgeId === 'string' ? account.flavorBadgeId : 'Hearth Basic',
      quizAnswers:
        account.quizAnswers !== null &&
        typeof account.quizAnswers === 'object' &&
        !Array.isArray(account.quizAnswers)
          ? account.quizAnswers
          : {},
      issuedPlayerScore:
        typeof account.issuedPlayerScore === 'number' ? account.issuedPlayerScore : 0,
      issuedPlayerScoreTier:
        account.issuedPlayerScoreTier === 'basic' ||
        account.issuedPlayerScoreTier === 'verified' ||
        account.issuedPlayerScoreTier === 'premium'
          ? account.issuedPlayerScoreTier
          : 'basic',
      playerScoreIssuedAtMs:
        typeof account.playerScoreIssuedAtMs === 'number'
          ? account.playerScoreIssuedAtMs
          : typeof account.signedUpAtMs === 'number'
            ? account.signedUpAtMs
            : Date.now(),
      signedUpAtMs: typeof account.signedUpAtMs === 'number' ? account.signedUpAtMs : Date.now(),
      ...(typeof account.avatarUrl === 'string' &&
      account.avatarUrl.trim() !== '' &&
      shouldPersistAvatarUrlInRegistry(account.avatarUrl)
        ? { avatarUrl: account.avatarUrl.trim() }
        : existing?.avatarUrl && shouldPersistAvatarUrlInRegistry(existing.avatarUrl)
          ? { avatarUrl: existing.avatarUrl }
          : {}),
    };

    registry[email] = compactMemberSessionForRegistry(registry[email]!);
  }

  if (writeMemberAccountsRegistry(registry)) {
    window.dispatchEvent(new CustomEvent('nami-member-session-changed'));
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
  const saved = safeLocalStorageSetItem(SESSION_KEY, JSON.stringify(session));

  if (saved) {
    upsertMemberAccountRegistry(session);
  }

  cachedSession = session;
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

export function hasRegisteredMemberAccount(email: string): boolean {
  if (!isValidEmail(email)) {
    return false;
  }

  return Boolean(readMemberAccountsRegistry()[normalizeEmail(email)]);
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