import type { GameStoreUrls } from './game-genres.js';
import { GAME_STORE_LINK_FIELDS } from './game-genres.js';

export type GameTrustScoreTier = 'basic' | 'verified' | 'premium';

export type GameTrustScoreCategory = {
  id: 'identity' | 'gameProof' | 'community' | 'technical';
  label: string;
  points: number;
  maxPoints: number;
};

export type GameTrustScoreBooster = {
  id: string;
  label: string;
  points: number;
  category: GameTrustScoreCategory['id'];
};

export type GameTrustScoreBreakdown = {
  total: number;
  tier: GameTrustScoreTier;
  tierLabel: string;
  categories: GameTrustScoreCategory[];
  boosters: GameTrustScoreBooster[];
  suggestions: string[];
  preapprovalEligible: boolean;
};

export type GameTrustScoreInput = {
  gameTitle: string;
  studioName: string;
  contactName: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneVerified: boolean;
  websiteUrl: string;
  genres: string[];
  steamStoreUrl: string;
  epicStoreUrl: string;
  xboxStoreUrl: string;
  playstationStoreUrl: string;
  otherStoreUrl: string;
  trailerUrl: string;
  officialSocialPlatform: 'x' | 'twitch' | null;
  officialSocialHandle: string;
  officialSocialVerified: boolean;
  walletLinked: boolean;
  walletSource: 'wallet' | 'zklogin' | 'demo' | 'linked' | null;
};

export const GAME_PREAPPROVAL_THRESHOLD = 60;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{7,}$/;

const STORE_TRUST_POINTS: Record<keyof GameStoreUrls, number> = {
  steamStoreUrl: 4,
  epicStoreUrl: 4,
  xboxStoreUrl: 4,
  playstationStoreUrl: 4,
  otherStoreUrl: 3,
};

const STORE_TRUST_CAP = 15;

