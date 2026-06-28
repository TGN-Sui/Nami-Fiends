import { describe, expect, it } from 'vitest';

import {
  ARCADE_LOBBY_MUSIC_SLOT_ID,
  arcadeGameMusicSlotId,
  isArcadeMusicSlotId,
} from './arcade-music.js';
import { ARCADE_BUBBLE_GAME_ID } from './arcade-bubble-game.js';
import {
  validateArcadeMusicFile,
  resolveArcadeMusicUrl,
  isArcadeMusicMediaRef,
} from './arcade-music-store.js';
import { toChannelMediaRef } from './channel-owner-media-store.js';

describe('arcade-music', () => {
  it('exposes lobby and per-game music slot ids', () => {
    expect(ARCADE_LOBBY_MUSIC_SLOT_ID).toBe('arcade-lobby-music');
    expect(arcadeGameMusicSlotId(ARCADE_BUBBLE_GAME_ID)).toBe(
      'arcade-game-music-nami-bubble-pop'
    );
    expect(isArcadeMusicSlotId('arcade-lobby-music')).toBe(true);
    expect(isArcadeMusicSlotId('arcade-game-music-nami-bubble-pop')).toBe(true);
    expect(isArcadeMusicSlotId('arcade-background')).toBe(false);
  });

  it('validates mp3 uploads', () => {
    const file = new File([new Uint8Array(1024)], 'lobby.mp3', { type: 'audio/mpeg' });

    expect(validateArcadeMusicFile(file)).toBeNull();
  });

  it('rejects non-mp3 uploads', () => {
    const file = new File([new Uint8Array(1024)], 'lobby.wav', { type: 'audio/wav' });

    expect(validateArcadeMusicFile(file)).toContain('MP3');
  });

  it('recognizes channel-media refs for arcade music', () => {
    const ref = toChannelMediaRef('nami.owner.arcade-lobby-music');

    expect(isArcadeMusicMediaRef(ref)).toBe(true);
    expect(resolveArcadeMusicUrl(ref)).toBeNull();
  });
});