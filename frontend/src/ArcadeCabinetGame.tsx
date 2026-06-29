import type { ReactElement } from 'react';

import { ArcadeAlleyPushGame, type ArcadeAlleyPushGameSummary } from './ArcadeAlleyPushGame.js';
import { ArcadeBubbleGame, type ArcadeBubbleGameSummary } from './ArcadeBubbleGame.js';
import { ArcadeBrickedUpGame, type ArcadeBrickedUpGameSummary } from './ArcadeBrickedUpGame.js';
import { ArcadeDropWindowGame, type ArcadeDropWindowGameSummary } from './ArcadeDropWindowGame.js';
import { ArcadeStashDefenseGame, type ArcadeStashDefenseGameSummary } from './ArcadeStashDefenseGame.js';
import { ArcadeGobMarketGame, type ArcadeGobMarketGameSummary } from './ArcadeGobMarketGame.js';
import { ArcadeIntelStackGame, type ArcadeIntelStackGameSummary } from './ArcadeIntelStackGame.js';
import { ArcadeStealthGoonGame, type ArcadeStealthGoonGameSummary } from './ArcadeStealthGoonGame.js';
import {
  ARCADE_DROP_WINDOW_GAME_ID,
  type ArcadeDropWindowMode,
} from './arcade-drop-window-game.js';
import { ARCADE_ALLEY_PUSH_GAME_ID, type ArcadeAlleyPushMode } from './arcade-alley-push-game.js';
import { ARCADE_BRICKED_UP_GAME_ID, type ArcadeBrickedUpMode } from './arcade-bricked-up-game.js';
import { ARCADE_BUBBLE_GAME_ID, type ArcadeBubbleMode } from './arcade-bubble-game.js';
import {
  ARCADE_STASH_DEFENSE_GAME_ID,
  type ArcadeStashDefenseMode,
} from './arcade-stash-defense-game.js';
import {
  ARCADE_GOB_MARKET_GAME_ID,
  type ArcadeGobMarketMode,
} from './arcade-gob-market-game.js';
import {
  ARCADE_INTEL_STACK_GAME_ID,
  type ArcadeIntelStackMode,
} from './arcade-intel-stack-game.js';
import {
  ARCADE_STEALTH_GOON_GAME_ID,
  type ArcadeStealthGoonMode,
} from './arcade-stealth-goon-game.js';

type ArcadeCabinetGameProps = {
  gameId: string;
  mode:
    | ArcadeBubbleMode
    | ArcadeAlleyPushMode
    | ArcadeStashDefenseMode
    | ArcadeDropWindowMode
    | ArcadeBrickedUpMode
    | ArcadeStealthGoonMode
    | ArcadeGobMarketMode
    | ArcadeIntelStackMode;
  cabinetAccent: string;
  cabinetGlow: string;
  onComplete: (
    summary:
      | ArcadeBubbleGameSummary
      | ArcadeAlleyPushGameSummary
      | ArcadeStashDefenseGameSummary
      | ArcadeDropWindowGameSummary
      | ArcadeBrickedUpGameSummary
      | ArcadeStealthGoonGameSummary
      | ArcadeGobMarketGameSummary
      | ArcadeIntelStackGameSummary,
  ) => void;
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

  if (props.gameId === ARCADE_STASH_DEFENSE_GAME_ID) {
    return (
      <ArcadeStashDefenseGame
        cabinetAccent={props.cabinetAccent}
        cabinetGlow={props.cabinetGlow}
        mode={props.mode as ArcadeStashDefenseMode}
        onComplete={props.onComplete}
        {...(props.onForfeit ? { onForfeit: props.onForfeit } : {})}
      />
    );
  }

  if (props.gameId === ARCADE_DROP_WINDOW_GAME_ID) {
    return (
      <ArcadeDropWindowGame
        cabinetAccent={props.cabinetAccent}
        cabinetGlow={props.cabinetGlow}
        mode={props.mode as ArcadeDropWindowMode}
        onComplete={props.onComplete}
        {...(props.onForfeit ? { onForfeit: props.onForfeit } : {})}
      />
    );
  }

  if (props.gameId === ARCADE_BRICKED_UP_GAME_ID) {
    return (
      <ArcadeBrickedUpGame
        cabinetAccent={props.cabinetAccent}
        cabinetGlow={props.cabinetGlow}
        mode={props.mode as ArcadeBrickedUpMode}
        onComplete={props.onComplete}
        {...(props.onForfeit ? { onForfeit: props.onForfeit } : {})}
      />
    );
  }

  if (props.gameId === ARCADE_STEALTH_GOON_GAME_ID) {
    return (
      <ArcadeStealthGoonGame
        cabinetAccent={props.cabinetAccent}
        cabinetGlow={props.cabinetGlow}
        mode={props.mode as ArcadeStealthGoonMode}
        onComplete={props.onComplete}
        {...(props.onForfeit ? { onForfeit: props.onForfeit } : {})}
      />
    );
  }

  if (props.gameId === ARCADE_GOB_MARKET_GAME_ID) {
    return (
      <ArcadeGobMarketGame
        cabinetAccent={props.cabinetAccent}
        cabinetGlow={props.cabinetGlow}
        mode={props.mode as ArcadeGobMarketMode}
        onComplete={props.onComplete}
        {...(props.onForfeit ? { onForfeit: props.onForfeit } : {})}
      />
    );
  }

  if (props.gameId === ARCADE_INTEL_STACK_GAME_ID) {
    return (
      <ArcadeIntelStackGame
        cabinetAccent={props.cabinetAccent}
        cabinetGlow={props.cabinetGlow}
        mode={props.mode as ArcadeIntelStackMode}
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