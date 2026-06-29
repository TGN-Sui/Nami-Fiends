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
  ARCADE_INTEL_STACK_GAME_DURATION_MS,
  ARCADE_INTEL_STACK_SURVIVE_BONUS,
  arcadeIntelStackAcceptedKeys,
  arcadeIntelStackGameConfig,
  arcadeIntelStackSignalProgress,
  arcadeIntelStackSurviveBonus,
  arcadeIntelStackTowerAfterMiss,
  arcadeIntelStackTowerAfterStack,
  createArcadeIntelStackTowerHeights,
  expireArcadeIntelStackSignals,
  readArcadeIntelStackFromKey,
  removeArcadeIntelStackSignal,
  resolveArcadeIntelStackColumnPress,
  spawnArcadeIntelStackSignals,
  type ArcadeIntelStackMode,
  type ArcadeIntelStackResolveResult,
  type ArcadeIntelStackSignal,
} from './arcade-intel-stack-game.js';
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

export type ArcadeIntelStackGameSummary = {
  score: number;
  signalsStacked: number;
  perfectStacks: number;
  mode: ArcadeIntelStackMode;
};

type ArcadeIntelStackGameProps = {
  mode: ArcadeIntelStackMode;
  cabinetAccent: string;
  cabinetGlow: string;
  onComplete: (summary: ArcadeIntelStackGameSummary) => void;
  onForfeit?: () => void;
};

const COLUMN_LABELS = ['C1', 'C2', 'C3', 'C4', 'C5'] as const;

function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return String(minutes) + ':' + String(seconds).padStart(2, '0');
}

