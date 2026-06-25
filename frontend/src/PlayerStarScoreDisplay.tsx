import type { ReactElement } from 'react';

import { resolvePlayerStarDisplay } from './player-star-display.js';

export function PlayerStarScoreDisplay(props: {
  score: number | null | undefined;
  compact?: boolean;
  showScore?: boolean;
}): ReactElement | null {
  if (props.score === null || props.score === undefined) {
    return null;
  }

  const display = resolvePlayerStarDisplay(props.score);

  return (
    <div
      aria-label={display.label + ' (' + display.score + ' player score)'}
      className={
        'player-star-score-display' +
        (props.compact ? ' is-compact-player-star' : '') +
        (display.isFoil ? ' is-foil-player-star' : '')
      }
      role="img"
      title={display.label}
    >
      <div className="player-star-score-track" aria-hidden="true">
        {Array.from({ length: display.totalStars }, (_, index) => {
          const filled = index < display.filledStars;

          return (
            <span
              className={
                'player-star-score-star' +
                (filled ? ' is-filled' : '') +
                (filled && display.isFoil ? ' is-foil-star' : '')
              }
              key={index}
            >
              ★
            </span>
          );
        })}
      </div>
      {props.showScore !== false && !props.compact ? (
        <span className="player-star-score-value">{display.score}</span>
      ) : null}
    </div>
  );
}