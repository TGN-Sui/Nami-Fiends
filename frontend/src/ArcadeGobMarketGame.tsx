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
  ARCADE_GOB_MARKET_GAME_DURATION_MS,
  ARCADE_GOB_MARKET_GRID_SIZE,
  ARCADE_GOB_MARKET_SURVIVE_BONUS,
  arcadeGobMarketGameConfig,
  createArcadeGobMarketState,
  finalizeArcadeGobMarketRun,
  isArcadeGobMarketWall,
  readArcadeGobMarketDirectionFromKey,
  setArcadeGobMarketDirection,
  updateArcadeGobMarketState,
  type ArcadeGobMarketMode,
  type ArcadeGobMarketState,
} from './arcade-gob-market-game.js';
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

export type ArcadeGobMarketGameSummary = {
  score: number;
  tokensCollected: number;
  mode: ArcadeGobMarketMode;
};

type ArcadeGobMarketGameProps = {
  mode: ArcadeGobMarketMode;
  cabinetAccent: string;
  cabinetGlow: string;
  onComplete: (summary: ArcadeGobMarketGameSummary) => void;
  onForfeit?: () => void;
};

function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return String(minutes) + ':' + String(seconds).padStart(2, '0');
}

export function ArcadeGobMarketGame(props: ArcadeGobMarketGameProps): ReactElement {
  const config = useMemo(() => arcadeGobMarketGameConfig(props.mode), [props.mode]);
  const stateRef = useRef<ArcadeGobMarketState>(createArcadeGobMarketState(config));
  const lastTickAtRef = useRef(performance.now());
  const lastCountdownSecondRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const completedRef = useRef(false);
  const startedAtRef = useRef(performance.now());
  const [gameState, setGameState] = useState(stateRef.current);
  const [remainingMs, setRemainingMs] = useState(ARCADE_GOB_MARKET_GAME_DURATION_MS);

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

      const finalized = finalizeArcadeGobMarketRun(stateRef.current, reason === 'complete');

      playArcadeGameOverSfx();
      props.onComplete({
        score: finalized.score,
        tokensCollected: finalized.tokensCollected,
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
    stateRef.current = createArcadeGobMarketState(config);
    setGameState(stateRef.current);
    setRemainingMs(ARCADE_GOB_MARKET_GAME_DURATION_MS);

    const reducedMotion = prefersReducedMotion();

    function handleKeyDown(event: KeyboardEvent): void {
      const direction = readArcadeGobMarketDirectionFromKey(event.key);

      if (!direction) {
        return;
      }

      event.preventDefault();
      stateRef.current = setArcadeGobMarketDirection(stateRef.current, direction);
      setGameState({ ...stateRef.current });
    }

    window.addEventListener('keydown', handleKeyDown);

    timerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current;
      const nextRemaining = Math.max(0, ARCADE_GOB_MARKET_GAME_DURATION_MS - elapsed);
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
        const previousTokens = stateRef.current.tokensCollected;
        const previousLives = stateRef.current.lives;
        const previousPlayer = { ...stateRef.current.player };
        stateRef.current = updateArcadeGobMarketState(stateRef.current, config);
        lastTickAtRef.current = now;

        if (stateRef.current.tokensCollected > previousTokens) {
          playArcadeStashBulletHitSfx();
        } else if (stateRef.current.lives < previousLives) {
          playArcadeStashBulletHitSfx();
        } else if (
          stateRef.current.direction &&
          (stateRef.current.player.x !== previousPlayer.x ||
            stateRef.current.player.y !== previousPlayer.y)
        ) {
          playArcadeGameTickSfx();
        }

        setGameState({ ...stateRef.current });

        if (stateRef.current.lives <= 0) {
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
    '--arcade-gob-accent': props.cabinetAccent,
    '--arcade-gob-glow': props.cabinetGlow,
  } as CSSProperties;

  const cellPercent = 100 / ARCADE_GOB_MARKET_GRID_SIZE;

  const wallCells = useMemo(() => {
    const cells: Array<{ x: number; y: number }> = [];

    for (let y = 0; y < ARCADE_GOB_MARKET_GRID_SIZE; y += 1) {
      for (let x = 0; x < ARCADE_GOB_MARKET_GRID_SIZE; x += 1) {
        if (isArcadeGobMarketWall(x, y)) {
          cells.push({ x, y });
        }
      }
    }

    return cells;
  }, []);

  return (
    <div className="arcade-gob-market-game" style={accentStyle}>
      <div className="arcade-gob-market-game-hud">
        <div className="arcade-gob-market-game-hud-stats">
          <div className="arcade-gob-market-game-hud-block">
            <span>G</span>
            <strong>{gameState.score}</strong>
          </div>
          <div className="arcade-gob-market-game-hud-block">
            <span>Tokens</span>
            <strong>{gameState.tokensCollected}</strong>
          </div>
          <div className="arcade-gob-market-game-hud-block">
            <span>Lives</span>
            <strong>{gameState.lives}</strong>
          </div>
          <div
            className={
              'arcade-gob-market-game-hud-block' +
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
          className="arcade-gob-market-game-exit-button"
          onClick={() => finishGame('forfeit')}
          type="button"
        >
          Exit game
        </button>
      </div>

      <div aria-label="Gob market maze field" className="arcade-gob-market-game-field">
        {wallCells.map((cell) => (
          <span
            aria-hidden="true"
            className="arcade-gob-market-game-wall"
            key={'wall-' + cell.x + '-' + cell.y}
            style={{
              left: cell.x * cellPercent + '%',
              top: cell.y * cellPercent + '%',
              width: cellPercent + '%',
              height: cellPercent + '%',
            }}
          />
        ))}
        <span
          aria-hidden="true"
          className="arcade-gob-market-game-player"
          style={{
            left: gameState.player.x * cellPercent + '%',
            top: gameState.player.y * cellPercent + '%',
            width: cellPercent + '%',
            height: cellPercent + '%',
          }}
        />
        {gameState.tokens.map((token) => (
          <span
            aria-hidden="true"
            className="arcade-gob-market-game-token"
            key={token.id}
            style={{
              left: token.x * cellPercent + '%',
              top: token.y * cellPercent + '%',
              width: cellPercent + '%',
              height: cellPercent + '%',
            }}
          />
        ))}
        {gameState.bouncers.map((bouncer) => (
          <span
            aria-hidden="true"
            className="arcade-gob-market-game-bouncer"
            key={bouncer.id}
            style={{
              left: bouncer.x * cellPercent + '%',
              top: bouncer.y * cellPercent + '%',
              width: cellPercent + '%',
              height: cellPercent + '%',
            }}
          />
        ))}
      </div>

      <p className="arcade-gob-market-game-hint">
        Arrow keys or WASD to move · Collect list tokens · Dodge bouncers ·{' '}
        {formatArcadeG(ARCADE_GOB_MARKET_SURVIVE_BONUS, true)} survive bonus
      </p>
    </div>
  );
}