export function ArcadeIntelStackGame(props: ArcadeIntelStackGameProps): ReactElement {
  const config = useMemo(() => arcadeIntelStackGameConfig(props.mode), [props.mode]);
  const signalsRef = useRef<ArcadeIntelStackSignal[]>([]);
  const towerHeightsRef = useRef(createArcadeIntelStackTowerHeights(config.columnCount));
  const lastSpawnAtRef = useRef(0);
  const scoreRef = useRef(0);
  const signalsStackedRef = useRef(0);
  const perfectStacksRef = useRef(0);
  const lastCountdownSecondRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const completedRef = useRef(false);
  const startedAtRef = useRef(performance.now());
  const [score, setScore] = useState(0);
  const [signalsStacked, setSignalsStacked] = useState(0);
  const [perfectStacks, setPerfectStacks] = useState(0);
  const [remainingMs, setRemainingMs] = useState(ARCADE_INTEL_STACK_GAME_DURATION_MS);
  const [activeSignals, setActiveSignals] = useState<ArcadeIntelStackSignal[]>([]);
  const [towerHeights, setTowerHeights] = useState(() =>
    createArcadeIntelStackTowerHeights(config.columnCount),
  );
  const [tickNow, setTickNow] = useState(performance.now());
  const [hitFlashColumn, setHitFlashColumn] = useState<number | null>(null);

  const accentStyle = {
    '--arcade-intel-accent': props.cabinetAccent,
    '--arcade-intel-glow': props.cabinetGlow,
  } as CSSProperties;

  const finishGame = useCallback(
    (reason: 'complete' | 'forfeit' | 'defeat'): void => {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
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

      const elapsed = performance.now() - startedAtRef.current;
      const finalRemaining = Math.max(0, ARCADE_INTEL_STACK_GAME_DURATION_MS - elapsed);
      const bonus = arcadeIntelStackSurviveBonus(finalRemaining, scoreRef.current);
      const finalScore = scoreRef.current + bonus;

      if (bonus > 0) {
        scoreRef.current = finalScore;
        setScore(finalScore);
      }

      playArcadeGameOverSfx();

      props.onComplete({
        score: finalScore,
        signalsStacked: signalsStackedRef.current,
        perfectStacks: perfectStacksRef.current,
        mode: props.mode,
      });
    },
    [props],
  );

  const applyResolveResults = useCallback(
    (results: ArcadeIntelStackResolveResult[], columnForMiss: number | null): void => {
      let nextScore = scoreRef.current;
      let nextStacked = signalsStackedRef.current;
      let nextPerfect = perfectStacksRef.current;
      let nextTowers = [...towerHeightsRef.current];
      let playedPositive = false;
      let playedNegative = false;

      for (const result of results) {
        nextScore += result.scoreDelta;

        if (result.type === 'stacked') {
          nextStacked += 1;
          if (result.quality === 'perfect') {
            nextPerfect += 1;
          }
          nextTowers = arcadeIntelStackTowerAfterStack(nextTowers, columnForMiss ?? 0);
          playedPositive = true;
        }

        if (result.type === 'missed-signal' && columnForMiss !== null) {
          nextTowers = arcadeIntelStackTowerAfterMiss(nextTowers, columnForMiss);
          playedNegative = true;
        }

        if (result.type === 'empty-column') {
          playedNegative = result.scoreDelta < 0;
        }
      }

      scoreRef.current = Math.max(0, nextScore);
      signalsStackedRef.current = nextStacked;
      perfectStacksRef.current = nextPerfect;
      towerHeightsRef.current = nextTowers;
      setScore(scoreRef.current);
      setSignalsStacked(nextStacked);
      setPerfectStacks(nextPerfect);
      setTowerHeights(nextTowers);

      if (playedPositive) {
        playArcadeBubblePopSfx();
      } else if (playedNegative) {
        playArcadeDropWindowBuzzerSfx();
      }
    },
    [],
  );

  const handleColumnPress = useCallback(
    (column: number): void => {
      if (completedRef.current) {
        return;
      }

      const now = performance.now();
      const resolved = resolveArcadeIntelStackColumnPress(signalsRef.current, column, now);

      if (resolved.resolvedSignalId) {
        signalsRef.current = removeArcadeIntelStackSignal(
          signalsRef.current,
          resolved.resolvedSignalId,
        );
        setActiveSignals([...signalsRef.current]);
      }

      applyResolveResults([resolved.result], column);
      setHitFlashColumn(column);
      window.setTimeout(() => setHitFlashColumn(null), 180);
    },
    [applyResolveResults],
  );

  useEffect(() => {
    playArcadeGameStartSfx();
    startedAtRef.current = performance.now();
    towerHeightsRef.current = createArcadeIntelStackTowerHeights(config.columnCount);
    setTowerHeights(towerHeightsRef.current);

    function tickFrame(now: number): void {
      if (pausedRef.current || completedRef.current) {
        frameRef.current = requestAnimationFrame(tickFrame);
        return;
      }

      const elapsed = now - startedAtRef.current;
      const nextRemaining = Math.max(0, ARCADE_INTEL_STACK_GAME_DURATION_MS - elapsed);
      setRemainingMs(nextRemaining);
      setTickNow(now);

      const spawned = spawnArcadeIntelStackSignals(
        config,
        now,
        lastSpawnAtRef.current,
        signalsRef.current,
      );
      lastSpawnAtRef.current = spawned.lastSpawnAt;

      const expiringSignals = spawned.signals.filter((signal) =>
        isArcadeIntelStackSignalExpired(signal, now),
      );
      const expired = expireArcadeIntelStackSignals(spawned.signals, now);
      signalsRef.current = expired.signals;
      setActiveSignals([...signalsRef.current]);

      expiringSignals.forEach((signal, index) => {
        const result = expired.results[index];

        if (result) {
          applyResolveResults([result], signal.column);
        }
      });

      const countdownSecond = Math.ceil(nextRemaining / 1000);
      if (
        countdownSecond <= 10 &&
        countdownSecond > 0 &&
        lastCountdownSecondRef.current !== countdownSecond
      ) {
        lastCountdownSecondRef.current = countdownSecond;
        playArcadeGameCountdownTickSfx(countdownSecond);
      }

      if (nextRemaining <= 0) {
        finishGame('complete');
        return;
      }

      if (!prefersReducedMotion() && Math.floor(now / 900) !== Math.floor((now - 16) / 900)) {
        playArcadeGameTickSfx();
      }

      frameRef.current = requestAnimationFrame(tickFrame);
    }

    frameRef.current = requestAnimationFrame(tickFrame);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [applyResolveResults, config, finishGame]);

  useEffect(() => {
    const unsubscribeVisibility = subscribeVisibilityPause((paused) => {
      pausedRef.current = paused;
    });

    return unsubscribeVisibility;
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (completedRef.current) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        finishGame('forfeit');
        return;
      }

      if (!arcadeIntelStackAcceptedKeys().includes(event.key)) {
        return;
      }

      const column = readArcadeIntelStackFromKey(event.key, config.columnCount);

      if (column === null) {
        return;
      }

      event.preventDefault();
      handleColumnPress(column);
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.columnCount, finishGame, handleColumnPress]);

  return (
    <div className="arcade-intel-stack-game" style={accentStyle}>
      <div className="arcade-intel-stack-game-hud">
        <div className="arcade-intel-stack-game-hud-stats">
          <div className="arcade-intel-stack-game-hud-block">
            <span>G banked</span>
            <strong>{formatArcadeG(score)}</strong>
          </div>
          <div className="arcade-intel-stack-game-hud-block">
            <span>Time</span>
            <strong
              className={isArcadeCountdownWarning(remainingMs) ? 'is-arcade-time-warning' : ''}
              style={arcadeCountdownWarningStyle(remainingMs)}
            >
              {formatCountdown(remainingMs)}
            </strong>
          </div>
          <div className="arcade-intel-stack-game-hud-block">
            <span>Stacked</span>
            <strong>{signalsStacked}</strong>
          </div>
          <div className="arcade-intel-stack-game-hud-block">
            <span>Perfect</span>
            <strong>{perfectStacks}</strong>
          </div>
        </div>

        <button
          className="arcade-intel-stack-game-exit-button"
          onClick={() => finishGame('forfeit')}
          type="button"
        >
          Exit run
        </button>
      </div>

      <div aria-label="Intel stack signal towers" className="arcade-intel-stack-game-field">
        {Array.from({ length: config.columnCount }, (_, column) => {
          const signal = activeSignals.find((entry) => entry.column === column) ?? null;
          const progress = signal ? arcadeIntelStackSignalProgress(signal, tickNow) : 0;
          const height = towerHeights[column] ?? 0;

          return (
            <div
              className={
                'arcade-intel-stack-game-column' +
                (signal ? ' has-active-signal' : '') +
                (hitFlashColumn === column ? ' is-hit-flash' : '')
              }
              key={column}
            >
              <span className="arcade-intel-stack-game-column-label">{COLUMN_LABELS[column]}</span>
              <div className="arcade-intel-stack-game-tower">
                {Array.from({ length: height }, (_, blockIndex) => (
                  <span
                    aria-hidden="true"
                    className="arcade-intel-stack-game-block"
                    key={column + '-block-' + blockIndex}
                  />
                ))}
              </div>
              {signal ? (
                <div className="arcade-intel-stack-game-signal">
                  <span className="arcade-intel-stack-game-signal-core" />
                  <span
                    className="arcade-intel-stack-game-signal-meter"
                    style={{ transform: 'scaleX(' + progress.toFixed(3) + ')' }}
                  />
                </div>
              ) : (
                <div className="arcade-intel-stack-game-signal is-idle">
                  <span className="arcade-intel-stack-game-signal-core" />
                </div>
              )}
              <button
                className="arcade-intel-stack-game-column-button"
                onClick={() => handleColumnPress(column)}
                type="button"
              >
                Stack
              </button>
            </div>
          );
        })}
      </div>

      <p className="arcade-intel-stack-game-hint">
        Press 1–{config.columnCount} or Q/W/E{config.columnCount > 3 ? '/R/T' : ''} to stack the
        active signal before it dies. Perfect timing near expiry banks +5 G. Survive the full run
        above zero for +{ARCADE_INTEL_STACK_SURVIVE_BONUS} G.
      </p>
    </div>
  );
}

function isArcadeIntelStackSignalExpired(signal: ArcadeIntelStackSignal, now: number): boolean {
  return now >= signal.expiresAt;
}