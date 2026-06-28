import { useCallback, useState, type ReactElement } from 'react';

import { ArcadeCabinetGame } from './ArcadeCabinetGame.js';
import type { ArcadeBubbleGameSummary } from './ArcadeBubbleGame.js';
import type { ArcadeAlleyPushGameSummary } from './ArcadeAlleyPushGame.js';
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
import { ARCADE_BUBBLE_GAME_ID } from './arcade-bubble-game.js';
import { arcadeBubbleModeLabel, type ArcadeBubbleMode } from './arcade-bubble-game.js';
import {
  readArcadeBubbleLeaderboard,
  recordArcadeBubbleGameResult,
  useArcadeBubbleGameVersion,
  type ArcadeBubbleGameResult,
} from './arcade-bubble-game-store.js';
import type { ArcadeCabinetView } from './arcade-cabinets.js';
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

type ArcadePlayMode = ArcadeBubbleMode | ArcadeAlleyPushMode;

type ArcadeCabinetPlayState = {
  phase: ArcadeCabinetPlayPhase;
  mode: ArcadePlayMode | null;
  bubbleResult: ArcadeBubbleGameResult | null;
  alleyResult: ArcadeAlleyPushGameResult | null;
};

export function ArcadeCabinetPlaySession(props: ArcadeCabinetPlaySessionProps): ReactElement {
  useArcadeBubbleGameVersion();
  useArcadeAlleyPushGameVersion();

  const [playSession, setPlaySession] = useState(0);
  const [state, setState] = useState<ArcadeCabinetPlayState>({
    phase: 'mode-select',
    mode: null,
    bubbleResult: null,
    alleyResult: null,
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

      playArcadeScoreRevealSfx();

      setState({
        phase: 'results',
        mode: summary.mode,
        bubbleResult: result,
        alleyResult: null,
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

      playArcadeScoreRevealSfx();

      setState({
        phase: 'results',
        mode: summary.mode,
        bubbleResult: null,
        alleyResult: result,
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
              });
              props.onPhaseChange('mode-select');
            }}
            result={state.alleyResult}
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
  return (
    <div className="arcade-bubble-results-actions">
      <button className="arcade-screen-play-button" onClick={props.onRetry} type="button">
        Try again
      </button>
      <button className="arcade-screen-exit-button" onClick={props.onSwitchMode} type="button">
        Different mode
      </button>
      <button className="arcade-screen-exit-button" onClick={props.onBackToMenu} type="button">
        Back to cabinet
      </button>
    </div>
  );
}