import { ARCADE_BUBBLE_GAME_ID } from './arcade-bubble-game.js';
import { readArcadeBubbleHighScore } from './arcade-bubble-game-store.js';

export type NamiArcadeGameStatus = 'live' | 'coming-soon';

export type NamiArcadeGame = {
  id: string;
  title: string;
  tagline: string;
  releaseLabel: string;
  genre: string;
  cabinetAccent: string;
  cabinetGlow: string;
  status: NamiArcadeGameStatus;
  highScoreLabel: string;
};

export const OFFICIAL_NAMI_ARCADE_GAMES: NamiArcadeGame[] = [
  {
    id: ARCADE_BUBBLE_GAME_ID,
    title: 'Nami Bubble Pop',
    tagline: 'Rise-and-pop bubble rush with normal and hard leaderboards.',
    releaseLabel: 'Official cabinet · 60 second run',
    genre: 'Action / Arcade',
    cabinetAccent: '#75d7ff',
    cabinetGlow: 'rgba(117, 215, 255, 0.52)',
    status: 'live',
    highScoreLabel: '0',
  },
];

export function formatArcadeHighScore(score: number): string {
  return score > 0 ? score.toLocaleString() : '—';
}

export function readOfficialNamiArcadeGames(): NamiArcadeGame[] {
  const normalHigh = readArcadeBubbleHighScore('normal');
  const hardHigh = readArcadeBubbleHighScore('hard');

  return OFFICIAL_NAMI_ARCADE_GAMES.map((game) => {
    if (game.id !== ARCADE_BUBBLE_GAME_ID) {
      return game;
    }

    return {
      ...game,
      highScoreLabel:
        'N ' + formatArcadeHighScore(normalHigh) + ' · H ' + formatArcadeHighScore(hardHigh),
    };
  });
}