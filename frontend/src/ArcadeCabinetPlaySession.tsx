import { useCallback, useState, type ReactElement } from 'react';

import { ArcadeCabinetGame } from './ArcadeCabinetGame.js';
import type { ArcadeBubbleGameSummary } from './ArcadeBubbleGame.js';
import type { ArcadeAlleyPushGameSummary } from './ArcadeAlleyPushGame.js';
import type { ArcadeBrickedUpGameSummary } from './ArcadeBrickedUpGame.js';
import type { ArcadeDropWindowGameSummary } from './ArcadeDropWindowGame.js';
import type { ArcadeStashDefenseGameSummary } from './ArcadeStashDefenseGame.js';
import type { ArcadeGobMarketGameSummary } from './ArcadeGobMarketGame.js';
import type { ArcadeIntelStackGameSummary } from './ArcadeIntelStackGame.js';
import type { ArcadeStealthGoonGameSummary } from './ArcadeStealthGoonGame.js';
import { applyArcadePassportBadgesAfterRun } from './arcade-passport-badge-hooks.js';
import {
  ARCADE_DROP_WINDOW_GAME_ID,
  arcadeDropWindowModeLabel,
  type ArcadeDropWindowMode,
} from './arcade-drop-window-game.js';
import {
  readArcadeDropWindowLeaderboard,
  recordArcadeDropWindowGameResult,
  useArcadeDropWindowGameVersion,
  type ArcadeDropWindowGameResult,
} from './arcade-drop-window-game-store.js';
import {
  ARCADE_BRICKED_UP_GAME_ID,
  arcadeBrickedUpModeLabel,
  type ArcadeBrickedUpMode,
} from './arcade-bricked-up-game.js';
import {
  readArcadeBrickedUpLeaderboard,
  recordArcadeBrickedUpGameResult,
  useArcadeBrickedUpGameVersion,
  type ArcadeBrickedUpGameResult,
} from './arcade-bricked-up-game-store.js';
import {
  ARCADE_ALLEY_PUSH_GAME_ID,
  arcadeAlleyPushModeLabel,
  type ArcadeAlleyPushMode,
} from './arcade-alley-push-game.js';
import {
  readArcadeAlleyPushLeaderboard,
  recordArcadeAlleyPushGameResult,
  useArcadeAlleyPushGameVersion,
  type ArcadeAlleyPushGameResult,
} from './arcade-alley-push-game-store.js';
import {
  ARCADE_STASH_DEFENSE_GAME_ID,
  arcadeStashDefenseModeLabel,
  type ArcadeStashDefenseMode,
} from './arcade-stash-defense-game.js';
import {
  ARCADE_GOB_MARKET_GAME_ID,
  arcadeGobMarketModeLabel,
  type ArcadeGobMarketMode,
} from './arcade-gob-market-game.js';
import {
  readArcadeGobMarketLeaderboard,
  recordArcadeGobMarketGameResult,
  useArcadeGobMarketGameVersion,
  type ArcadeGobMarketGameResult,
} from './arcade-gob-market-game-store.js';
import {
  ARCADE_INTEL_STACK_GAME_ID,
  arcadeIntelStackModeLabel,
  type ArcadeIntelStackMode,
} from './arcade-intel-stack-game.js';
import {
  readArcadeIntelStackLeaderboard,
  recordArcadeIntelStackGameResult,
  useArcadeIntelStackGameVersion,
  type ArcadeIntelStackGameResult,
} from './arcade-intel-stack-game-store.js';
import {
  ARCADE_STEALTH_GOON_GAME_ID,
  arcadeStealthGoonModeLabel,
  type ArcadeStealthGoonMode,
} from './arcade-stealth-goon-game.js';
import {
  readArcadeStealthGoonLeaderboard,
  recordArcadeStealthGoonGameResult,
  useArcadeStealthGoonGameVersion,
  type ArcadeStealthGoonGameResult,
} from './arcade-stealth-goon-game-store.js';
import {
  readArcadeStashDefenseLeaderboard,
  recordArcadeStashDefenseGameResult,
  useArcadeStashDefenseGameVersion,
  type ArcadeStashDefenseGameResult,
} from './arcade-stash-defense-game-store.js';
import { ARCADE_BUBBLE_GAME_ID } from './arcade-bubble-game.js';
import { arcadeBubbleModeLabel, type ArcadeBubbleMode } from './arcade-bubble-game.js';
import {
  readArcadeBubbleLeaderboard,
  recordArcadeBubbleGameResult,
  useArcadeBubbleGameVersion,
  type ArcadeBubbleGameResult,
} from './arcade-bubble-game-store.js';
import type { ArcadeCabinetView } from './arcade-cabinets.js';
import { useArcadeResultsInputLock } from './arcade-results-input-lock.js';
import { ARCADE_SKILL_DIFF_MODE, ARCADE_SKILL_DIFF_MODE_LABEL } from './arcade-skill-diff.js';
import { SELF_MEMBER_ID } from './member-access.js';
import {
  playArcadeGameOverSfx,
  playArcadeMenuSelectSfx,
  playArcadeScoreRevealSfx,
} from './nami-sfx.js';

export type ArcadeCabinetPlayPhase = 'mode-select' | 'playing' | 'results';

type ArcadeCabinetPlaySessionProps = {
  cabinet: ArcadeCabinetView;
  displayName: string;
  onBackToMenu: () => void;
  onPhaseChange: (phase: ArcadeCabinetPlayPhase) => void;
};

type ArcadePlayMode =
  | ArcadeBubbleMode
  | ArcadeAlleyPushMode
  | ArcadeStashDefenseMode
  | ArcadeDropWindowMode
  | ArcadeBrickedUpMode
  | ArcadeStealthGoonMode
  | ArcadeGobMarketMode
  | ArcadeIntelStackMode;

type ArcadeCabinetPlayState = {
  phase: ArcadeCabinetPlayPhase;
  mode: ArcadePlayMode | null;
  bubbleResult: ArcadeBubbleGameResult | null;
  alleyResult: ArcadeAlleyPushGameResult | null;
  stashResult: ArcadeStashDefenseGameResult | null;
  dropResult: ArcadeDropWindowGameResult | null;
  brickedResult: ArcadeBrickedUpGameResult | null;
  stealthResult: ArcadeStealthGoonGameResult | null;
  gobResult: ArcadeGobMarketGameResult | null;
  intelResult: ArcadeIntelStackGameResult | null;
};

function syncArcadePassportBadges(
  gameId: string,
  mode: string,
  score: number,
  isPersonalBest: boolean,
): void {
  applyArcadePassportBadgesAfterRun({
    memberId: SELF_MEMBER_ID,
    gameId,
    mode,
    score,
    isPersonalBest,
  });
}

