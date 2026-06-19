const STORAGE_KEY = 'nami.game.onboarding.draft';

export type GameOfficialSocialPlatform = 'x' | 'twitch';

export type GameOnboardingAct = 'identity' | 'officials' | 'proof' | 'review' | 'questionnaire';

export interface GameOnboardingDraft {
  gameTitle: string;
  studioName: string;
  contactName: string;
  email: string;
  phone: string;
  websiteUrl: string;
  storePageUrl: string;
  trailerUrl: string;
  officialSocialPlatform: GameOfficialSocialPlatform | null;
  officialSocialHandle: string;
  officialSocialVerified: boolean;
  walletLinked: boolean;
  walletAddress: string | null;
  questionnaireStarted: boolean;
  questionnaireAnswers: Record<string, string>;
  createdAtMs: number;
  updatedAtMs: number;
}

export function createEmptyGameOnboardingDraft(): GameOnboardingDraft {
  const now = Date.now();

  return {
    gameTitle: '',
    studioName: '',
    contactName: '',
    email: '',
    phone: '',
    websiteUrl: '',
    storePageUrl: '',
    trailerUrl: '',
    officialSocialPlatform: null,
    officialSocialHandle: '',
    officialSocialVerified: false,
    walletLinked: false,
    walletAddress: null,
    questionnaireStarted: false,
    questionnaireAnswers: {},
    createdAtMs: now,
    updatedAtMs: now,
  };
}

export function loadGameOnboardingDraft(): GameOnboardingDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<GameOnboardingDraft>;

    return {
      gameTitle: typeof parsed.gameTitle === 'string' ? parsed.gameTitle : '',
      studioName: typeof parsed.studioName === 'string' ? parsed.studioName : '',
      contactName: typeof parsed.contactName === 'string' ? parsed.contactName : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      websiteUrl: typeof parsed.websiteUrl === 'string' ? parsed.websiteUrl : '',
      storePageUrl: typeof parsed.storePageUrl === 'string' ? parsed.storePageUrl : '',
      trailerUrl: typeof parsed.trailerUrl === 'string' ? parsed.trailerUrl : '',
      officialSocialPlatform:
        parsed.officialSocialPlatform === 'x' || parsed.officialSocialPlatform === 'twitch'
          ? parsed.officialSocialPlatform
          : null,
      officialSocialHandle:
        typeof parsed.officialSocialHandle === 'string' ? parsed.officialSocialHandle : '',
      officialSocialVerified: parsed.officialSocialVerified === true,
      walletLinked: parsed.walletLinked === true,
      walletAddress: typeof parsed.walletAddress === 'string' ? parsed.walletAddress : null,
      questionnaireStarted: parsed.questionnaireStarted === true,
      questionnaireAnswers:
        parsed.questionnaireAnswers !== null &&
        typeof parsed.questionnaireAnswers === 'object' &&
        !Array.isArray(parsed.questionnaireAnswers)
          ? parsed.questionnaireAnswers
          : {},
      createdAtMs: typeof parsed.createdAtMs === 'number' ? parsed.createdAtMs : Date.now(),
      updatedAtMs: typeof parsed.updatedAtMs === 'number' ? parsed.updatedAtMs : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveGameOnboardingDraft(draft: GameOnboardingDraft): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...draft,
      updatedAtMs: Date.now(),
    }),
  );
}

export function clearGameOnboardingDraft(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string): boolean {
  return /^\+?[\d\s().-]{7,}$/.test(value.trim());
}

export function isGameIdentityStepReady(draft: GameOnboardingDraft): boolean {
  return (
    draft.gameTitle.trim().length >= 2 &&
    draft.studioName.trim().length >= 2 &&
    draft.contactName.trim().length >= 2 &&
    isValidEmail(draft.email) &&
    isValidPhone(draft.phone)
  );
}

export function isGameOfficialsStepReady(draft: GameOnboardingDraft): boolean {
  return (
    (draft.officialSocialPlatform === 'x' || draft.officialSocialPlatform === 'twitch') &&
    draft.officialSocialHandle.trim().length >= 2 &&
    draft.officialSocialVerified &&
    draft.walletLinked &&
    draft.walletAddress !== null
  );
}

export function isGameSubmissionReady(draft: GameOnboardingDraft): boolean {
  return isGameIdentityStepReady(draft) && isGameOfficialsStepReady(draft);
}