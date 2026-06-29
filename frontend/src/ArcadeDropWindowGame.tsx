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
  ARCADE_DROP_WINDOW_GAME_DURATION_MS,
  ARCADE_DROP_WINDOW_COUNT,
  ARCADE_DROP_WINDOW_HIT_FLASH_MS,
  ARCADE_DROP_WINDOW_STARTING_LIVES,
  ARCADE_DROP_WINDOW_SURVIVE_BONUS,
  arcadeDropWindowGameConfig,
  arcadeDropWindowLivesAfterPress,
  arcadeDropWindowSignalProgress,
  arcadeDropWindowSurviveBonus,
  expireArcadeDropWindowSignals,
  readArcadeDropWindowFromKey,
  removeArcadeDropWindowSignal,
  resolveArcadeDropWindowWindowPress,
  spawnArcadeDropWindowSignals,
  type ArcadeDropWindowMode,
  type ArcadeDropWindowResolveResult,
  type ArcadeDropWindowSignal,
} from './arcade-drop-window-game.js';
import {
  arcadeCountdownWarningStyle,
  isArcadeCountdownWarning,
} from './arcade-countdown-ui.js';
import { formatArcadeG } from './arcade-score.js';
import {
  playArcadeDropWindowBuzzerSfx,
  playArcadeBubblePopSfx,
  playArcadeGameCountdownTickSfx,
  playArcadeGameOverSfx,
  playArcadeGameStartSfx,
  playArcadeGameTickSfx,
} from './nami-sfx.js';
import { prefersReducedMotion, subscribeVisibilityPause } from './perf-utils.js';

export type ArcadeDropWindowGameSummary = {
  score: number;
  dropsCaught: number;
  staticKilled: number;
  mode: ArcadeDropWindowMode;
};

type ArcadeDropWindowGameProps = {
  mode: ArcadeDropWindowMode;
  cabinetAccent: string;
  cabinetGlow: string;
  onComplete: (summary: ArcadeDropWindowGameSummary) => void;
  onForfeit?: () => void;
};

const WINDOW_LABELS = ['W1', 'W2', 'W3', 'W4', 'W5'] as const;

function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return String(minutes) + ':' + String(seconds).padStart(2, '0');
}

