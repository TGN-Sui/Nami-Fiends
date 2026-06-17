export interface QuizQuestion {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
}

export interface QuizArchetype {
  id: number;
  label: string;
  flavorBadge: string;
  summary: string;
}

export const ONBOARDING_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'play_style',
    prompt: 'What best describes how you usually play?',
    options: [
      { id: 'mmo', label: 'MMO / persistent worlds' },
      { id: 'pvp', label: 'Competitive PvP' },
      { id: 'casual', label: 'Casual / cozy sessions' },
      { id: 'solo', label: 'Solo story-driven' },
      { id: 'coop', label: 'Co-op with friends' },
    ],
  },
  {
    id: 'social',
    prompt: 'How social are you in-game?',
    options: [
      { id: 'guild', label: 'Guild-first — I live in communities' },
      { id: 'friends', label: 'Friends-only — small groups' },
      { id: 'public', label: 'Public — I meet new players often' },
      { id: 'solo_social', label: 'Mostly solo, sometimes chat' },
    ],
  },
  {
    id: 'platform',
    prompt: 'Where do you play most often?',
    options: [
      { id: 'pc', label: 'PC (Steam / Epic)' },
      { id: 'console', label: 'Console (Xbox / PlayStation)' },
      { id: 'both', label: 'Both PC and console' },
      { id: 'mobile', label: 'Mobile / cross-platform' },
    ],
  },
];

export const ONBOARDING_ARCHETYPES: QuizArchetype[] = [
  { id: 0, label: 'World Walker', flavorBadge: 'Trailhead Basic', summary: 'MMO explorers and community builders.' },
  { id: 1, label: 'Arena Striker', flavorBadge: 'Contender Basic', summary: 'Competitive players who chase rank.' },
  { id: 2, label: 'Cozy Voyager', flavorBadge: 'Hearth Basic', summary: 'Relaxed sessions and discovery.' },
  { id: 3, label: 'Lone Pathfinder', flavorBadge: 'Solo Basic', summary: 'Story-first adventurers.' },
  { id: 4, label: 'Squad Captain', flavorBadge: 'Crew Basic', summary: 'Co-op leads and party players.' },
  { id: 5, label: 'Guild Herald', flavorBadge: 'Banner Basic', summary: 'Guild-heavy social anchors.' },
];

export function deriveArchetypeFromQuiz(answers: Record<string, string>): QuizArchetype {
  const playStyle = answers.play_style ?? 'casual';
  const social = answers.social ?? 'public';

  if (social === 'guild') {
    return ONBOARDING_ARCHETYPES[5]!;
  }

  if (playStyle === 'mmo') {
    return ONBOARDING_ARCHETYPES[0]!;
  }

  if (playStyle === 'pvp') {
    return ONBOARDING_ARCHETYPES[1]!;
  }

  if (playStyle === 'solo') {
    return ONBOARDING_ARCHETYPES[3]!;
  }

  if (playStyle === 'coop') {
    return ONBOARDING_ARCHETYPES[4]!;
  }

  return ONBOARDING_ARCHETYPES[2]!;
}

export function isQuizComplete(answers: Record<string, string>): boolean {
  return ONBOARDING_QUIZ_QUESTIONS.every((question) => {
    return typeof answers[question.id] === 'string' && answers[question.id] !== '';
  });
}