import { readArcadeCabinetsForMember } from './arcade-cabinets.js';
import { getSelfMember } from './member-access.js';

export type NamiArcadeGameStatus = 'live' | 'coming-soon';

export type NamiArcadeGame = {
  id: string;
  cabinetId: string;
  title: string;
  tagline: string;
  releaseLabel: string;
  genre: string;
  cabinetAccent: string;
  cabinetGlow: string;
  status: NamiArcadeGameStatus;
  highScoreLabel: string;
};

export function formatArcadeHighScore(score: number): string {
  return score > 0 ? score.toLocaleString() : '—';
}

export function readOfficialNamiArcadeGames(): NamiArcadeGame[] {
  const member = getSelfMember();

  return readArcadeCabinetsForMember(member)
    .filter((cabinet) => cabinet.gameId)
    .map((cabinet) => ({
      id: cabinet.gameId!,
      cabinetId: cabinet.id,
      title: cabinet.title,
      tagline: cabinet.tagline,
      releaseLabel: cabinet.releaseLabel,
      genre: cabinet.genre,
      cabinetAccent: cabinet.cabinetAccent,
      cabinetGlow: cabinet.cabinetGlow,
      status: cabinet.access === 'live' ? 'live' : 'coming-soon',
      highScoreLabel: cabinet.highScoreLabel,
    }));
}