export function ArcadeDropWindowGame(props: ArcadeDropWindowGameProps): ReactElement {
  const config = useMemo(() => arcadeDropWindowGameConfig(props.mode), [props.mode]);
  const signalsRef = useRef<ArcadeDropWindowSignal[]>([]);
  const lastSpawnAtRef = useRef(0);
  const scoreRef = useRef(0);
  const dropsCaughtRef = useRef(0);
  const staticKilledRef = useRef(0);
  const livesRef = useRef(ARCADE_DROP_WINDOW_STARTING_LIVES);
  const hitFlashTimeoutRef = useRef<number | null>(null);
  const lastCountdownSecondRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const completedRef = useRef(false);
  const startedAtRef = useRef(performance.now());
  const [score, setScore] = useState(0);
  const [dropsCaught, setDropsCaught] = useState(0);
  const [staticKilled, setStaticKilled] = useState(0);
  const [lives, setLives] = useState(ARCADE_DROP_WINDOW_STARTING_LIVES);
  const [remainingMs, setRemainingMs] = useState(ARCADE_DROP_WINDOW_GAME_DURATION_MS);
  const [activeSignals, setActiveSignals] = useState<ArcadeDropWindowSignal[]>([]);
  const [tickNow, setTickNow] = useState(performance.now());
  const [hitFlashActive, setHitFlashActive] = useState(false);
  const [hitFlashToken, setHitFlashToken] = useState(0);

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

      playArcadeGameOverSfx();
      props.onComplete({
        score: scoreRef.current,
        dropsCaught: dropsCaughtRef.current,
        staticKilled: staticKilledRef.current,
        mode: props.mode,
      });
    },
    [props],
  );

  const applyResolve = useCallback((result: ArcadeDropWindowResolveResult): void => {
    scoreRef.current = Math.max(0, scoreRef.current + result.scoreDelta);
    setScore(scoreRef.current);

    if (result.type === 'caught-drop') {
      dropsCaughtRef.current += 1;
      setDropsCaught(dropsCaughtRef.current);
      playArcadeGameTickSfx();
    }

    if (result.type === 'killed-static') {
      staticKilledRef.current += 1;
      setStaticKilled(staticKilledRef.current);
      playArcadeGameTickSfx();
    }

    if (result.type === 'missed-drop') {
      playArcadeBubblePopSfx('small');
    }

    if (result.type === 'missed-static') {
      playArcadeBubblePopSfx('big');
    }
  }, []);

  const triggerHitFlash = useCallback((): void => {
    playArcadeDropWindowBuzzerSfx();

    if (hitFlashTimeoutRef.current !== null) {
      window.clearTimeout(hitFlashTimeoutRef.current);
    }

    setHitFlashActive(false);
    window.requestAnimationFrame(() => {
      setHitFlashToken((token) => token + 1);
      setHitFlashActive(true);
    });

    hitFlashTimeoutRef.current = window.setTimeout(() => {
      setHitFlashActive(false);
      hitFlashTimeoutRef.current = null;
    }, ARCADE_DROP_WINDOW_HIT_FLASH_MS);
  }, []);

  const tryPressWindow = useCallback(
    (window: number): void => {
      if (completedRef.current || pausedRef.current) {
        return;
      }

      const resolved = resolveArcadeDropWindowWindowPress(signalsRef.current, window);

      if (resolved.result.type === 'empty-window') {
        triggerHitFlash();
        applyResolve(resolved.result);
        livesRef.current = arcadeDropWindowLivesAfterPress(livesRef.current, resolved.result);
        setLives(livesRef.current);

        if (livesRef.current <= 0) {
          finishGame('defeat');
        }

        return;
      }

      applyResolve(resolved.result);

      if (resolved.resolvedSignalId !== null) {
        signalsRef.current = removeArcadeDropWindowSignal(
          signalsRef.current,
          resolved.resolvedSignalId,
        );
        setActiveSignals([...signalsRef.current]);
      }
    },
    [applyResolve, finishGame, triggerHitFlash],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (completedRef.current || event.repeat) {
        return;
      }

      const window = readArcadeDropWindowFromKey(event.key, config.windowCount);

      if (window !== null) {
        tryPressWindow(window);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [config.windowCount, tryPressWindow]);

  useEffect(() => {
    playArcadeGameStartSfx();
    startedAtRef.current = performance.now();
    completedRef.current = false;
    pausedRef.current = false;
    scoreRef.current = 0;
    dropsCaughtRef.current = 0;
    staticKilledRef.current = 0;
    livesRef.current = ARCADE_DROP_WINDOW_STARTING_LIVES;
    signalsRef.current = [];
    lastSpawnAtRef.current = 0;
    setScore(0);
    setDropsCaught(0);
    setStaticKilled(0);
    setLives(ARCADE_DROP_WINDOW_STARTING_LIVES);
    setRemainingMs(ARCADE_DROP_WINDOW_GAME_DURATION_MS);
    setActiveSignals([]);
    setHitFlashActive(false);
    setHitFlashToken(0);
    lastCountdownSecondRef.current = null;

    timerRef.current = window.setInterval(() => {
      if (pausedRef.current || completedRef.current) {
        return;
      }

      const elapsed = performance.now() - startedAtRef.current;
      const nextRemaining = Math.max(0, ARCADE_DROP_WINDOW_GAME_DURATION_MS - elapsed);
      const nextSecond = Math.ceil(nextRemaining / 1000);

      setRemainingMs(nextRemaining);

      if (
        nextRemaining <= 10_000 &&
        nextRemaining > 0 &&
        lastCountdownSecondRef.current !== nextSecond
      ) {
        lastCountdownSecondRef.current = nextSecond;
        playArcadeGameCountdownTickSfx(nextSecond);
      }

      if (nextRemaining <= 0) {
        const bonus = arcadeDropWindowSurviveBonus(nextRemaining, scoreRef.current);
        if (bonus > 0) {
          scoreRef.current += bonus;
          setScore(scoreRef.current);
          playArcadeGameTickSfx();
        }
        finishGame('complete');
      }
    }, 100);

    const reducedMotion = prefersReducedMotion();

    function tick(now: number): void {
      if (pausedRef.current || completedRef.current) {
        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      setTickNow(now);

      if (!reducedMotion) {
        const expired = expireArcadeDropWindowSignals(signalsRef.current, now);

        if (expired.results.length > 0) {
          expired.results.forEach((result) => applyResolve(result));
          signalsRef.current = expired.signals;
        }

        const spawned = spawnArcadeDropWindowSignals(
          config,
          now,
          lastSpawnAtRef.current,
          signalsRef.current,
        );

        signalsRef.current = spawned.signals;
        lastSpawnAtRef.current = spawned.lastSpawnAt;
        setActiveSignals([...signalsRef.current]);
      }

      frameRef.current = window.requestAnimationFrame(tick);
    }

    frameRef.current = window.requestAnimationFrame(tick);

    const unsubscribeVisibility = subscribeVisibilityPause((paused) => {
      pausedRef.current = paused;
    });

    return () => {
      unsubscribeVisibility();

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (hitFlashTimeoutRef.current !== null) {
        window.clearTimeout(hitFlashTimeoutRef.current);
        hitFlashTimeoutRef.current = null;
      }
    };
  }, [applyResolve, config, finishGame]);

  const accentStyle = {
    '--arcade-drop-accent': props.cabinetAccent,
    '--arcade-drop-glow': props.cabinetGlow,
  } as CSSProperties;

  return (
    <div
      className={
        'arcade-drop-window-game' + (hitFlashActive ? ' is-hit-flash' : '')
      }
      data-hit-flash={hitFlashToken}
      style={accentStyle}
    >
      <div className="arcade-drop-window-game-hud">
        <div className="arcade-drop-window-game-hud-stats">
          <div className="arcade-drop-window-game-hud-block">
            <span>G</span>
            <strong>{score}</strong>
          </div>
          <div className="arcade-drop-window-game-hud-block">
            <span>Drops</span>
            <strong>{dropsCaught}</strong>
          </div>
          <div className="arcade-drop-window-game-hud-block">
            <span>Static</span>
            <strong>{staticKilled}</strong>
          </div>
          <div
            className={
              'arcade-drop-window-game-hud-block' +
              (lives <= 2 ? ' is-lives-warning' : '')
            }
          >
            <span>Lives</span>
            <strong>{lives}</strong>
          </div>
          <div
            className={
              'arcade-drop-window-game-hud-block' +
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
          className="arcade-drop-window-game-exit-button"
          onClick={() => finishGame('forfeit')}
          type="button"
        >
          Exit game
        </button>
      </div>

      <div
        aria-label={config.windowCount + ' window reaction field'}
        className={
          'arcade-drop-window-game-field' +
          (config.windowCount > ARCADE_DROP_WINDOW_COUNT ? ' is-skill-diff' : '')
        }
      >
        {Array.from({ length: config.windowCount }, (_, windowIndex) => {
          const windowSignals = activeSignals.filter((signal) => signal.window === windowIndex);
          const primarySignal = windowSignals[0] ?? null;
          const progress =
            primarySignal !== null ? arcadeDropWindowSignalProgress(primarySignal, tickNow) : 0;

          return (
            <div
              className={
                'arcade-drop-window-game-window' +
                (windowSignals.length > 0 ? ' is-active' : '') +
                (primarySignal?.kind === 'drop' ? ' is-drop-signal' : '') +
                (primarySignal?.kind === 'static' ? ' is-static-signal' : '')
              }
              key={'window-' + windowIndex}
            >
              <button
                className="arcade-drop-window-game-window-button"
                onClick={() => tryPressWindow(windowIndex)}
                type="button"
              >
                <span className="arcade-drop-window-game-window-label">
                  {WINDOW_LABELS[windowIndex]}
                </span>
                <span className="arcade-drop-window-game-window-action">WINDOW {windowIndex + 1}</span>
              </button>
              {windowSignals.map((signal) => (
                <span
                  aria-hidden="true"
                  className={
                    'arcade-drop-window-game-signal' +
                    (signal.kind === 'drop' ? ' is-drop' : ' is-static')
                  }
                  key={signal.id}
                >
                  {signal.kind === 'drop' ? 'DROP' : 'STATIC'}
                </span>
              ))}
              {primarySignal !== null ? (
                <span
                  aria-hidden="true"
                  className="arcade-drop-window-game-window-meter"
                  style={{ transform: 'scaleX(' + progress + ')' }}
                />
              ) : null}
            </div>
          );
        })}
        <p className="arcade-drop-window-game-hint">
          {config.windowCount > ARCADE_DROP_WINDOW_COUNT
            ? '1-5 or Q/W/E/R/T'
            : '1/2/3 or Q/W/E'}{' '}
          · {ARCADE_DROP_WINDOW_STARTING_LIVES} lives · empty windows cost a life · Catch DROP · Kill STATIC ·{' '}
          {config.maxConcurrentSignals > 1
            ? 'Up to ' + config.maxConcurrentSignals + ' signals at once · '
            : ''}
          {formatArcadeG(ARCADE_DROP_WINDOW_SURVIVE_BONUS, true)} survive bonus
        </p>
      </div>
    </div>
  );
}