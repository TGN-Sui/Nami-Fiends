import { channels } from './uiMockData.js';
import { readChannelCustomEmojis, type ChannelCustomEmoji } from './channel-custom-emojis-store.js';

const CHANNEL_GENRE_LOUNGE_LINKS: Record<string, string[]> = {
  'Builder / Creative': ['Indie', 'Puzzle', 'Simulator'],
  'Sandbox / Builder': ['Indie', 'Puzzle', 'Simulator'],
  'FPS / Shooter': ['Shooter', 'Tactical'],
  'Racing / Arcade': ['Racing', 'Arcade'],
  'MOBA / Strategy': ['MOBA', 'Strategy'],
};

function normalizeGenreText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function channelGenreMatchesLounge(channelGenre: string, loungeTitle: string): boolean {
  const channelNormalized = normalizeGenreText(channelGenre);
  const loungeNormalized = normalizeGenreText(loungeTitle);

  if (!channelNormalized || !loungeNormalized) {
    return false;
  }

  if (channelNormalized.includes(loungeNormalized) || loungeNormalized.includes(channelNormalized)) {
    return true;
  }

  const linkedLounges = CHANNEL_GENRE_LOUNGE_LINKS[channelGenre] ?? [];

  if (linkedLounges.some((title) => normalizeGenreText(title) === loungeNormalized)) {
    return true;
  }

  const channelTokens = channelNormalized.split(/\s+/).filter((token) => token.length >= 4);

  return channelTokens.some((token) => loungeNormalized.includes(token));
}

export function readChannelEmojisForGenreLounge(loungeTitle: string): ChannelCustomEmoji[] {
  const emojis: ChannelCustomEmoji[] = [];

  for (const channel of channels) {
    if (!channelGenreMatchesLounge(channel.genre, loungeTitle)) {
      continue;
    }

    emojis.push(...readChannelCustomEmojis(channel.id));
  }

  return emojis;
}