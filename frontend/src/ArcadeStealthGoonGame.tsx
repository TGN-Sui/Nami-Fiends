import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react';

import {
  ARCADE_STEALTH_GOON_GAME_DURATION_MS,
  ARCADE_STEALTH_GOON_GRID_SIZE,
  arcadeStealthGoonGameConfig,
  createArcadeStealthGoonState,
  finalizeArcadeStealthGoonRun,
  queueArcadeStealthGoonDirection,
  readArcadeStealthGoonDirectionFromKey,
  updateArcadeStealthGoonState,
  type ArcadeStealthGoonMode,
  type ArcadeStealthGoonState,
} from './arcade-stealth-goon-game.js';
import {
  arcadeCountdownWarningStyle,
  isArcadeCountdownWarning,
} from './arcade-countdown-ui.js';
import { formatArcadeG } from './arcade-score.js';
import {
  playArcadeGameCountdownTickSfx,
  playArcadeGameOverSfx,
  playArcadeGameStartSfx,
  playArcadeGameTickSfx,
  playArcadeStashBulletHitSfx,
} from './nami-sfx.js';
import { prefersReducedMotion, subscribeVisibilityPause } from './perf-utils.js';

export type ArcadeStealthGoonGameSummary = {
  score: number;
  linksCollected: number;
  mode: ArcadeStealthGoonMode;
};

type ArcadeStealthGoonGameProps = {
  mode: ArcadeStealthGoonMode;
  cabinetAccent: string;
  cabinetGlow: string;
  onComplete: (summary: ArcadeStealthGoonGameSummary) => void;
  onForfeit?: () => void;
};

function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return String(minutes) + ':' + String(seconds).padStart(2, '0');
}

