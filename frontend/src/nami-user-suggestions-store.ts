import { useSyncExternalStore } from 'react';

import { getSelfMember } from './member-access.js';
import { readMemberSession } from './member-session-store.js';
import { readUserSurfaceRole } from './surface-preferences.js';

const SUGGESTIONS_KEY = 'nami.user.suggestions';

export type NamiUserSuggestionStatus = 'submitted' | 'reviewed' | 'archived';

export type NamiUserSuggestion = {
  id: string;
  body: string;
  submitterName: string;
  submitterEmail: string;
  surfaceRole: string;
  status: NamiUserSuggestionStatus;
  submittedAtMs: number;
  reviewedAtMs?: number;
  reviewedBy?: string;
};

export type SubmitUserSuggestionResult =
  | { ok: true; suggestion: NamiUserSuggestion }
  | { ok: false; reason: string };

let cachedSuggestions: NamiUserSuggestion[] | undefined;

function invalidateCache(): void {
  cachedSuggestions = undefined;
}

function emitChange(): void {
  invalidateCache();
  window.dispatchEvent(new CustomEvent('nami-user-suggestions-changed'));
}

function readSuggestions(): NamiUserSuggestion[] {
  if (cachedSuggestions) {
    return cachedSuggestions;
  }

  try {
    const stored = window.localStorage.getItem(SUGGESTIONS_KEY);

    if (!stored) {
      cachedSuggestions = [];
      return cachedSuggestions;
    }

    const parsed = JSON.parse(stored) as NamiUserSuggestion[];
    cachedSuggestions = Array.isArray(parsed) ? parsed : [];
    return cachedSuggestions;
  } catch {
    cachedSuggestions = [];
    return cachedSuggestions;
  }
}

function writeSuggestions(suggestions: NamiUserSuggestion[]): void {
  window.localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions.slice(0, 500)));
  emitChange();
}

function subscribe(onStoreChange: () => void): () => void {
  function handleChange(): void {
    onStoreChange();
  }

  window.addEventListener('nami-user-suggestions-changed', handleChange);

  return () => {
    window.removeEventListener('nami-user-suggestions-changed', handleChange);
  };
}

export function useUserSuggestions(): NamiUserSuggestion[] {
  return useSyncExternalStore(subscribe, readSuggestions, readSuggestions);
}

export function listUserSuggestionsSorted(): NamiUserSuggestion[] {
  return [...readSuggestions()].sort((left, right) => right.submittedAtMs - left.submittedAtMs);
}

export function countPendingUserSuggestions(): number {
  return readSuggestions().filter((entry) => entry.status === 'submitted').length;
}

export function listUserSuggestionsForSubmitter(email: string): NamiUserSuggestion[] {
  const normalized = email.trim().toLowerCase();

  if (normalized === '') {
    return [];
  }

  return listUserSuggestionsSorted().filter(
    (entry) => entry.submitterEmail.trim().toLowerCase() === normalized,
  );
}

export function submitUserSuggestion(body: string): SubmitUserSuggestionResult {
  const trimmed = body.trim();

  if (trimmed.length < 10) {
    return { ok: false, reason: 'Write at least 10 characters before sending your suggestion.' };
  }

  const session = readMemberSession();
  const selfMember = getSelfMember();

  const suggestion: NamiUserSuggestion = {
    id: 'suggestion-' + Date.now().toString(36),
    body: trimmed,
    submitterName: session?.displayName ?? selfMember.name,
    submitterEmail: session?.email ?? '',
    surfaceRole: readUserSurfaceRole(),
    status: 'submitted',
    submittedAtMs: Date.now(),
  };

  const suggestions = readSuggestions();
  suggestions.unshift(suggestion);
  writeSuggestions(suggestions);

  return { ok: true, suggestion };
}

export function resetUserSuggestionsStoreForTests(): void {
  invalidateCache();

  try {
    window.localStorage.removeItem(SUGGESTIONS_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}

export function updateUserSuggestionStatus(
  suggestionId: string,
  status: NamiUserSuggestionStatus,
  reviewedBy?: string,
): NamiUserSuggestion | null {
  const suggestions = readSuggestions();
  const index = suggestions.findIndex((entry) => entry.id === suggestionId);

  if (index < 0) {
    return null;
  }

  const current = suggestions[index]!;
  const next: NamiUserSuggestion = {
    ...current,
    status,
    reviewedAtMs: Date.now(),
    ...(reviewedBy ? { reviewedBy } : {}),
  };

  suggestions[index] = next;
  writeSuggestions(suggestions);

  return next;
}