function clampScore(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

function resolveGameTrustScoreTier(total: number): GameTrustScoreTier {
  if (total >= 71) {
    return 'premium';
  }

  if (total >= 41) {
    return 'verified';
  }

  return 'basic';
}

export function gameTrustScoreTierLabel(tier: GameTrustScoreTier): string {
  if (tier === 'premium') {
    return 'Premium';
  }

  if (tier === 'verified') {
    return 'Verified';
  }

  return 'Basic';
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function countSelectedGenres(genres: string[]): number {
  return genres.map((genre) => genre.trim()).filter((genre) => genre.length > 0).length;
}

function scoreStoreLinks(input: GameTrustScoreInput): {
  points: number;
  boosters: GameTrustScoreBooster[];
} {
  const boosters: GameTrustScoreBooster[] = [];
  let points = 0;

  for (const storeField of GAME_STORE_LINK_FIELDS) {
    const url = input[storeField.key];

    if (!isValidUrl(url)) {
      continue;
    }

    const storePoints = Math.min(
      STORE_TRUST_POINTS[storeField.key],
      STORE_TRUST_CAP - points,
    );

    if (storePoints <= 0) {
      break;
    }

    points += storePoints;
    boosters.push({
      id: storeField.key,
      label: storeField.label + ' linked',
      points: storePoints,
      category: 'gameProof',
    });
  }

  return { points, boosters };
}

export function computeGameTrustScore(input: GameTrustScoreInput): GameTrustScoreBreakdown {
  const boosters: GameTrustScoreBooster[] = [];
  const suggestions: string[] = [];

  let identity = 0;
  let gameProof = 0;
  let community = 0;
  let technical = 0;

  if (input.gameTitle.trim().length >= 2) {
    identity += 6;
    boosters.push({
      id: 'game-title',
      label: 'Game title on file',
      points: 6,
      category: 'identity',
    });
  }

  if (input.studioName.trim().length >= 2) {
    identity += 8;
    boosters.push({
      id: 'studio-name',
      label: 'Studio / publisher name provided',
      points: 8,
      category: 'identity',
    });
  }

  if (input.contactName.trim().length >= 2) {
    identity += 6;
    boosters.push({
      id: 'contact-name',
      label: 'Primary contact identified',
      points: 6,
      category: 'identity',
    });
  }

  if (EMAIL_PATTERN.test(input.email.trim()) && input.emailVerified) {
    identity += 8;
    boosters.push({
      id: 'business-email',
      label: 'Verified business email on file',
      points: 8,
      category: 'identity',
    });
  } else if (input.email.trim() !== '') {
    suggestions.push('Verify your business email for up to +8 Trust Score.');
  } else {
    suggestions.push('Add and verify a business email for up to +8 Trust Score.');
  }

  if (PHONE_PATTERN.test(input.phone.trim()) && input.phoneVerified) {
    identity += 6;
    boosters.push({
      id: 'phone',
      label: 'Phone number verified on file',
      points: 6,
      category: 'identity',
    });
  } else if (input.phone.trim() !== '') {
    suggestions.push('Verify your phone number for recovery and +6 Trust Score.');
  } else {
    suggestions.push('Add and verify a phone number for recovery and +6 Trust Score.');
  }

  if (isValidUrl(input.websiteUrl)) {
    identity += 6;
    boosters.push({
      id: 'website',
      label: 'Official website linked',
      points: 6,
      category: 'identity',
    });
  }

  identity = clampScore(identity, 40);

  if (countSelectedGenres(input.genres) > 0) {
    gameProof += 5;
    boosters.push({
      id: 'genres',
      label: 'Game genre(s) selected',
      points: 5,
      category: 'gameProof',
    });
  } else {
    suggestions.push('Select at least one game genre for up to +5 Trust Score.');
  }

  const storeScore = scoreStoreLinks(input);
  gameProof += storeScore.points;
  boosters.push(...storeScore.boosters);

  if (storeScore.points === 0) {
    suggestions.push(
      'Link Steam, Epic, Xbox, PlayStation, or another store page for up to +15 Trust Score.',
    );
  }

  if (isValidUrl(input.trailerUrl)) {
    gameProof += 10;
    boosters.push({
      id: 'trailer',
      label: 'Trailer or gameplay video linked',
      points: 10,
      category: 'gameProof',
    });
  }

  gameProof = clampScore(gameProof, 30);

  if (input.officialSocialVerified && input.officialSocialHandle.trim().length >= 2) {
    const platformLabel = input.officialSocialPlatform === 'twitch' ? 'Twitch' : 'X';
    community += 14;
    boosters.push({
      id: 'official-social',
      label: 'Authorized official ' + platformLabel + ' account',
      points: 14,
      category: 'community',
    });
  } else if (input.officialSocialHandle.trim().length >= 2) {
    suggestions.push('Authorize your official X or Twitch account for up to +14 Trust Score.');
  } else {
    suggestions.push('Link an official X or Twitch account to prove game ownership.');
  }

  community = clampScore(community, 20);

  if (input.walletLinked && input.walletSource === 'zklogin') {
    technical += 8;
    boosters.push({
      id: 'zklogin-wallet',
      label: 'zkLogin wallet linked',
      points: 8,
      category: 'technical',
    });
  } else if (input.walletLinked) {
    technical += 5;
    boosters.push({
      id: 'wallet-linked',
      label: 'Wallet linked',
      points: 5,
      category: 'technical',
    });
  } else {
    suggestions.push('Connect zkLogin to link a wallet for up to +8 Trust Score.');
  }

  if (input.officialSocialVerified) {
    technical += 2;
    boosters.push({
      id: 'social-authorization',
      label: 'Official social authorization complete',
      points: 2,
      category: 'technical',
    });
  }

  technical = clampScore(technical, 10);

  const total = clampScore(identity + gameProof + community + technical, 100);
  const tier = resolveGameTrustScoreTier(total);

  return {
    total,
    tier,
    tierLabel: gameTrustScoreTierLabel(tier),
    categories: [
      { id: 'identity', label: 'Identity & Legitimacy', points: identity, maxPoints: 40 },
      { id: 'gameProof', label: 'Game Proof & Publication', points: gameProof, maxPoints: 30 },
      { id: 'community', label: 'Community & Validation', points: community, maxPoints: 20 },
      { id: 'technical', label: 'Technical & Integration', points: technical, maxPoints: 10 },
    ],
    boosters,
    suggestions: suggestions.slice(0, 4),
    preapprovalEligible: total >= GAME_PREAPPROVAL_THRESHOLD,
  };
}

export function computeGameTrustScoreFromDraft(input: {
  gameTitle: string;
  studioName: string;
  contactName: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneVerified: boolean;
  websiteUrl: string;
  genres: string[];
  steamStoreUrl: string;
  epicStoreUrl: string;
  xboxStoreUrl: string;
  playstationStoreUrl: string;
  otherStoreUrl: string;
  trailerUrl: string;
  officialSocialPlatform: 'x' | 'twitch' | null;
  officialSocialHandle: string;
  officialSocialVerified: boolean;
  walletLinked: boolean;
  walletSource: 'wallet' | 'zklogin' | 'demo' | 'linked' | null;
}): GameTrustScoreBreakdown {
  return computeGameTrustScore(input);
}