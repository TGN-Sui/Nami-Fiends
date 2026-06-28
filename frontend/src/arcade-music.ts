import { OFFICIAL_ARCADE_CABINETS } from './arcade-cabinets.js';

export const ARCADE_LOBBY_MUSIC_SLOT_ID = 'arcade-lobby-music';
export const ARCADE_GAME_MUSIC_SLOT_PREFIX = 'arcade-game-music-';

export const ARCADE_LOBBY_MUSIC_SPEC = {
  slotId: ARCADE_LOBBY_MUSIC_SLOT_ID,
  label: 'Arcade lobby music',
  hint:
    'MP3 loop for the title screen and cabinet picker. Ducks during walk-up intros and pauses when a run starts.',
};

export function arcadeGameMusicSlotId(gameId: string): string {
  return ARCADE_GAME_MUSIC_SLOT_PREFIX + gameId;
}

export const ARCADE_GAME_MUSIC_SPECS = OFFICIAL_ARCADE_CABINETS.filter(
  (cabinet) => cabinet.gameId,
).map((cabinet) => ({
  gameId: cabinet.gameId!,
  slotId: arcadeGameMusicSlotId(cabinet.gameId!),
  label: cabinet.title + ' game music',
  hint: 'MP3 loop for ' + cabinet.title + ' gameplay. Replaces lobby music during an active run.',
}));

export function isArcadeMusicSlotId(slotId: string): boolean {
  return slotId === ARCADE_LOBBY_MUSIC_SLOT_ID || slotId.startsWith(ARCADE_GAME_MUSIC_SLOT_PREFIX);
}