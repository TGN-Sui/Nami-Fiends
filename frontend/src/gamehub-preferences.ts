import type { NamiChannel } from './uiMockData.js';

export const gameHubBrowserFilters = [
  'All',
  'Games',
  'IRL',
  'Music & DJs',
  'Creative',
  'Esports',
  'Verified',
  'PC',
  'Console',
  'Mobile',
] as const;

export type GameHubBrowserFilter = (typeof gameHubBrowserFilters)[number];

export type GameHubInterestModule = {
  id: string;
  label: string;
  kind: 'genre' | 'game' | 'game-genre';
  ref: string;
  filters: GameHubBrowserFilter[];
};

const INTEREST_MODULES_KEY = 'nami.gamehub.interest-modules';
const GENRE_CHAT_COLLAPSED_KEY = 'nami.gamehub.genre-chat-collapsed';
const GENRE_CHAT_PINNED_KEY = 'nami.gamehub.genre-chat-pinned';
const GENRE_CHAT_DOCK_SIZE_KEY = 'nami.gamehub.genre-chat-dock-size';

export type GenreChatDockSize = {
  width: number;
  height: number;
};

const DEFAULT_GENRE_CHAT_DOCK_SIZE: GenreChatDockSize = {
  width: 400,
  height: 680,
};

const defaultInterestModules: GameHubInterestModule[] = [
  {
    id: 'interest-1',
    label: 'Gaming',
    kind: 'genre',
    ref: 'Gaming / Social',
    filters: ['Games', 'PC'],
  },
  {
    id: 'interest-2',
    label: 'Verified',
    kind: 'game-genre',
    ref: 'Verified',
    filters: ['Verified', 'Esports'],
  },
];

function isBrowserFilter(value: unknown): value is GameHubBrowserFilter {
  return typeof value === 'string' && gameHubBrowserFilters.includes(value as GameHubBrowserFilter);
}

export function readGameHubInterestModules(): GameHubInterestModule[] {
  try {
    const savedValue = window.localStorage.getItem(INTEREST_MODULES_KEY);

    if (!savedValue) {
      return defaultInterestModules.map((module) => ({ ...module, filters: [...module.filters] }));
    }

    const parsedValue = JSON.parse(savedValue);

    if (!Array.isArray(parsedValue)) {
      return defaultInterestModules.map((module) => ({ ...module, filters: [...module.filters] }));
    }

    return parsedValue
      .filter((entry): entry is GameHubInterestModule => {
        return (
          typeof entry === 'object' &&
          entry !== null &&
          typeof entry.id === 'string' &&
          typeof entry.label === 'string' &&
          (entry.kind === 'genre' || entry.kind === 'game' || entry.kind === 'game-genre') &&
          typeof entry.ref === 'string' &&
          Array.isArray(entry.filters) &&
          entry.filters.every(isBrowserFilter)
        );
      })
      .map((module) => ({
        ...module,
        filters: [...module.filters],
      }));
  } catch {
    return defaultInterestModules.map((module) => ({ ...module, filters: [...module.filters] }));
  }
}

export function saveGameHubInterestModules(modules: GameHubInterestModule[]): void {
  window.localStorage.setItem(INTEREST_MODULES_KEY, JSON.stringify(modules));
}

export function readGenreChatDockCollapsed(): boolean {
  try {
    const stored = window.localStorage.getItem(GENRE_CHAT_COLLAPSED_KEY);
    if (stored === null) {
      return true;
    }

    return stored === 'true';
  } catch {
    return true;
  }
}

export function saveGenreChatDockCollapsed(collapsed: boolean): void {
  window.localStorage.setItem(GENRE_CHAT_COLLAPSED_KEY, collapsed ? 'true' : 'false');
}

export function readGenreChatDockPinned(): boolean {
  try {
    const stored = window.localStorage.getItem(GENRE_CHAT_PINNED_KEY);

    if (stored === null) {
      return true;
    }

    return stored === 'true';
  } catch {
    return true;
  }
}

export function saveGenreChatDockPinned(pinned: boolean): void {
  window.localStorage.setItem(GENRE_CHAT_PINNED_KEY, pinned ? 'true' : 'false');
}

export function readGenreChatDockSize(): GenreChatDockSize {
  try {
    const stored = window.localStorage.getItem(GENRE_CHAT_DOCK_SIZE_KEY);

    if (!stored) {
      return { ...DEFAULT_GENRE_CHAT_DOCK_SIZE };
    }

    const parsed = JSON.parse(stored) as Partial<GenreChatDockSize>;

    return {
      width:
        typeof parsed.width === 'number' && parsed.width >= 280 && parsed.width <= 720
          ? parsed.width
          : DEFAULT_GENRE_CHAT_DOCK_SIZE.width,
      height:
        typeof parsed.height === 'number' && parsed.height >= 320 && parsed.height <= 900
          ? parsed.height
          : DEFAULT_GENRE_CHAT_DOCK_SIZE.height,
    };
  } catch {
    return { ...DEFAULT_GENRE_CHAT_DOCK_SIZE };
  }
}

export function saveGenreChatDockSize(size: GenreChatDockSize): void {
  window.localStorage.setItem(GENRE_CHAT_DOCK_SIZE_KEY, JSON.stringify(size));
}

export function channelMatchesGameHubFilter(
  channel: NamiChannel,
  filter: GameHubBrowserFilter
): boolean {
  const genre = channel.genre.toLowerCase();
  const platforms = channel.platforms.map((platform) => platform.toLowerCase());

  if (filter === 'All') return true;
  if (filter === 'Games') {
    return (
      genre.includes('gaming') ||
      genre.includes('adventure') ||
      genre.includes('casual') ||
      genre.includes('arcade') ||
      genre.includes('pvp')
    );
  }
  if (filter === 'IRL') return genre.includes('irl');
  if (filter === 'Music & DJs') return genre.includes('music') || genre.includes('dj');
  if (filter === 'Creative') return genre.includes('creative') || genre.includes('builder');
  if (filter === 'Esports') return genre.includes('esports');
  if (filter === 'Verified') return channel.verifiedGame;
  if (filter === 'PC') return platforms.includes('pc');
  if (filter === 'Console') return platforms.includes('console');
  if (filter === 'Mobile') return platforms.includes('mobile');

  return true;
}

export function channelsForModuleFilters(
  allChannels: NamiChannel[],
  filters: GameHubBrowserFilter[]
): NamiChannel[] {
  if (filters.length === 0 || filters.includes('All')) {
    return allChannels;
  }

  return allChannels.filter((channel) => {
    return filters.some((filter) => channelMatchesGameHubFilter(channel, filter));
  });
}