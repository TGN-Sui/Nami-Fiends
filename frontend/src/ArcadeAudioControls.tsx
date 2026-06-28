import { useId, type CSSProperties, type ReactElement } from 'react';

import {
  setArcadeAudioVolume,
  toggleArcadeAudioMuted,
  useArcadeAudioPreferences,
} from './arcade-audio-store.js';

function ArcadeSpeakerIcon(props: { muted: boolean }): ReactElement {
  if (props.muted) {
    return (
      <svg aria-hidden="true" className="arcade-audio-controls-mute-icon" viewBox="0 0 24 24">
        <path d="M4 9h4l4-4v14l-4-4H4z" />
        <path d="M16 9l4 4M20 9l-4 4" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="arcade-audio-controls-mute-icon" viewBox="0 0 24 24">
      <path d="M4 9h4l4-4v14l-4-4H4z" />
      <path d="M15 8c1.2 1 2 2.4 2 4s-.8 3-2 4" />
      <path d="M18 6c2 1.8 3.2 4.2 3.2 6S20 16.2 18 18" />
    </svg>
  );
}

export function ArcadeAudioControls(): ReactElement {
  const preferences = useArcadeAudioPreferences();
  const volumeInputId = useId();
  const volumePercent = Math.round(preferences.volume * 100);
  const sliderFillPercent = preferences.muted ? 0 : volumePercent;

  return (
    <div className="arcade-audio-controls" role="group" aria-label="Arcade audio">
      <button
        aria-label={preferences.muted ? 'Unmute arcade audio' : 'Mute arcade audio'}
        aria-pressed={preferences.muted}
        className={
          'arcade-audio-controls-mute' + (preferences.muted ? ' is-muted-arcade-audio' : '')
        }
        onClick={() => toggleArcadeAudioMuted()}
        type="button"
      >
        <ArcadeSpeakerIcon muted={preferences.muted} />
      </button>

      <label className="arcade-audio-controls-volume" htmlFor={volumeInputId}>
        <span className="arcade-audio-controls-volume-label">{volumePercent}%</span>
        <input
          aria-label="Arcade audio volume"
          className="arcade-audio-controls-slider"
          id={volumeInputId}
          max={100}
          min={0}
          onChange={(event) => {
            const nextVolume = Number(event.target.value) / 100;
            setArcadeAudioVolume(nextVolume);
          }}
          style={{ '--arcade-audio-fill': sliderFillPercent + '%' } as CSSProperties}
          type="range"
          value={sliderFillPercent}
        />
      </label>
    </div>
  );
}