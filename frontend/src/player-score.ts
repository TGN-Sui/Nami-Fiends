import { isTestLaunchMode } from './app-config.js';
import { isQuizComplete } from './onboarding-quiz.js';

export type PlayerScoreTier = 'basic' | 'verified' | 'premium';

export type PlayerScoreCategory = {
  id: 'identity' | 'gameProof' | 'community' | 'technical';
  label: string;
  points: number;
  maxPoints: number;
};

export type PlayerScoreBooster = {
  id: string;
  label: string;
  points: number;
  category: PlayerScoreCategory['id'];
};

export type PlayerScoreBreakdown = {
  total: number;
  tier: PlayerScoreTier;
  tierLabel: string;
  categories: PlayerScoreCategory[];
  boosters: PlayerScoreBooster[];
  suggestions: string[];
};

export type PlayerScoreInput = {
  displayName: string;
  email: string;
  quizAnswers: Record<string, string>;
  linkedPlatforms: string[];
  /** Platforms that passed OAuth/API eligibility checks. Defaults to linkedPlatforms. */
  scoreEligiblePlatforms?: string[];
  xVerified: boolean;
  walletLinked: boolean;
  walletSource: 'wallet' | 'zklogin' | 'demo' | null;
  claimApproved: boolean;
  hasOnChainPassport: boolean;
  moderationClear: boolean;
  guildStandingVerified: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clampScore(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

function resolvePlayerScoreTier(total: number): PlayerScoreTier {
  if (total >= 71) {
    return 'premium';
  }

  if (total >= 41) {
    return 'verified';
  }

  return 'basic';
}

export function playerScoreTierLabel(tier: PlayerScoreTier): string {
  if (tier === 'premium') {
    return 'Premium';
  }

  if (tier === 'verified') {
    return 'Verified';
  }

  return 'Basic';
}

export function computePlayerScore(input: PlayerScoreInput): PlayerScoreBreakdown {
  const boosters: PlayerScoreBooster[] = [];
  const suggestions: string[] = [];

  let identity = 0;
  let gameProof = 0;
  let community = 0;
  let technical = 0;

  const displayName = input.displayName.trim();
  const email = input.email.trim().toLowerCase();
  const quizComplete = isQuizComplete(input.quizAnswers);
  const quizAnswerCount = Object.keys(input.quizAnswers).length;

  if (displayName.length >= 2) {
    identity += 5;
    boosters.push({
      id: 'display-name',
      label: 'Display name on file',
      points: 5,
      category: 'identity',
    });
  } else {
    suggestions.push('Add a display name for +5 Player Score.');
  }

  if (EMAIL_PATTERN.test(email)) {
    identity += 8;
    boosters.push({
      id: 'email',
      label: 'Verified contact email',
      points: 8,
      category: 'identity',
    });
  } else {
    suggestions.push('Add a valid email for +8 Player Score.');
  }

  if (input.walletLinked && input.walletSource === 'wallet') {
    identity += 12;
    boosters.push({
      id: 'wallet',
      label: 'Sui wallet connected',
      points: 12,
      category: 'identity',
    });
  } else if (input.walletLinked && input.walletSource === 'zklogin') {
    identity += 10;
    boosters.push({
      id: 'zklogin',
      label: 'zkLogin identity connected',
      points: 10,
      category: 'identity',
    });
  } else if (input.walletLinked && input.walletSource === 'demo' && !isTestLaunchMode()) {
    identity += 4;
    boosters.push({
      id: 'demo-wallet',
      label: 'Demo wallet connected',
      points: 4,
      category: 'identity',
    });
  } else {
    suggestions.push('Link a Sui account from Settings for up to +12 Player Score.');
  }

  if (input.xVerified) {
    identity += 8;
    boosters.push({
      id: 'x-profile',
      label: 'Verified X profile linked',
      points: 8,
      category: 'identity',
    });
  } else {
    suggestions.push('Authorize your X account for +8 Player Score.');
  }

  if (input.claimApproved || input.hasOnChainPassport) {
    identity += 5;
    boosters.push({
      id: 'passport-claim',
      label: 'On-chain passport claim approved',
      points: 5,
      category: 'identity',
    });
  }

  identity = clampScore(identity, 40);

  const platformWeights: Record<string, number> = {
    steam: 12,
    epic: 10,
    xbox: 8,
    playstation: 8,
    riot: 7,
    nintendo: 6,
    itch: 6,
    discord: 5,
  };

  const scorePlatforms =
    input.scoreEligiblePlatforms ?? input.linkedPlatforms;

  for (const platformId of scorePlatforms) {
    const points = platformWeights[platformId] ?? 5;

    gameProof += points;
    boosters.push({
      id: 'platform-' + platformId,
      label: platformId.charAt(0).toUpperCase() + platformId.slice(1) + ' linked',
      points,
      category: 'gameProof',
    });
  }

  if (scorePlatforms.length >= 2) {
    gameProof += 4;
    boosters.push({
      id: 'multi-platform',
      label: 'Multiple score-eligible platforms linked',
      points: 4,
      category: 'gameProof',
    });
  }

  if (scorePlatforms.includes('steam')) {
    gameProof += 4;
    boosters.push({
      id: 'steam-library',
      label: 'Steam library sync ready',
      points: 4,
      category: 'gameProof',
    });
  }

  if (gameProof === 0) {
    if (input.linkedPlatforms.length > 0 && scorePlatforms.length === 0) {
      suggestions.push(
        'Platform links are pending API verification — new accounts cannot raise Player Score until history is confirmed.'
      );
    } else {
      suggestions.push('Link and verify Steam or Epic in Settings for up to +12 Player Score.');
    }
  }

  gameProof = clampScore(gameProof, 30);

  if (quizComplete) {
    community += 6;
    boosters.push({
      id: 'quiz-complete',
      label: 'Gamer quiz completed',
      points: 6,
      category: 'community',
    });
  }

  if (quizAnswerCount >= 3) {
    community += 4;
    boosters.push({
      id: 'quiz-depth',
      label: 'Full play-style profile captured',
      points: 4,
      category: 'community',
    });
  }

  if (input.guildStandingVerified) {
    community += 6;
    boosters.push({
      id: 'guild-standing',
      label: 'Guild standing in good order',
      points: 6,
      category: 'community',
    });
  }

  if (scorePlatforms.length > 0 || input.xVerified) {
    community += 2;
    boosters.push({
      id: 'social-proof',
      label: 'Verified external gamer identity linked',
      points: 2,
      category: 'community',
    });
  }

  community = clampScore(community, 20);

  if (quizComplete) {
    technical += 4;
    boosters.push({
      id: 'quiz-reflection',
      label: 'Thoughtful gamer quiz responses',
      points: 4,
      category: 'technical',
    });
  }

  if (scorePlatforms.length > 0) {
    technical += 3;
    boosters.push({
      id: 'platform-consent',
      label: 'Verified platform read permissions granted',
      points: 3,
      category: 'technical',
    });
  }

  if (input.moderationClear) {
    technical += 3;
    boosters.push({
      id: 'moderation-clear',
      label: 'Clear moderation standing',
      points: 3,
      category: 'technical',
    });
  }

  technical = clampScore(technical, 10);

  const total = clampScore(identity + gameProof + community + technical, 100);
  const tier = resolvePlayerScoreTier(total);

  return {
    total,
    tier,
    tierLabel: playerScoreTierLabel(tier),
    categories: [
      { id: 'identity', label: 'Identity & Legitimacy', points: identity, maxPoints: 40 },
      { id: 'gameProof', label: 'Game Proof & Library', points: gameProof, maxPoints: 30 },
      { id: 'community', label: 'Community & History', points: community, maxPoints: 20 },
      { id: 'technical', label: 'Profile & Platform Readiness', points: technical, maxPoints: 10 },
    ],
    boosters,
    suggestions: suggestions.slice(0, 4),
  };
}

export function computePlayerScoreFromDraft(input: {
  displayName: string;
  email: string;
  quizAnswers: Record<string, string>;
  socialXVerified?: boolean;
  socialTwitchVerified?: boolean;
  optionalPlatformLinks?: string[];
}): PlayerScoreBreakdown {
  const linkedPlatforms = [...(input.optionalPlatformLinks ?? [])];

  if (input.socialTwitchVerified) {
    linkedPlatforms.push('twitch');
  }

  return computePlayerScore({
    displayName: input.displayName,
    email: input.email,
    quizAnswers: input.quizAnswers,
    linkedPlatforms,
    xVerified: input.socialXVerified === true,
    walletLinked: false,
    walletSource: null,
    claimApproved: false,
    hasOnChainPassport: false,
    moderationClear: true,
    guildStandingVerified: false,
  });
}