export function ArcadeCabinetPlaySession(props: ArcadeCabinetPlaySessionProps): ReactElement {
  useArcadeBubbleGameVersion();
  useArcadeAlleyPushGameVersion();
  useArcadeStashDefenseGameVersion();
  useArcadeDropWindowGameVersion();
  useArcadeBrickedUpGameVersion();
  useArcadeStealthGoonGameVersion();
  useArcadeGobMarketGameVersion();
  useArcadeIntelStackGameVersion();

  const [playSession, setPlaySession] = useState(0);
  const [state, setState] = useState<ArcadeCabinetPlayState>({
    phase: 'mode-select',
    mode: null,
    bubbleResult: null,
    alleyResult: null,
    stashResult: null,
    dropResult: null,
    brickedResult: null,
    stealthResult: null,
    gobResult: null,
    intelResult: null,
  });

  const startMode = useCallback(
    (mode: ArcadePlayMode): void => {
      playArcadeMenuSelectSfx();
      setPlaySession((session) => session + 1);
      setState({
        phase: 'playing',
        mode,
        bubbleResult: null,
        alleyResult: null,
        stashResult: null,
        dropResult: null,
        brickedResult: null,
        stealthResult: null,
        gobResult: null,
        intelResult: null,
      });
      props.onPhaseChange('playing');
    },
    [props],
  );

  const handleForfeit = useCallback((): void => {
    setState({
      phase: 'mode-select',
      mode: null,
      bubbleResult: null,
      alleyResult: null,
      stashResult: null,
      dropResult: null,
      brickedResult: null,
      stealthResult: null,
      gobResult: null,
      intelResult: null,
    });
    props.onPhaseChange('mode-select');
  }, [props]);

  const handleBubbleComplete = useCallback(
    (summary: ArcadeBubbleGameSummary): void => {
      playArcadeGameOverSfx();

      const result = recordArcadeBubbleGameResult({
        memberId: SELF_MEMBER_ID,
        displayName: props.displayName,
        mode: summary.mode,
        score: summary.score,
        bubblesPopped: summary.bubblesPopped,
      });
      syncArcadePassportBadges(ARCADE_BUBBLE_GAME_ID, summary.mode, result.score, result.isPersonalBest);

      playArcadeScoreRevealSfx();

      setState({
        phase: 'results',
        mode: summary.mode,
        bubbleResult: result,
        alleyResult: null,
        stashResult: null,
        dropResult: null,
        brickedResult: null,
        stealthResult: null,
        gobResult: null,
        intelResult: null,
      });
      props.onPhaseChange('results');
    },
    [props],
  );

  const handleAlleyComplete = useCallback(
    (summary: ArcadeAlleyPushGameSummary): void => {
      playArcadeGameOverSfx();

      const result = recordArcadeAlleyPushGameResult({
        memberId: SELF_MEMBER_ID,
        displayName: props.displayName,
        mode: summary.mode,
        score: summary.score,
        passesCompleted: summary.passesCompleted,
      });
      syncArcadePassportBadges(
        ARCADE_ALLEY_PUSH_GAME_ID,
        summary.mode,
        result.score,
        result.isPersonalBest,
      );

      playArcadeScoreRevealSfx();

      setState({
        phase: 'results',
        mode: summary.mode,
        bubbleResult: null,
        alleyResult: result,
        stashResult: null,
        dropResult: null,
        brickedResult: null,
        stealthResult: null,
        gobResult: null,
        intelResult: null,
      });
      props.onPhaseChange('results');
    },
    [props],
  );

  const handleStashComplete = useCallback(
    (summary: ArcadeStashDefenseGameSummary): void => {
      playArcadeGameOverSfx();

      const result = recordArcadeStashDefenseGameResult({
        memberId: SELF_MEMBER_ID,
        displayName: props.displayName,
        mode: summary.mode,
        score: summary.score,
        enemiesRepelled: summary.enemiesRepelled,
      });
      syncArcadePassportBadges(
        ARCADE_STASH_DEFENSE_GAME_ID,
        summary.mode,
        result.score,
        result.isPersonalBest,
      );

      playArcadeScoreRevealSfx();

      setState({
        phase: 'results',
        mode: summary.mode,
        bubbleResult: null,
        alleyResult: null,
        stashResult: result,
        dropResult: null,
        brickedResult: null,
        stealthResult: null,
        gobResult: null,
        intelResult: null,
      });
      props.onPhaseChange('results');
    },
    [props],
  );

  const handleDropComplete = useCallback(
    (summary: ArcadeDropWindowGameSummary): void => {
      playArcadeGameOverSfx();

      const result = recordArcadeDropWindowGameResult({
        memberId: SELF_MEMBER_ID,
        displayName: props.displayName,
        mode: summary.mode,
        score: summary.score,
        dropsCaught: summary.dropsCaught,
        staticKilled: summary.staticKilled,
      });
      syncArcadePassportBadges(
        ARCADE_DROP_WINDOW_GAME_ID,
        summary.mode,
        result.score,
        result.isPersonalBest,
      );

      playArcadeScoreRevealSfx();

      setState({
        phase: 'results',
        mode: summary.mode,
        bubbleResult: null,
        alleyResult: null,
        stashResult: null,
        dropResult: result,
        brickedResult: null,
        stealthResult: null,
        gobResult: null,
        intelResult: null,
      });
      props.onPhaseChange('results');
    },
    [props],
  );

  const handleBrickedComplete = useCallback(
    (summary: ArcadeBrickedUpGameSummary): void => {
      playArcadeGameOverSfx();

      const result = recordArcadeBrickedUpGameResult({
        memberId: SELF_MEMBER_ID,
        displayName: props.displayName,
        mode: summary.mode,
        score: summary.score,
        bricksBroken: summary.bricksBroken,
        levelsCleared: summary.levelsCleared,
      });
      syncArcadePassportBadges(
        ARCADE_BRICKED_UP_GAME_ID,
        summary.mode,
        result.score,
        result.isPersonalBest,
      );

      playArcadeScoreRevealSfx();

      setState({
        phase: 'results',
        mode: summary.mode,
        bubbleResult: null,
        alleyResult: null,
        stashResult: null,
        dropResult: null,
        brickedResult: result,
        stealthResult: null,
        gobResult: null,
        intelResult: null,
      });
      props.onPhaseChange('results');
    },
    [props],
  );

  const handleStealthGoonComplete = useCallback(
    (summary: ArcadeStealthGoonGameSummary): void => {
      playArcadeGameOverSfx();

      const result = recordArcadeStealthGoonGameResult({
        memberId: SELF_MEMBER_ID,
        displayName: props.displayName,
        mode: summary.mode,
        score: summary.score,
        linksCollected: summary.linksCollected,
      });
      syncArcadePassportBadges(
        ARCADE_STEALTH_GOON_GAME_ID,
        summary.mode,
        result.score,
        result.isPersonalBest,
      );

      playArcadeScoreRevealSfx();

      setState({
        phase: 'results',
        mode: summary.mode,
        bubbleResult: null,
        alleyResult: null,
        stashResult: null,
        dropResult: null,
        brickedResult: null,
        stealthResult: result,
        gobResult: null,
        intelResult: null,
      });
      props.onPhaseChange('results');
    },
    [props],
  );

  const handleGobMarketComplete = useCallback(
    (summary: ArcadeGobMarketGameSummary): void => {
      playArcadeGameOverSfx();

      const result = recordArcadeGobMarketGameResult({
        memberId: SELF_MEMBER_ID,
        displayName: props.displayName,
        mode: summary.mode,
        score: summary.score,
        tokensCollected: summary.tokensCollected,
      });
      syncArcadePassportBadges(
        ARCADE_GOB_MARKET_GAME_ID,
        summary.mode,
        result.score,
        result.isPersonalBest,
      );

      playArcadeScoreRevealSfx();

      setState({
        phase: 'results',
        mode: summary.mode,
        bubbleResult: null,
        alleyResult: null,
        stashResult: null,
        dropResult: null,
        brickedResult: null,
        stealthResult: null,
        gobResult: result,
        intelResult: null,
      });
      props.onPhaseChange('results');
    },
    [props],
  );

  const handleIntelStackComplete = useCallback(
    (summary: ArcadeIntelStackGameSummary): void => {
      playArcadeGameOverSfx();

      const result = recordArcadeIntelStackGameResult({
        memberId: SELF_MEMBER_ID,
        displayName: props.displayName,
        mode: summary.mode,
        score: summary.score,
        signalsStacked: summary.signalsStacked,
        perfectStacks: summary.perfectStacks,
      });
      syncArcadePassportBadges(
        ARCADE_INTEL_STACK_GAME_ID,
        summary.mode,
        result.score,
        result.isPersonalBest,
      );

      playArcadeScoreRevealSfx();

      setState({
        phase: 'results',
        mode: summary.mode,
        bubbleResult: null,
        alleyResult: null,
        stashResult: null,
        dropResult: null,
        brickedResult: null,
        stealthResult: null,
        gobResult: null,
        intelResult: result,
      });
      props.onPhaseChange('results');
    },
    [props],
  );

  if (props.cabinet.gameId === ARCADE_BUBBLE_GAME_ID) {
    return (
      <>
        {state.phase === 'mode-select' ? (
          <section aria-label="Select game mode" className="arcade-bubble-mode-select panel">
            <header className="arcade-bubble-mode-select-head">
              <span>{props.cabinet.title}</span>
              <span>60 SEC RUN</span>
            </header>

            <div className="arcade-bubble-mode-select-copy">
              <h2>Pick your heat</h2>
              <p>
                Alley Run keeps the glow slow and the hits light. Heat Run speeds the rise and
                demands more hits before a glow ghosts.
              </p>
            </div>

            <div className="arcade-bubble-mode-select-actions">
              <button
                className="arcade-bubble-mode-button"
                onClick={() => startMode('normal')}
                type="button"
              >
                <strong>Alley Run</strong>
                <small>Small 1 hit · Big 3 hits · +1 G / +2 G</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-hard-mode"
                onClick={() => startMode('hard')}
                type="button"
              >
                <strong>Heat Run</strong>
                <small>Small 2 hits · Big 4 hits · faster rise</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-skill-mode"
                onClick={() => startMode(ARCADE_SKILL_DIFF_MODE)}
                type="button"
              >
                <strong>{ARCADE_SKILL_DIFF_MODE_LABEL}</strong>
                <small>3× rise speed · 5× spawn rate · 2× glows per tick</small>
              </button>
            </div>

            <footer className="arcade-bubble-mode-select-foot">
              <button className="arcade-screen-exit-button" onClick={props.onBackToMenu} type="button">
                Back to cabinet
              </button>
            </footer>
          </section>
        ) : null}

        {state.phase === 'playing' && state.mode ? (
          <ArcadeCabinetGame
            cabinetAccent={props.cabinet.cabinetAccent}
            cabinetGlow={props.cabinet.cabinetGlow}
            gameId={props.cabinet.gameId}
            key={state.mode + '-' + playSession}
            mode={state.mode}
            onComplete={(summary) => handleBubbleComplete(summary as ArcadeBubbleGameSummary)}
            onForfeit={handleForfeit}
          />
        ) : null}

        {state.phase === 'results' && state.bubbleResult && state.mode ? (
          <BubbleResults
            mode={state.mode as ArcadeBubbleMode}
            onBackToMenu={props.onBackToMenu}
            onRetry={() => startMode(state.mode as ArcadePlayMode)}
            onSwitchMode={() => {
              setState({
                phase: 'mode-select',
                mode: null,
                bubbleResult: null,
                alleyResult: null,
                stashResult: null,
                dropResult: null,
                brickedResult: null,
                stealthResult: null,
                gobResult: null,
        intelResult: null,
              });
              props.onPhaseChange('mode-select');
            }}
            result={state.bubbleResult}
          />
        ) : null}
      </>
    );
  }

  if (props.cabinet.gameId === ARCADE_ALLEY_PUSH_GAME_ID) {
    return (
      <>
        {state.phase === 'mode-select' ? (
          <section aria-label="Select game mode" className="arcade-bubble-mode-select panel">
            <header className="arcade-bubble-mode-select-head">
              <span>{props.cabinet.title}</span>
              <span>60 SEC RUN</span>
            </header>

            <div className="arcade-bubble-mode-select-copy">
              <h2>Claim the crew pass</h2>
              <p>
                Five lanes stand between you and the crew pass. Street Pass keeps one traffic row per lane.
                Heat Chase stacks three hazard rows and lets you step between them.
              </p>
            </div>

            <div className="arcade-bubble-mode-select-actions">
              <button
                className="arcade-bubble-mode-button"
                onClick={() => startMode('normal')}
                type="button"
              >
                <strong>Street Pass</strong>
                <small>Single traffic row · 3 hazard waves · +5 G per pass</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-hard-mode"
                onClick={() => startMode('hard')}
                type="button"
              >
                <strong>Heat Chase</strong>
                <small>3 hazard rows · ↑↓ switch rows · faster drift</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-skill-mode"
                onClick={() => startMode(ARCADE_SKILL_DIFF_MODE)}
                type="button"
              >
                <strong>{ARCADE_SKILL_DIFF_MODE_LABEL}</strong>
                <small>3× hazard drift · 2× hazard waves · zero lane lag</small>
              </button>
            </div>

            <footer className="arcade-bubble-mode-select-foot">
              <button className="arcade-screen-exit-button" onClick={props.onBackToMenu} type="button">
                Back to cabinet
              </button>
            </footer>
          </section>
        ) : null}

        {state.phase === 'playing' && state.mode ? (
          <ArcadeCabinetGame
            cabinetAccent={props.cabinet.cabinetAccent}
            cabinetGlow={props.cabinet.cabinetGlow}
            gameId={props.cabinet.gameId}
            key={state.mode + '-' + playSession}
            mode={state.mode}
            onComplete={(summary) => handleAlleyComplete(summary as ArcadeAlleyPushGameSummary)}
            onForfeit={handleForfeit}
          />
        ) : null}

        {state.phase === 'results' && state.alleyResult && state.mode ? (
          <AlleyResults
            mode={state.mode as ArcadeAlleyPushMode}
            onBackToMenu={props.onBackToMenu}
            onRetry={() => startMode(state.mode as ArcadePlayMode)}
            onSwitchMode={() => {
              setState({
                phase: 'mode-select',
                mode: null,
                bubbleResult: null,
                alleyResult: null,
                stashResult: null,
                dropResult: null,
                brickedResult: null,
                stealthResult: null,
                gobResult: null,
        intelResult: null,
              });
              props.onPhaseChange('mode-select');
            }}
            result={state.alleyResult}
          />
        ) : null}
      </>
    );
  }

  if (props.cabinet.gameId === ARCADE_STASH_DEFENSE_GAME_ID) {
    return (
      <>
        {state.phase === 'mode-select' ? (
          <section aria-label="Select game mode" className="arcade-bubble-mode-select panel">
            <header className="arcade-bubble-mode-select-head">
              <span>{props.cabinet.title}</span>
              <span>60 SEC RUN</span>
            </header>

            <div className="arcade-bubble-mode-select-copy">
              <h2>Hold the crew stash</h2>
              <p>
                Three lanes march heat toward your stash. Fire bursts of three shots per lane, then wait
                for a short reload. Bullets travel down-lane and only damage raiders on contact.
              </p>
            </div>

            <div className="arcade-bubble-mode-select-actions">
              <button
                className="arcade-bubble-mode-button"
                onClick={() => startMode('normal')}
                type="button"
              >
                <strong>Alley Watch</strong>
                <small>∞ lives · stash HP · 1 raider per lane · +2 G per repel · +8 G survive bonus</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-hard-mode"
                onClick={() => startMode('hard')}
                type="button"
              >
                <strong>Heat Siege</strong>
                <small>5 lives · 2 raiders per lane · faster double spawns · up to 4-hit raiders</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-skill-mode"
                onClick={() => startMode(ARCADE_SKILL_DIFF_MODE)}
                type="button"
              >
                <strong>{ARCADE_SKILL_DIFF_MODE_LABEL}</strong>
                <small>3 lives · free fire · 3× raider speed · 5× spawn rate · 5-hit raiders</small>
              </button>
            </div>

            <footer className="arcade-bubble-mode-select-foot">
              <button className="arcade-screen-exit-button" onClick={props.onBackToMenu} type="button">
                Back to cabinet
              </button>
            </footer>
          </section>
        ) : null}

        {state.phase === 'playing' && state.mode ? (
          <ArcadeCabinetGame
            cabinetAccent={props.cabinet.cabinetAccent}
            cabinetGlow={props.cabinet.cabinetGlow}
            gameId={props.cabinet.gameId}
            key={state.mode + '-' + playSession}
            mode={state.mode}
            onComplete={(summary) => handleStashComplete(summary as ArcadeStashDefenseGameSummary)}
            onForfeit={handleForfeit}
          />
        ) : null}

        {state.phase === 'results' && state.stashResult && state.mode ? (
          <StashResults
            mode={state.mode as ArcadeStashDefenseMode}
            onBackToMenu={props.onBackToMenu}
            onRetry={() => startMode(state.mode as ArcadePlayMode)}
            onSwitchMode={() => {
              setState({
                phase: 'mode-select',
                mode: null,
                bubbleResult: null,
                alleyResult: null,
                stashResult: null,
                dropResult: null,
                brickedResult: null,
                stealthResult: null,
                gobResult: null,
        intelResult: null,
              });
              props.onPhaseChange('mode-select');
            }}
            result={state.stashResult}
          />
        ) : null}
      </>
    );
  }

  if (props.cabinet.gameId === ARCADE_DROP_WINDOW_GAME_ID) {
    return (
      <>
        {state.phase === 'mode-select' ? (
          <section aria-label="Select game mode" className="arcade-bubble-mode-select panel">
            <header className="arcade-bubble-mode-select-head">
              <span>{props.cabinet.title}</span>
              <span>60 SEC RUN</span>
            </header>

            <div className="arcade-bubble-mode-select-copy">
              <h2>Real drop only</h2>
              <p>
                Signals flash in three windows. Catch the golden DROP before it ghosts. Kill STATIC
                noise before it clogs the lane. Clean Signal gives you more time; Static Storm floods
                the board with decoys.
              </p>
            </div>

            <div className="arcade-bubble-mode-select-actions">
              <button
                className="arcade-bubble-mode-button"
                onClick={() => startMode('normal')}
                type="button"
              >
                <strong>Clean Signal</strong>
                <small>+4 G per drop · +2 G per static kill · longer windows</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-hard-mode"
                onClick={() => startMode('hard')}
                type="button"
              >
                <strong>Static Storm</strong>
                <small>More static noise · faster spawns · tighter reaction windows</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-skill-mode"
                onClick={() => startMode(ARCADE_SKILL_DIFF_MODE)}
                type="button"
              >
                <strong>{ARCADE_SKILL_DIFF_MODE_LABEL}</strong>
                <small>5 windows · 5 lives · empty taps cost a life · 2-3 drops at once</small>
              </button>
            </div>

            <footer className="arcade-bubble-mode-select-foot">
              <button className="arcade-screen-exit-button" onClick={props.onBackToMenu} type="button">
                Back to cabinet
              </button>
            </footer>
          </section>
        ) : null}

        {state.phase === 'playing' && state.mode ? (
          <ArcadeCabinetGame
            cabinetAccent={props.cabinet.cabinetAccent}
            cabinetGlow={props.cabinet.cabinetGlow}
            gameId={props.cabinet.gameId}
            key={state.mode + '-' + playSession}
            mode={state.mode}
            onComplete={(summary) => handleDropComplete(summary as ArcadeDropWindowGameSummary)}
            onForfeit={handleForfeit}
          />
        ) : null}

        {state.phase === 'results' && state.dropResult && state.mode ? (
          <DropResults
            mode={state.mode as ArcadeDropWindowMode}
            onBackToMenu={props.onBackToMenu}
            onRetry={() => startMode(state.mode as ArcadePlayMode)}
            onSwitchMode={() => {
              setState({
                phase: 'mode-select',
                mode: null,
                bubbleResult: null,
                alleyResult: null,
                stashResult: null,
                dropResult: null,
                brickedResult: null,
                stealthResult: null,
                gobResult: null,
        intelResult: null,
              });
              props.onPhaseChange('mode-select');
            }}
            result={state.dropResult}
          />
        ) : null}
      </>
    );
  }

  if (props.cabinet.gameId === ARCADE_BRICKED_UP_GAME_ID) {
    return (
      <>
        {state.phase === 'mode-select' ? (
          <section aria-label="Select game mode" className="arcade-bubble-mode-select panel">
            <header className="arcade-bubble-mode-select-head">
              <span>{props.cabinet.title}</span>
              <span>LEVEL RUN</span>
            </header>

            <div className="arcade-bubble-mode-select-copy">
              <h2>Break the wall</h2>
              <p>
                Break bricks, dodge falling hazards, and catch mystery drops — each one might buff
                your paddle or curse the field. Powers stack briefly and fade on their own timer.
                Street Break is a three-floor warmup. Heat Layer stacks a fourth. Skill diff drops
                dual balls into five armored floors.
              </p>
            </div>

            <div className="arcade-bubble-mode-select-actions">
              <button
                className="arcade-bubble-mode-button"
                onClick={() => startMode('normal')}
                type="button"
              >
                <strong>Street Break</strong>
                <small>3 levels · faster ball · mystery drops & hazards</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-hard-mode"
                onClick={() => startMode('hard')}
                type="button"
              >
                <strong>Heat Layer</strong>
                <small>4 levels · quicker hazards · up to 2-hit bricks</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-skill-mode"
                onClick={() => startMode(ARCADE_SKILL_DIFF_MODE)}
                type="button"
              >
                <strong>{ARCADE_SKILL_DIFF_MODE_LABEL}</strong>
                <small>5 levels · 2 balls · dense hazards · 2-3 hit bricks</small>
              </button>
            </div>

            <footer className="arcade-bubble-mode-select-foot">
              <button className="arcade-screen-exit-button" onClick={props.onBackToMenu} type="button">
                Back to cabinet
              </button>
            </footer>
          </section>
        ) : null}

        {state.phase === 'playing' && state.mode ? (
          <ArcadeCabinetGame
            cabinetAccent={props.cabinet.cabinetAccent}
            cabinetGlow={props.cabinet.cabinetGlow}
            gameId={props.cabinet.gameId}
            key={state.mode + '-' + playSession}
            mode={state.mode}
            onComplete={(summary) => handleBrickedComplete(summary as ArcadeBrickedUpGameSummary)}
            onForfeit={handleForfeit}
          />
        ) : null}

        {state.phase === 'results' && state.brickedResult && state.mode ? (
          <BrickedUpResults
            mode={state.mode as ArcadeBrickedUpMode}
            onBackToMenu={props.onBackToMenu}
            onRetry={() => startMode(state.mode as ArcadePlayMode)}
            onSwitchMode={() => {
              setState({
                phase: 'mode-select',
                mode: null,
                bubbleResult: null,
                alleyResult: null,
                stashResult: null,
                dropResult: null,
                brickedResult: null,
                stealthResult: null,
                gobResult: null,
        intelResult: null,
              });
              props.onPhaseChange('mode-select');
            }}
            result={state.brickedResult}
          />
        ) : null}
      </>
    );
  }

  if (props.cabinet.gameId === ARCADE_STEALTH_GOON_GAME_ID) {
    return (
      <>
        {state.phase === 'mode-select' ? (
          <section aria-label="Select game mode" className="arcade-bubble-mode-select panel">
            <header className="arcade-bubble-mode-select-head">
              <span>{props.cabinet.title}</span>
              <span>60 SEC RUN</span>
            </header>

            <div className="arcade-bubble-mode-select-copy">
              <h2>Grow the squad chain</h2>
              <p>
                Steer your off-grid crew through the grid. Collect crew links to extend the chain and
                bank G. Low Profile keeps the lane quiet. Heat Patrol sends roaming agents after you.
              </p>
            </div>

            <div className="arcade-bubble-mode-select-actions">
              <button
                className="arcade-bubble-mode-button"
                onClick={() => startMode('normal')}
                type="button"
              >
                <strong>Low Profile</strong>
                <small>Slower chain · no patrol heat · +2 G per link</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-hard-mode"
                onClick={() => startMode('hard')}
                type="button"
              >
                <strong>Heat Patrol</strong>
                <small>Roaming HEAT agents · faster chain · tighter turns</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-skill-mode"
                onClick={() => startMode(ARCADE_SKILL_DIFF_MODE)}
                type="button"
              >
                <strong>{ARCADE_SKILL_DIFF_MODE_LABEL}</strong>
                <small>Fast chain · dense patrol heat · survive for the wall bonus</small>
              </button>
            </div>

            <footer className="arcade-bubble-mode-select-foot">
              <button className="arcade-screen-exit-button" onClick={props.onBackToMenu} type="button">
                Back to cabinet
              </button>
            </footer>
          </section>
        ) : null}

        {state.phase === 'playing' && state.mode ? (
          <ArcadeCabinetGame
            cabinetAccent={props.cabinet.cabinetAccent}
            cabinetGlow={props.cabinet.cabinetGlow}
            gameId={props.cabinet.gameId}
            key={state.mode + '-' + playSession}
            mode={state.mode}
            onComplete={(summary) => handleStealthGoonComplete(summary as ArcadeStealthGoonGameSummary)}
            onForfeit={handleForfeit}
          />
        ) : null}

        {state.phase === 'results' && state.stealthResult && state.mode ? (
          <StealthGoonResults
            mode={state.mode as ArcadeStealthGoonMode}
            onBackToMenu={props.onBackToMenu}
            onRetry={() => startMode(state.mode as ArcadePlayMode)}
            onSwitchMode={() => {
              setState({
                phase: 'mode-select',
                mode: null,
                bubbleResult: null,
                alleyResult: null,
                stashResult: null,
                dropResult: null,
                brickedResult: null,
                stealthResult: null,
                gobResult: null,
        intelResult: null,
              });
              props.onPhaseChange('mode-select');
            }}
            result={state.stealthResult}
          />
        ) : null}
      </>
    );
  }

  if (props.cabinet.gameId === ARCADE_GOB_MARKET_GAME_ID) {
    return (
      <>
        {state.phase === 'mode-select' ? (
          <section aria-label="Select game mode" className="arcade-bubble-mode-select panel">
            <header className="arcade-bubble-mode-select-head">
              <span>{props.cabinet.title}</span>
              <span>60 SEC RUN</span>
            </header>

            <div className="arcade-bubble-mode-select-copy">
              <h2>Clear the guest list</h2>
              <p>
                Navigate the VIP maze and collect list tokens before the bouncers bounce you out.
                Guest List keeps the floor quiet. VIP Floor sends roving bouncers through the halls.
              </p>
            </div>

            <div className="arcade-bubble-mode-select-actions">
              <button
                className="arcade-bubble-mode-button"
                onClick={() => startMode('normal')}
                type="button"
              >
                <strong>Guest List</strong>
                <small>Open maze · no bouncers · +3 G per token</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-hard-mode"
                onClick={() => startMode('hard')}
                type="button"
              >
                <strong>VIP Floor</strong>
                <small>Two roaming bouncers · faster pace · 3 lives</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-skill-mode"
                onClick={() => startMode(ARCADE_SKILL_DIFF_MODE)}
                type="button"
              >
                <strong>{ARCADE_SKILL_DIFF_MODE_LABEL}</strong>
                <small>Dense bouncer heat · fastest pace · survive for the wall bonus</small>
              </button>
            </div>

            <footer className="arcade-bubble-mode-select-foot">
              <button className="arcade-screen-exit-button" onClick={props.onBackToMenu} type="button">
                Back to cabinet
              </button>
            </footer>
          </section>
        ) : null}

        {state.phase === 'playing' && state.mode ? (
          <ArcadeCabinetGame
            cabinetAccent={props.cabinet.cabinetAccent}
            cabinetGlow={props.cabinet.cabinetGlow}
            gameId={props.cabinet.gameId}
            key={state.mode + '-' + playSession}
            mode={state.mode}
            onComplete={(summary) => handleGobMarketComplete(summary as ArcadeGobMarketGameSummary)}
            onForfeit={handleForfeit}
          />
        ) : null}

        {state.phase === 'results' && state.gobResult && state.mode ? (
          <GobMarketResults
            mode={state.mode as ArcadeGobMarketMode}
            onBackToMenu={props.onBackToMenu}
            onRetry={() => startMode(state.mode as ArcadePlayMode)}
            onSwitchMode={() => {
              setState({
                phase: 'mode-select',
                mode: null,
                bubbleResult: null,
                alleyResult: null,
                stashResult: null,
                dropResult: null,
                brickedResult: null,
                stealthResult: null,
                gobResult: null,
        intelResult: null,
              });
              props.onPhaseChange('mode-select');
            }}
            result={state.gobResult}
          />
        ) : null}
      </>
    );
  }

  if (props.cabinet.gameId === ARCADE_INTEL_STACK_GAME_ID) {
    return (
      <>
        {state.phase === 'mode-select' ? (
          <section aria-label="Select game mode" className="arcade-bubble-mode-select panel">
            <header className="arcade-bubble-mode-select-head">
              <span>{props.cabinet.title}</span>
              <span>60 SEC RUN</span>
            </header>

            <div className="arcade-bubble-mode-select-copy">
              <h2>Stack before the signal dies</h2>
              <p>
                Commit each intel pulse into the matching tower before the timer flatlines. Clean
                Stack keeps longer windows. Surge Stack tightens the clock and spawn cadence.
              </p>
            </div>

            <div className="arcade-bubble-mode-select-actions">
              <button
                className="arcade-bubble-mode-button"
                onClick={() => startMode('normal')}
                type="button"
              >
                <strong>Clean Stack</strong>
                <small>3 towers · longer signal life · +3 G clean stacks</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-hard-mode"
                onClick={() => startMode('hard')}
                type="button"
              >
                <strong>Surge Stack</strong>
                <small>Faster spawns · shorter windows · miss costs tower height</small>
              </button>
              <button
                className="arcade-bubble-mode-button is-skill-mode"
                onClick={() => startMode(ARCADE_SKILL_DIFF_MODE)}
                type="button"
              >
                <strong>{ARCADE_SKILL_DIFF_MODE_LABEL}</strong>
                <small>5 towers · dual concurrent signals · perfect stacks bank +5 G</small>
              </button>
            </div>

            <footer className="arcade-bubble-mode-select-foot">
              <button className="arcade-screen-exit-button" onClick={props.onBackToMenu} type="button">
                Back to cabinet
              </button>
            </footer>
          </section>
        ) : null}

        {state.phase === 'playing' && state.mode ? (
          <ArcadeCabinetGame
            cabinetAccent={props.cabinet.cabinetAccent}
            cabinetGlow={props.cabinet.cabinetGlow}
            gameId={props.cabinet.gameId}
            key={state.mode + '-' + playSession}
            mode={state.mode}
            onComplete={(summary) =>
              handleIntelStackComplete(summary as ArcadeIntelStackGameSummary)
            }
            onForfeit={handleForfeit}
          />
        ) : null}

        {state.phase === 'results' && state.intelResult && state.mode ? (
          <IntelStackResults
            mode={state.mode as ArcadeIntelStackMode}
            onBackToMenu={props.onBackToMenu}
            onRetry={() => startMode(state.mode as ArcadePlayMode)}
            onSwitchMode={() => {
              setState({
                phase: 'mode-select',
                mode: null,
                bubbleResult: null,
                alleyResult: null,
                stashResult: null,
                dropResult: null,
                brickedResult: null,
                stealthResult: null,
                gobResult: null,
                intelResult: null,
              });
              props.onPhaseChange('mode-select');
            }}
            result={state.intelResult}
          />
        ) : null}
      </>
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
      <button className="arcade-screen-exit-button" onClick={props.onBackToMenu} type="button">
        Back to cabinet
      </button>
    </section>
  );
}

function GobMarketResults(props: {
  mode: ArcadeGobMarketMode;
  result: ArcadeGobMarketGameResult;
  onRetry: () => void;
  onSwitchMode: () => void;
  onBackToMenu: () => void;
}): ReactElement {
  const leaderboard = readArcadeGobMarketLeaderboard(props.mode);

  return (
    <section aria-label="Game results" className="arcade-bubble-results panel">
      <header className="arcade-bubble-results-head">
        <span>Run complete</span>
        <span>{arcadeGobMarketModeLabel(props.mode)}</span>
      </header>

      <div className="arcade-bubble-results-score">
        <span>G banked</span>
        <strong>{props.result.score} G</strong>
        <p>
          {props.result.tokensCollected} list tokens collected · Board #{props.result.rank}
          {props.result.isPersonalBest ? ' · New crew record' : ''}
        </p>
      </div>

      <LeaderboardList
        currentMemberId={SELF_MEMBER_ID}
        currentScore={props.result.score}
        entries={leaderboard.map((entry, index) => ({
          id: entry.id,
          memberId: entry.memberId,
          displayName: entry.displayName,
          rank: index + 1,
          scoreLabel: entry.score + ' G',
        }))}
      />

      <ResultsActions
        onBackToMenu={props.onBackToMenu}
        onRetry={props.onRetry}
        onSwitchMode={props.onSwitchMode}
      />
    </section>
  );
}

function IntelStackResults(props: {
  mode: ArcadeIntelStackMode;
  result: ArcadeIntelStackGameResult;
  onRetry: () => void;
  onSwitchMode: () => void;
  onBackToMenu: () => void;
}): ReactElement {
  const leaderboard = readArcadeIntelStackLeaderboard(props.mode);

  return (
    <section aria-label="Game results" className="arcade-bubble-results panel">
      <header className="arcade-bubble-results-head">
        <span>Run complete</span>
        <span>{arcadeIntelStackModeLabel(props.mode)}</span>
      </header>

      <div className="arcade-bubble-results-score">
        <span>G banked</span>
        <strong>{props.result.score} G</strong>
        <p>
          {props.result.signalsStacked} signals stacked · {props.result.perfectStacks} perfect ·
          Board #{props.result.rank}
          {props.result.isPersonalBest ? ' · New crew record' : ''}
        </p>
      </div>

      <LeaderboardList
        currentMemberId={SELF_MEMBER_ID}
        currentScore={props.result.score}
        entries={leaderboard.map((entry, index) => ({
          id: entry.id,
          memberId: entry.memberId,
          displayName: entry.displayName,
          rank: index + 1,
          scoreLabel: entry.score + ' G',
        }))}
      />

      <ResultsActions
        onBackToMenu={props.onBackToMenu}
        onRetry={props.onRetry}
        onSwitchMode={props.onSwitchMode}
      />
    </section>
  );
}

function StealthGoonResults(props: {
  mode: ArcadeStealthGoonMode;
  result: ArcadeStealthGoonGameResult;
  onRetry: () => void;
  onSwitchMode: () => void;
  onBackToMenu: () => void;
}): ReactElement {
  const leaderboard = readArcadeStealthGoonLeaderboard(props.mode);

  return (
    <section aria-label="Game results" className="arcade-bubble-results panel">
      <header className="arcade-bubble-results-head">
        <span>Run complete</span>
        <span>{arcadeStealthGoonModeLabel(props.mode)}</span>
      </header>

      <div className="arcade-bubble-results-score">
        <span>G banked</span>
        <strong>{props.result.score} G</strong>
        <p>
          {props.result.linksCollected} crew links collected · Board #{props.result.rank}
          {props.result.isPersonalBest ? ' · New crew record' : ''}
        </p>
      </div>

      <LeaderboardList
        currentMemberId={SELF_MEMBER_ID}
        currentScore={props.result.score}
        entries={leaderboard.map((entry, index) => ({
          id: entry.id,
          memberId: entry.memberId,
          displayName: entry.displayName,
          rank: index + 1,
          scoreLabel: entry.score + ' G',
        }))}
      />

      <ResultsActions
        onBackToMenu={props.onBackToMenu}
        onRetry={props.onRetry}
        onSwitchMode={props.onSwitchMode}
      />
    </section>
  );
}

function BrickedUpResults(props: {
  mode: ArcadeBrickedUpMode;
  result: ArcadeBrickedUpGameResult;
  onRetry: () => void;
  onSwitchMode: () => void;
  onBackToMenu: () => void;
}): ReactElement {
  const leaderboard = readArcadeBrickedUpLeaderboard(props.mode);

  return (
    <section aria-label="Game results" className="arcade-bubble-results panel">
      <header className="arcade-bubble-results-head">
        <span>Run complete</span>
        <span>{arcadeBrickedUpModeLabel(props.mode)}</span>
      </header>

      <div className="arcade-bubble-results-score">
        <span>G banked</span>
        <strong>{props.result.score} G</strong>
        <p>
          {props.result.bricksBroken} bricks broken · {props.result.levelsCleared} levels cleared ·
          Board #{props.result.rank}
          {props.result.isPersonalBest ? ' · New crew record' : ''}
        </p>
      </div>

      <LeaderboardList
        currentMemberId={SELF_MEMBER_ID}
        currentScore={props.result.score}
        entries={leaderboard.map((entry, index) => ({
          id: entry.id,
          memberId: entry.memberId,
          displayName: entry.displayName,
          rank: index + 1,
          scoreLabel: entry.score + ' G',
        }))}
      />

      <ResultsActions
        onBackToMenu={props.onBackToMenu}
        onRetry={props.onRetry}
        onSwitchMode={props.onSwitchMode}
      />
    </section>
  );
}

function BubbleResults(props: {
  mode: ArcadeBubbleMode;
  result: ArcadeBubbleGameResult;
  onRetry: () => void;
  onSwitchMode: () => void;
  onBackToMenu: () => void;
}): ReactElement {
  const leaderboard = readArcadeBubbleLeaderboard(props.mode);

  return (
    <section aria-label="Game results" className="arcade-bubble-results panel">
      <header className="arcade-bubble-results-head">
        <span>Run complete</span>
        <span>{arcadeBubbleModeLabel(props.mode)}</span>
      </header>

      <div className="arcade-bubble-results-score">
        <span>G banked</span>
        <strong>{props.result.score} G</strong>
        <p>
          {props.result.bubblesPopped} glows ghosted · Board #{props.result.rank}
          {props.result.isPersonalBest ? ' · New crew record' : ''}
        </p>
      </div>

      <LeaderboardList
        currentMemberId={SELF_MEMBER_ID}
        currentScore={props.result.score}
        entries={leaderboard.map((entry, index) => ({
          id: entry.id,
          memberId: entry.memberId,
          displayName: entry.displayName,
          rank: index + 1,
          scoreLabel: entry.score + ' G',
        }))}
      />

      <ResultsActions
        onBackToMenu={props.onBackToMenu}
        onRetry={props.onRetry}
        onSwitchMode={props.onSwitchMode}
      />
    </section>
  );
}

function AlleyResults(props: {
  mode: ArcadeAlleyPushMode;
  result: ArcadeAlleyPushGameResult;
  onRetry: () => void;
  onSwitchMode: () => void;
  onBackToMenu: () => void;
}): ReactElement {
  const leaderboard = readArcadeAlleyPushLeaderboard(props.mode);

  return (
    <section aria-label="Game results" className="arcade-bubble-results panel">
      <header className="arcade-bubble-results-head">
        <span>Run complete</span>
        <span>{arcadeAlleyPushModeLabel(props.mode)}</span>
      </header>

      <div className="arcade-bubble-results-score">
        <span>G banked</span>
        <strong>{props.result.score} G</strong>
        <p>
          {props.result.passesCompleted} crew passes · Board #{props.result.rank}
          {props.result.isPersonalBest ? ' · New crew record' : ''}
        </p>
      </div>

      <LeaderboardList
        currentMemberId={SELF_MEMBER_ID}
        currentScore={props.result.score}
        entries={leaderboard.map((entry, index) => ({
          id: entry.id,
          memberId: entry.memberId,
          displayName: entry.displayName,
          rank: index + 1,
          scoreLabel: entry.score + ' G',
        }))}
      />

      <ResultsActions
        onBackToMenu={props.onBackToMenu}
        onRetry={props.onRetry}
        onSwitchMode={props.onSwitchMode}
      />
    </section>
  );
}

function DropResults(props: {
  mode: ArcadeDropWindowMode;
  result: ArcadeDropWindowGameResult;
  onRetry: () => void;
  onSwitchMode: () => void;
  onBackToMenu: () => void;
}): ReactElement {
  const leaderboard = readArcadeDropWindowLeaderboard(props.mode);

  return (
    <section aria-label="Game results" className="arcade-bubble-results panel">
      <header className="arcade-bubble-results-head">
        <span>Run complete</span>
        <span>{arcadeDropWindowModeLabel(props.mode)}</span>
      </header>

      <div className="arcade-bubble-results-score">
        <span>G banked</span>
        <strong>{props.result.score} G</strong>
        <p>
          {props.result.dropsCaught} drops caught · {props.result.staticKilled} static killed · Board #
          {props.result.rank}
          {props.result.isPersonalBest ? ' · New crew record' : ''}
        </p>
      </div>

      <LeaderboardList
        currentMemberId={SELF_MEMBER_ID}
        currentScore={props.result.score}
        entries={leaderboard.map((entry, index) => ({
          id: entry.id,
          memberId: entry.memberId,
          displayName: entry.displayName,
          rank: index + 1,
          scoreLabel: entry.score + ' G',
        }))}
      />

      <ResultsActions
        onBackToMenu={props.onBackToMenu}
        onRetry={props.onRetry}
        onSwitchMode={props.onSwitchMode}
      />
    </section>
  );
}

function StashResults(props: {
  mode: ArcadeStashDefenseMode;
  result: ArcadeStashDefenseGameResult;
  onRetry: () => void;
  onSwitchMode: () => void;
  onBackToMenu: () => void;
}): ReactElement {
  const leaderboard = readArcadeStashDefenseLeaderboard(props.mode);

  return (
    <section aria-label="Game results" className="arcade-bubble-results panel">
      <header className="arcade-bubble-results-head">
        <span>Run complete</span>
        <span>{arcadeStashDefenseModeLabel(props.mode)}</span>
      </header>

      <div className="arcade-bubble-results-score">
        <span>G banked</span>
        <strong>{props.result.score} G</strong>
        <p>
          {props.result.enemiesRepelled} raiders repelled · Board #{props.result.rank}
          {props.result.isPersonalBest ? ' · New crew record' : ''}
        </p>
      </div>

      <LeaderboardList
        currentMemberId={SELF_MEMBER_ID}
        currentScore={props.result.score}
        entries={leaderboard.map((entry, index) => ({
          id: entry.id,
          memberId: entry.memberId,
          displayName: entry.displayName,
          rank: index + 1,
          scoreLabel: entry.score + ' G',
        }))}
      />

      <ResultsActions
        onBackToMenu={props.onBackToMenu}
        onRetry={props.onRetry}
        onSwitchMode={props.onSwitchMode}
      />
    </section>
  );
}

function LeaderboardList(props: {
  entries: Array<{
    id: string;
    memberId: string;
    displayName: string;
    rank: number;
    scoreLabel: string;
  }>;
  currentMemberId: string;
  currentScore: number;
}): ReactElement {
  return (
    <ol className="arcade-bubble-results-leaderboard">
      {props.entries.map((entry) => (
        <li
          className={
            entry.memberId === props.currentMemberId && entry.scoreLabel === props.currentScore + ' G'
              ? 'is-current-player'
              : ''
          }
          key={entry.id}
        >
          <span>#{entry.rank}</span>
          <strong>{entry.displayName}</strong>
          <span>{entry.scoreLabel}</span>
        </li>
      ))}
      {props.entries.length === 0 ? (
        <li className="arcade-bubble-results-empty">No crew runs logged yet — yours is first.</li>
      ) : null}
    </ol>
  );
}

function ResultsActions(props: {
  onRetry: () => void;
  onSwitchMode: () => void;
  onBackToMenu: () => void;
}): ReactElement {
  const inputLocked = useArcadeResultsInputLock();

  function blockLockedPointer(event: { preventDefault: () => void; stopPropagation: () => void }): void {
    if (!inputLocked) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div
      className={'arcade-bubble-results-actions' + (inputLocked ? ' is-input-locked' : ' is-input-ready')}
      onClickCapture={blockLockedPointer}
      onPointerDownCapture={blockLockedPointer}
      onPointerUpCapture={blockLockedPointer}
    >
      {inputLocked ? (
        <p aria-live="polite" className="arcade-bubble-results-input-lock-hint">
          Run logged — take a beat and read your score
        </p>
      ) : null}
      <button
        aria-disabled={inputLocked}
        className="arcade-screen-play-button"
        disabled={inputLocked}
        onClick={props.onRetry}
        type="button"
      >
        Try again
      </button>
      <button
        aria-disabled={inputLocked}
        className="arcade-screen-exit-button"
        disabled={inputLocked}
        onClick={props.onSwitchMode}
        type="button"
      >
        Different mode
      </button>
      <button
        aria-disabled={inputLocked}
        className="arcade-screen-exit-button"
        disabled={inputLocked}
        onClick={props.onBackToMenu}
        type="button"
      >
        Back to cabinet
      </button>
    </div>
  );
}