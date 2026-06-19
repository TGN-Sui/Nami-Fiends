import type { GameOwnerSession } from './game-owner-session-store.js';
import type { NamiChannel } from './uiMockData.js';

export function buildProvisionalGameChannel(session: GameOwnerSession): NamiChannel {
  const handle = session.gameTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20);

  return {
    id: session.provisionalChannelId,
    surfaceType: 'game',
    name: session.gameTitle.trim() || 'Pending Game',
    handle: handle || 'pendinggame',
    owner: session.studioName.trim() || session.contactName.trim() || 'Pending Studio',
    developerId: 'pending-' + session.ticketId,
    developerName: session.studioName.trim() || 'Pending Studio',
    developerLogoSeed: session.gameTitle.slice(0, 2).toUpperCase() || 'PG',
    coverArtSeed: session.gameTitle.slice(0, 2).toUpperCase() || 'PG',
    coverArtStyle: 'neon',
    verifiedGame: false,
    genre: session.genre || 'Indie',
    platforms: ['PC'],
    subscribers: 0,
    verified: false,
    partner: false,
    signal: 'Green',
    tagline: session.tagline,
    banner: session.tagline,
    theme: 'pending-game',
    modules: [
      { label: 'About', description: 'Pre-approval channel overview' },
      { label: 'Events', description: 'Official event board' },
      { label: 'Owner', description: 'Owner tools' },
    ],
    officialBadges: ['Pre-Approved'],
    customBadges: [],
    verifiedLinks: [],
    announcements: [],
  };
}