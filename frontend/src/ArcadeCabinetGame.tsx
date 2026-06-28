import type { ReactElement } from 'react';

import { ArcadeAlleyPushGame, type ArcadeAlleyPushGameSummary } from './ArcadeAlleyPushGame.js';
import { ArcadeBubbleGame, type ArcadeBubbleGameSummary } from './ArcadeBubbleGame.js';
import { ARCADE_ALLEY_PUSH_GAME_ID, type ArcadeAlleyPushMode } from './arcade-alley-push-game.js';
import { ARCADE_BUBBLE_GAME_ID, type ArcadeBubbleMode } from './arcade-bubble-game.js';

type ArcadeCabinetGameProps = {
  gameId: string;
  mode: ArcadeBubbleMode | ArcadeAlleyPushMode;
  cabinetAccent: string;
  cabinetGlow: string;
  onComplete: (summary: ArcadeBubbleGameSummary | ArcadeAlleyPushGameSummary) => void;
  onForfeit?: () => void;
};

export function ArcadeCabinetGame(props: ArcadeCabinetGameProps): ReactElement {
  if (props.gameId === ARCADE_BUBBLE_GAME_ID) {
    return (
      <ArcadeBubbleGame
        cabinetAccent={props.cabinetAccent}
        cabinetGlow={props.cabinetGlow}
        mode={props.mode as ArcadeBubbleMode}
        onComplete={props.onComplete}
        {...(props.onForfeit ? { onForfeit: props.onForfeit } : {})}
      />
    );
  }

  if (props.gameId === ARCADE_ALLEY_PUSH_GAME_ID) {
    return (
      <ArcadeAlleyPushGame
        cabinetAccent={props.cabinetAccent}
        cabinetGlow={props.cabinetGlow}
        mode={props.mode as ArcadeAlleyPushMode}
        onComplete={props.onComplete}
        {...(props.onForfeit ? { onForfeit: props.onForfeit } : {})}
      />
    );
  }

  return (
    <section aria-label="Cabinet offline" className="arcade-cabinet-game-offline panel">
      <header className="arcade-bubble-mode-select-head">
        <span>Cabinet offline</span>
        <span>NO RUN</span>
      </header>
      <p className="arcade-cabinet-game-offline-copy">
        This machine is wired on the alley menu but the game board is not installed yet.
      </p>
    </section>
  );
}