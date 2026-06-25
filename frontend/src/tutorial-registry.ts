export type TutorialStep = {
  id: string;
  title: string;
  body: string;
  target?: string;
};

export const TUTORIAL_VERSION = 1;

/** Short v1 tour — game world entrance tone; all logged-in users; desktop Hub first. */
export const TUTORIAL_STEPS_V1: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Enter the world',
    body: 'Nami is your portable gamer identity — passport, trust, and community in one realm.',
  },
  {
    id: 'hub',
    title: 'Nami Hub',
    body: 'Start here for global lounges, featured games, and the pulse of the community.',
    target: '[data-tutorial="nami-hub"]',
  },
  {
    id: 'passport',
    title: 'Your passport',
    body: 'Season level resets over time; your account story and badges stay with you.',
    target: '[data-tutorial="passport-card"]',
  },
  {
    id: 'gamehub',
    title: 'Game Hub',
    body: 'Browse genres, bubbles, and game channels — find your next squad or channel.',
    target: '[data-tutorial="game-hub-nav"]',
  },
];