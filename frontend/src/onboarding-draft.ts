import {
  deriveArchetypeFromQuiz,
  type QuizArchetype,
} from './onboarding-quiz.js';

const STORAGE_KEY = 'nami.onboarding.draft';

export interface OnboardingDraft {
  displayName: string;
  nodename: string;
  quizAnswers: Record<string, string>;
  archetype: number;
  archetypeLabel: string;
  flavorBadgeId: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export function createEmptyDraft(): OnboardingDraft {
  const now = Date.now();

  return {
    displayName: '',
    nodename: '',
    quizAnswers: {},
    archetype: 2,
    archetypeLabel: 'Cozy Voyager',
    flavorBadgeId: 'Hearth Basic',
    createdAtMs: now,
    updatedAtMs: now,
  };
}

export function loadOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (raw === null || raw.trim() === '') {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingDraft>;

    if (typeof parsed.displayName !== 'string') {
      return null;
    }

    return {
      displayName: parsed.displayName,
      nodename: typeof parsed.nodename === 'string' ? parsed.nodename : '',
      quizAnswers:
        parsed.quizAnswers !== null &&
        typeof parsed.quizAnswers === 'object' &&
        !Array.isArray(parsed.quizAnswers)
          ? parsed.quizAnswers
          : {},
      archetype: typeof parsed.archetype === 'number' ? parsed.archetype : 2,
      archetypeLabel:
        typeof parsed.archetypeLabel === 'string' ? parsed.archetypeLabel : 'Cozy Voyager',
      flavorBadgeId:
        typeof parsed.flavorBadgeId === 'string' ? parsed.flavorBadgeId : 'Hearth Basic',
      createdAtMs: typeof parsed.createdAtMs === 'number' ? parsed.createdAtMs : Date.now(),
      updatedAtMs: typeof parsed.updatedAtMs === 'number' ? parsed.updatedAtMs : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveOnboardingDraft(draft: OnboardingDraft): void {
  if (typeof window === 'undefined') {
    return;
  }

  const next: OnboardingDraft = {
    ...draft,
    updatedAtMs: Date.now(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearOnboardingDraft(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function applyQuizToDraft(
  draft: OnboardingDraft,
  quizAnswers: Record<string, string>
): OnboardingDraft {
  const archetype: QuizArchetype = deriveArchetypeFromQuiz(quizAnswers);

  return {
    ...draft,
    quizAnswers,
    archetype: archetype.id,
    archetypeLabel: archetype.label,
    flavorBadgeId: archetype.flavorBadge,
    updatedAtMs: Date.now(),
  };
}

const NODENAME_PATTERN = /^[a-z][a-z0-9_]{2,23}$/;

export function normalizeNodename(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
}

export function isValidNodename(value: string): boolean {
  return NODENAME_PATTERN.test(normalizeNodename(value));
}

export function nodenameValidationMessage(value: string): string | null {
  const normalized = normalizeNodename(value);

  if (normalized.length === 0) {
    return 'Choose a nodename for your on-chain handle.';
  }

  if (normalized.length < 3) {
    return 'Nodename must be at least 3 characters.';
  }

  if (normalized.length > 24) {
    return 'Nodename must be 24 characters or fewer.';
  }

  if (!NODENAME_PATTERN.test(normalized)) {
    return 'Use lowercase letters, digits, and underscores. Start with a letter.';
  }

  return null;
}

export function isDraftReadyForPreview(draft: OnboardingDraft): boolean {
  return draft.displayName.trim().length >= 2;
}

export function isDraftReadyForClaim(draft: OnboardingDraft): boolean {
  return isDraftReadyForPreview(draft) && isValidNodename(draft.nodename);
}