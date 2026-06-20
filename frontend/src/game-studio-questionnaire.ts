export type GameStudioQuestionnaireOption = {
  id: string;
  label: string;
};

export type GameStudioQuestionnaireQuestion = {
  id: string;
  prompt: string;
  options: GameStudioQuestionnaireOption[];
};

export const GAME_STUDIO_QUESTIONNAIRE_QUESTIONS: GameStudioQuestionnaireQuestion[] = [
  {
    id: 'release_status',
    prompt: 'Current release status',
    options: [
      { id: 'dev', label: 'In development' },
      { id: 'beta', label: 'Beta' },
      { id: 'released', label: 'Released / live' },
    ],
  },
  {
    id: 'team_size',
    prompt: 'Team size',
    options: [
      { id: 'solo', label: 'Solo' },
      { id: 'small', label: '2-5' },
      { id: 'studio', label: '6+' },
    ],
  },
  {
    id: 'integration',
    prompt: 'Sui / wallet integration readiness',
    options: [
      { id: 'ready', label: 'Ready now' },
      { id: 'planning', label: 'Planning' },
      { id: 'later', label: 'Later' },
    ],
  },
];

export function isGameStudioQuestionnaireComplete(answers: Record<string, string>): boolean {
  return GAME_STUDIO_QUESTIONNAIRE_QUESTIONS.every((question) => answers[question.id]);
}