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
  channelId?: string;
};

export const OFFICIAL_NAMI_ARCADE_GAMES: NamiArcadeGame[] = [
  {
    id: 'pulse-runner',
    title: 'Pulse Runner',
    tagline: 'Neon lane dasher built for nightly leaderboard resets.',
    releaseLabel: '1989 cabinet build',
    genre: 'Action / Runner',
    cabinetAccent: '#ff2d95',
    cabinetGlow: 'rgba(255, 45, 149, 0.55)',
    status: 'live',
    highScoreLabel: '1,204,880',
    channelId: 'pebble',
  },
  {
    id: 'alley-breaker',
    title: 'Alley Breaker',
    tagline: 'Brick-busting raid loops with squad combo chains.',
    releaseLabel: '1991 cabinet build',
    genre: 'Arcade / Breakout',
    cabinetAccent: '#00e5ff',
    cabinetGlow: 'rgba(0, 229, 255, 0.5)',
    status: 'live',
    highScoreLabel: '884,120',
  },
  {
    id: 'grid-phantom',
    title: 'Grid Phantom',
    tagline: 'Top-down cyber maze hunts with blackout power-ups.',
    releaseLabel: '1993 cabinet build',
    genre: 'Maze / Shooter',
    cabinetAccent: '#9b5de5',
    cabinetGlow: 'rgba(155, 93, 229, 0.52)',
    status: 'live',
    highScoreLabel: '642,900',
    channelId: 'titangrid',
  },
  {
    id: 'neon-circuit-duel',
    title: 'Neon Circuit Duel',
    tagline: 'Two-player light-cycle arena with ranked rematches.',
    releaseLabel: '1990 cabinet build',
    genre: 'Versus / Racing',
    cabinetAccent: '#43f5a7',
    cabinetGlow: 'rgba(67, 245, 167, 0.48)',
    status: 'live',
    highScoreLabel: 'WIN STREAK 12',
    channelId: 'vortex',
  },
  {
    id: 'coin-cascade',
    title: 'Coin Cascade',
    tagline: 'Official Nami token drop puzzler with jackpot lanes.',
    releaseLabel: '1994 cabinet build',
    genre: 'Puzzle / Economy',
    cabinetAccent: '#ffb347',
    cabinetGlow: 'rgba(255, 179, 71, 0.5)',
    status: 'coming-soon',
    highScoreLabel: 'COMING SOON',
  },
  {
    id: 'goon-raid',
    title: 'Goon Raid',
    tagline: 'Squad cabinet brawler synced to live community raids.',
    releaseLabel: '1992 cabinet build',
    genre: 'Co-op / Brawler',
    cabinetAccent: '#ff3152',
    cabinetGlow: 'rgba(255, 49, 82, 0.52)',
    status: 'live',
    highScoreLabel: 'RAID TIER S',
    channelId: 'fiends',
  },
];

export function readOfficialNamiArcadeGames(): NamiArcadeGame[] {
  return OFFICIAL_NAMI_ARCADE_GAMES;
}