export function ArcadeStealthGoonGame(props: ArcadeStealthGoonGameProps): ReactElement {
  const config = useMemo(() => arcadeStealthGoonGameConfig(props.mode), [props.mode]);
  const stateRef = useRef<ArcadeStealthGoonState>(createArcadeStealthGoonState(config));
  const lastTickAtRef = useRef(performance.now());
  const lastCountdownSecondRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const completedRef = useRef(false);
  const startedAtRef = useRef(performance.now());
  const [gameState, setGameState] = useState(stateRef.current);
  const [remainingMs, setRemainingMs] = useState(ARCADE_STEALTH_GOON_GAME_DURATION_MS);

  const finishGame = useCallback(
    (reason: 'complete' | 'forfeit' | 'defeat'): void => {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (reason === 'forfeit') {
        props.onForfeit?.();
        return;
      }

      const finalized = finalizeArcadeStealthGoonRun(
        stateRef.current,
        reason === 'complete',
      );

      playArcadeGameOverSfx();
      props.onComplete({
        score: finalized.score,
        linksCollected: finalized.linksCollected,
        mode: props.mode,
      });
    },
    [props],
  );

  useEffect(() => {
    playArcadeGameStartSfx();
    completedRef.current = false;
    pausedRef.current = false;
    startedAtRef.current = performance.now();
    lastTickAtRef.current = performance.now();
    stateRef.current = createArcadeStealthGoonState(config);
    setGameState(stateRef.current);
    setRemainingMs(ARCADE_STEALTH_GOON_GAME_DURATION_MS);

    const reducedMotion = prefersReducedMotion();

    function handleKeyDown(event: KeyboardEvent): void {
      const direction = readArcadeStealthGoonDirectionFromKey(event.key);

      if (!direction) {
        return;
      }

      event.preventDefault();
      stateRef.current = queueArcadeStealthGoonDirection(stateRef.current, direction);
      setGameState({ ...stateRef.current });
    }

    window.addEventListener('keydown', handleKeyDown);

    timerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current;
      const nextRemaining = Math.max(0, ARCADE_STEALTH_GOON_GAME_DURATION_MS - elapsed);
      setRemainingMs(nextRemaining);

      const nextSecond = Math.ceil(nextRemaining / 1000);

      if (lastCountdownSecondRef.current !== nextSecond) {
        lastCountdownSecondRef.current = nextSecond;

        if (nextSecond <= 10 && nextSecond > 0) {
          playArcadeGameCountdownTickSfx(nextSecond);
        }
      }

      if (nextRemaining <= 0) {
        finishGame('complete');
      }
    }, 100);

    function tick(now: number): void {
      if (pausedRef.current || completedRef.current) {
        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      if (!reducedMotion && now - lastTickAtRef.current >= config.tickMs) {
        const previousLinks = stateRef.current.linksCollected;
        stateRef.current = updateArcadeStealthGoonState(stateRef.current, config);
        lastTickAtRef.current = now;

        if (stateRef.current.linksCollected > previousLinks) {
          playArcadeStashBulletHitSfx();
        } else if (!stateRef.current.dead) {
          playArcadeGameTickSfx();
        }

        setGameState({ ...stateRef.current });

        if (stateRef.current.dead) {
          finishGame('defeat');
        }
      }

      frameRef.current = window.requestAnimationFrame(tick);
    }

    frameRef.current = window.requestAnimationFrame(tick);

    const unsubscribeVisibility = subscribeVisibilityPause((paused) => {
      pausedRef.current = paused;
    });

    return () => {
      unsubscribeVisibility();
      window.removeEventListener('keydown', handleKeyDown);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [config, finishGame]);

  const accentStyle = {
    '--arcade-stealth-accent': props.cabinetAccent,
    '--arcade-stealth-glow': props.cabinetGlow,
  } as CSSProperties;

  const cellPercent = 100 / ARCADE_STEALTH_GOON_GRID_SIZE;

  return (
    <div className="arcade-stealth-goon-game" style={accentStyle}>
      <div className="arcade-stealth-goon-game-hud">
        <div className="arcade-stealth-goon-game-hud-stats">
          <div className="arcade-stealth-goon-game-hud-block">
            <span>G</span>
            <strong>{gameState.score}</strong>
          </div>
          <div className="arcade-stealth-goon-game-hud-block">
            <span>Links</span>
            <strong>{gameState.linksCollected}</strong>
          </div>
          <div className="arcade-stealth-goon-game-hud-block">
            <span>Chain</span>
            <strong>{gameState.snake.length}</strong>
          </div>
          <div
            className={
              'arcade-stealth-goon-game-hud-block' +
              (isArcadeCountdownWarning(remainingMs) ? ' is-time-warning' : '')
            }
          >
            <span>Time</span>
            <strong
              className={isArcadeCountdownWarning(remainingMs) ? 'is-arcade-time-warning' : ''}
              style={arcadeCountdownWarningStyle(remainingMs)}
            >
              {formatCountdown(remainingMs)}
            </strong>
          </div>
        </div>
        <button
          className="arcade-stealth-goon-game-exit-button"
          onClick={() => finishGame('forfeit')}
          type="button"
        >
          Exit game
        </button>
      </div>

      <div aria-label="Stealth goon squad chain field" className="arcade-stealth-goon-game-field">
        {gameState.snake.map((segment, index) => (
          <span
            aria-hidden="true"
            className={
              'arcade-stealth-goon-game-segment' + (index === 0 ? ' is-head' : ' is-body')
            }
            key={'segment-' + index}
            style={{
              left: segment.x * cellPercent + '%',
              top: segment.y * cellPercent + '%',
              width: cellPercent + '%',
              height: cellPercent + '%',
            }}
          />
        ))}
        {gameState.link ? (
          <span
            aria-hidden="true"
            className="arcade-stealth-goon-game-link"
            style={{
              left: gameState.link.x * cellPercent + '%',
              top: gameState.link.y * cellPercent + '%',
              width: cellPercent + '%',
              height: cellPercent + '%',
            }}
          />
        ) : null}
        {gameState.heatAgents.map((agent) => (
          <span
            aria-hidden="true"
            className="arcade-stealth-goon-game-heat"
            key={agent.id}
            style={{
              left: agent.x * cellPercent + '%',
              top: agent.y * cellPercent + '%',
              width: cellPercent + '%',
              height: cellPercent + '%',
            }}
          />
        ))}
      </div>

      <p className="arcade-stealth-goon-game-hint">
        Arrow keys or WASD to steer · Collect crew links · Dodge HEAT patrols ·{' '}
        {formatArcadeG(8, true)} survive bonus
      </p>
    </div>
  );
}