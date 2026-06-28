import { ARCADE_BUBBLE_GAME_ID } from './arcade-bubble-game.js';

export const ARCADE_LOBBY_MUSIC_SLOT_ID = 'arcade-lobby-music';
export const ARCADE_GAME_MUSIC_SLOT_PREFIX = 'arcade-game-music-';

export const ARCADE_LOBBY_MUSIC_SPEC = {
  slotId: ARCADE_LOBBY_MUSIC_SLOT_ID,
  label: 'Arcade lobby music',
  hint:
    'MP3 loop for the title screen and cabinet game select. Pauses when a run starts and resumes when players return to game selection.',
};

export function arcadeGameMusicSlotId(gameId: string): string {
  return ARCADE_GAME_MUSIC_SLOT_PREFIX + gameId;
}

export const ARCADE_GAME_MUSIC_SPECS: Array<{ gameId: string; slotId: string; label: string; hint: string }> =
  [
    {
      gameId: ARCADE_BUBBLE_GAME_ID,
      slotId: arcadeGameMusicSlotId(ARCADE_BUBBLE_GAME_ID),
      label: 'Bubble Pop game music',
      hint: 'MP3 loop for Nami Bubble Pop gameplay. Replaces lobby music during an active run.',
    },
  ];

export function isArcadeMusicSlotId(slotId: string): boolean {
  return slotId === ARCADE_LOBBY_MUSIC_SLOT_ID || slotId.startsWith(ARCADE_GAME_MUSIC_SLOT_PREFIX);
}