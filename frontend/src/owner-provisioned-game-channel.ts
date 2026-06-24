import { withChannelOwnerProfile } from './channel-owner-profile-store.js';
import type { GameOwnerSession } from './game-owner-session-store.js';
import type { OwnerProvisionedChannel } from './owner-provisioned-channels-store.js';
import type { NamiChannel } from './uiMockData.js';

export function buildOwnerProvisionedGameChannel(
  channel: OwnerProvisionedChannel,
  session?: GameOwnerSession | null
): NamiChannel {
  const gameTitle = session?.gameTitle.trim() || channel.gameTitle;
  const studioName =
    session?.studioName.trim() || session?.contactName.trim() || 'Claimed Studio';

  const namiChannel: NamiChannel = {
    id: channel.channelId,
    surfaceType: 'game',
    name: gameTitle,
    handle: channel.handle,
    owner: studioName,
    developerId: session ? 'claimed-' + session.ticketId : 'owner-' + channel.id,
    developerName: studioName,
    developerLogoSeed: gameTitle.slice(0, 2).toUpperCase() || 'OG',
    coverArtSeed: gameTitle.slice(0, 2).toUpperCase() || 'OG',
    coverArtStyle: 'neon',
    verifiedGame: channel.status === 'claimed',
    genre: session?.genre || channel.genre,
    platforms: [...(session?.platforms.length ? session.platforms : channel.platforms)],
    subscribers: 0,
    verified: channel.status === 'claimed',
    partner: false,
    signal: 'Green',
    tagline: session?.tagline || channel.tagline,
    banner: session?.tagline || channel.tagline,
    theme: 'owner-provisioned-game',
    modules: [
      { label: 'About', description: 'Owner-provisioned channel overview' },
      { label: 'Events', description: 'Official event board' },
      { label: 'Owner', description: 'Owner tools' },
    ],
    officialBadges:
      channel.status === 'claimed'
        ? ['Claimed']
        : channel.status === 'transfer-pending'
          ? ['Owner-Provisioned', 'Invite pending']
          : ['Owner-Provisioned', 'Claimable'],
    customBadges: [],
    verifiedLinks: [],
    announcements: [],
  };

  return withChannelOwnerProfile(namiChannel);
}