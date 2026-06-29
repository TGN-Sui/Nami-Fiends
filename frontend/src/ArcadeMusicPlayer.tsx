import { useEffect, useRef, type ReactElement } from 'react';

import {
  readArcadeGameMusicDuckMultiplier,
  useArcadeAudioPreferences,
} from './arcade-audio-store.js';
import { arcadeGameMusicSlotId, ARCADE_LOBBY_MUSIC_SLOT_ID } from './arcade-music.js';
import { resolveArcadeMusicUrl } from './arcade-music-store.js';
import { useChannelOwnerMediaVersion } from './channel-owner-media-store.js';
import { resolveOwnerAssetUrl } from './nami-owner-edit-mode-store.js';
import { useNamiOwnerAssets } from './nami-owner-assets-store.js';

const ARCADE_LOBBY_DUCK_GAIN = 0.22;

type ArcadeMusicPlayerProps = {
  activeGameId: string | null;
  playLobbyMusic: boolean;
  duckLobbyMusic?: boolean;
};

async function playLoop(audio: HTMLAudioElement, url: string): Promise<void> {
  if (audio.dataset.sourceUrl !== url) {
    audio.dataset.sourceUrl = url;
    audio.src = url;
    audio.load();
  }

  audio.loop = true;

  try {
    await audio.play();
  } catch {
    // Browsers may block autoplay until the player interacts with the arcade.
  }
}

function pauseAndReset(audio: HTMLAudioElement): void {
  audio.pause();

  if (audio.src) {
    audio.currentTime = 0;
  }
}

function applyArcadeAudioLevels(
  lobbyAudio: HTMLAudioElement,
  gameAudio: HTMLAudioElement,
  volume: number,
  muted: boolean,
  duckLobbyMusic: boolean,
  duckGameMusicGain: number,
): void {
  lobbyAudio.volume = muted ? 0 : volume * (duckLobbyMusic ? ARCADE_LOBBY_DUCK_GAIN : 1);
  lobbyAudio.muted = muted;
  gameAudio.volume = muted ? 0 : volume * duckGameMusicGain;
  gameAudio.muted = muted;
}

export function ArcadeMusicPlayer(props: ArcadeMusicPlayerProps): ReactElement {
  const audioPreferences = useArcadeAudioPreferences();
  const persistedAssets = useNamiOwnerAssets();
  const mediaVersion = useChannelOwnerMediaVersion();
  const lobbyAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameAudioRef = useRef<HTMLAudioElement | null>(null);

  const lobbyMusicUrl = resolveArcadeMusicUrl(
    resolveOwnerAssetUrl(ARCADE_LOBBY_MUSIC_SLOT_ID, persistedAssets)
  );

  const gameMusicUrl = props.activeGameId
    ? resolveArcadeMusicUrl(
        resolveOwnerAssetUrl(arcadeGameMusicSlotId(props.activeGameId), persistedAssets)
      )
    : null;

  useEffect(() => {
    const lobbyAudio = lobbyAudioRef.current;
    const gameAudio = gameAudioRef.current;

    if (!lobbyAudio || !gameAudio) {
      return;
    }

    applyArcadeAudioLevels(
      lobbyAudio,
      gameAudio,
      audioPreferences.volume,
      audioPreferences.muted,
      Boolean(props.duckLobbyMusic),
      readArcadeGameMusicDuckMultiplier(),
    );

    if (props.activeGameId && gameMusicUrl) {
      pauseAndReset(lobbyAudio);
      void playLoop(gameAudio, gameMusicUrl);
      return;
    }

    pauseAndReset(gameAudio);

    if (props.playLobbyMusic && lobbyMusicUrl) {
      void playLoop(lobbyAudio, lobbyMusicUrl);
      return;
    }

    pauseAndReset(lobbyAudio);
  }, [
    props.activeGameId,
    props.playLobbyMusic,
    lobbyMusicUrl,
    gameMusicUrl,
    mediaVersion,
    audioPreferences.volume,
    audioPreferences.muted,
    props.duckLobbyMusic,
  ]);

  useEffect(() => {
    return () => {
      if (lobbyAudioRef.current) {
        pauseAndReset(lobbyAudioRef.current);
      }

      if (gameAudioRef.current) {
        pauseAndReset(gameAudioRef.current);
      }
    };
  }, []);

  return (
    <>
      <audio aria-hidden="true" preload="auto" ref={lobbyAudioRef} />
      <audio aria-hidden="true" preload="auto" ref={gameAudioRef} />
    </>
  );
}