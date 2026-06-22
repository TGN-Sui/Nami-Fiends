import { contactFieldBlocksContinue } from './contact-code-verification-store.js';
import { createEmptyGameStoreUrls } from './game-genres.js';
import { normalizeSupportedPlatforms } from './platform-genre-options.js';

const STORAGE_KEY = 'nami.game.onboarding.draft';

export type GameOfficialSocialPlatform = 'x' | 'twitch';

export type GameOnboardingAct = 'identity' | 'officials' | 'proof' | 'review' | 'questionnaire';

export interface GameOnboardingDraft {
  gameTitle: string;
  studioName: string;
  contactName: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneVerified: boolean;
  websiteUrl: string;
  genres: string[];
  platforms: string[];
  steamStoreUrl: string;
  epicStoreUrl: string;
  xboxStoreUrl: string;
  playstationStoreUrl: string;
  otherStoreUrl: string;
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
  const emptyStoreUrls = createEmptyGameStoreUrls();

  return {
    gameTitle: '',
    studioName: '',
    contactName: '',
    email: '',
    emailVerified: false,
    phone: '',
    phoneVerified: false,
    websiteUrl: '',
    genres: [],
    platforms: [],
    ...emptyStoreUrls,
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

function migrateLegacyStorePageUrl(parsed: Partial<GameOnboardingDraft & { storePageUrl?: string }>): {
  steamStoreUrl: string;
  epicStoreUrl: string;
  xboxStoreUrl: string;
  playstationStoreUrl: string;
  otherStoreUrl: string;
} {
  const emptyStoreUrls = createEmptyGameStoreUrls();

  if (typeof parsed.steamStoreUrl === 'string') {
    emptyStoreUrls.steamStoreUrl = parsed.steamStoreUrl;
  }

  if (typeof parsed.epicStoreUrl === 'string') {
    emptyStoreUrls.epicStoreUrl = parsed.epicStoreUrl;
  }

  if (typeof parsed.xboxStoreUrl === 'string') {
    emptyStoreUrls.xboxStoreUrl = parsed.xboxStoreUrl;
  }

  if (typeof parsed.playstationStoreUrl === 'string') {
    emptyStoreUrls.playstationStoreUrl = parsed.playstationStoreUrl;
  }

  if (typeof parsed.otherStoreUrl === 'string') {
    emptyStoreUrls.otherStoreUrl = parsed.otherStoreUrl;
  }

  if (
    emptyStoreUrls.steamStoreUrl === '' &&
    typeof parsed.storePageUrl === 'string' &&
    parsed.storePageUrl.trim() !== ''
  ) {
    emptyStoreUrls.steamStoreUrl = parsed.storePageUrl;
  }

  return emptyStoreUrls;
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

    const parsed = JSON.parse(stored) as Partial<GameOnboardingDraft & { storePageUrl?: string }>;
    const storeUrls = migrateLegacyStorePageUrl(parsed);

    return {
      gameTitle: typeof parsed.gameTitle === 'string' ? parsed.gameTitle : '',
      studioName: typeof parsed.studioName === 'string' ? parsed.studioName : '',
      contactName: typeof parsed.contactName === 'string' ? parsed.contactName : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      emailVerified: parsed.emailVerified === true,
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      phoneVerified: parsed.phoneVerified === true,
      websiteUrl: typeof parsed.websiteUrl === 'string' ? parsed.websiteUrl : '',
      genres: Array.isArray(parsed.genres)
        ? parsed.genres.filter((genre): genre is string => typeof genre === 'string')
        : [],
      platforms: Array.isArray(parsed.platforms)
        ? normalizeSupportedPlatforms(
            parsed.platforms.filter((platform): platform is string => typeof platform === 'string')
          )
        : [],
      ...storeUrls,
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
  const baseReady =
    draft.gameTitle.trim().length >= 2 &&
    draft.studioName.trim().length >= 2 &&
    draft.contactName.trim().length >= 2;

  if (!baseReady) {
    return false;
  }

  if (contactFieldBlocksContinue(draft.email, draft.emailVerified)) {
    return false;
  }

  if (contactFieldBlocksContinue(draft.phone, draft.phoneVerified)) {
    return false;
  }

  if (draft.email.trim() !== '' && draft.emailVerified && !isValidEmail(draft.email)) {
    return false;
  }

  if (draft.phone.trim() !== '' && draft.phoneVerified && !isValidPhone(draft.phone)) {
    return false;
  }

  return true;
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