import { useSyncExternalStore } from 'react';

import { readGameOwnerSession } from './game-owner-session-store.js';

const STORAGE_KEY = 'nami.game.approval-welcome';

export type GameApprovalWelcomeStep =
  | 'approved'
  | 'one-more-step'
  | 'questionnaire-prompt'
  | 'questionnaire'
  | 'completed';

export type GameApprovalWelcomeState = {
  ticketId: string;
  step: GameApprovalWelcomeStep;
  questionnaireAnswers: Record<string, string>;
  updatedAtMs: number;
};

let cachedState: GameApprovalWelcomeState | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function invalidate(): void {
  cachedState = null;
}

function defaultState(ticketId: string): GameApprovalWelcomeState {
  return {
    ticketId,
    step: 'approved',
    questionnaireAnswers: {},
    updatedAtMs: Date.now(),
  };
}

function saveState(state: GameApprovalWelcomeState): void {
  cachedState = state;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('nami-game-approval-welcome-changed'));
  emit();
}

export function readGameApprovalWelcomeState(): GameApprovalWelcomeState | null {
  if (cachedState) {
    return cachedState;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      cachedState = null;
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<GameApprovalWelcomeState>;

    if (typeof parsed.ticketId !== 'string' || typeof parsed.step !== 'string') {
      cachedState = null;
      return null;
    }

    cachedState = {
      ticketId: parsed.ticketId,
      step: parsed.step as GameApprovalWelcomeStep,
      questionnaireAnswers:
        parsed.questionnaireAnswers !== null &&
        typeof parsed.questionnaireAnswers === 'object' &&
        !Array.isArray(parsed.questionnaireAnswers)
          ? parsed.questionnaireAnswers
          : {},
      updatedAtMs: typeof parsed.updatedAtMs === 'number' ? parsed.updatedAtMs : Date.now(),
    };

    return cachedState;
  } catch {
    cachedState = null;
    return null;
  }
}

export function clearGameApprovalWelcomeState(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  cachedState = null;
  window.dispatchEvent(new CustomEvent('nami-game-approval-welcome-changed'));
  emit();
}

export function queueGameApprovalWelcome(ticketId: string): void {
  const existing = readGameApprovalWelcomeState();

  if (existing?.ticketId === ticketId && existing.step !== 'completed') {
    return;
  }

  saveState(defaultState(ticketId));
}

export function shouldShowGameApprovalWelcome(): boolean {
  const session = readGameOwnerSession();
  const welcome = readGameApprovalWelcomeState();

  if (!session || session.approvalStatus !== 'approved') {
    return false;
  }

  if (!welcome || welcome.ticketId !== session.ticketId) {
    return false;
  }

  return welcome.step !== 'completed';
}

export function advanceGameApprovalWelcomeStep(): GameApprovalWelcomeStep {
  const welcome = readGameApprovalWelcomeState();

  if (!welcome) {
    return 'completed';
  }

  const nextStep: GameApprovalWelcomeStep =
    welcome.step === 'approved'
      ? 'one-more-step'
      : welcome.step === 'one-more-step'
        ? 'questionnaire-prompt'
        : welcome.step === 'questionnaire-prompt'
          ? 'questionnaire'
          : 'completed';

  saveState({
    ...welcome,
    step: nextStep,
    updatedAtMs: Date.now(),
  });

  return nextStep;
}

export function updateGameApprovalQuestionnaireAnswer(
  questionId: string,
  optionId: string,
): void {
  const welcome = readGameApprovalWelcomeState();

  if (!welcome) {
    return;
  }

  saveState({
    ...welcome,
    step: 'questionnaire',
    questionnaireAnswers: {
      ...welcome.questionnaireAnswers,
      [questionId]: optionId,
    },
    updatedAtMs: Date.now(),
  });
}

export function completeGameApprovalWelcome(): void {
  const welcome = readGameApprovalWelcomeState();

  if (!welcome) {
    return;
  }

  saveState({
    ...welcome,
    step: 'completed',
    updatedAtMs: Date.now(),
  });
}

export function useGameApprovalWelcomeState(): GameApprovalWelcomeState | null {
  return useSyncExternalStore(
    (listener) => {
      function onChange(): void {
        invalidate();
        listener();
      }

      window.addEventListener('nami-game-approval-welcome-changed', onChange);
      window.addEventListener('storage', onChange);

      return () => {
        window.removeEventListener('nami-game-approval-welcome-changed', onChange);
        window.removeEventListener('storage', onChange);
      };
    },
    readGameApprovalWelcomeState,
    readGameApprovalWelcomeState,
  );
}