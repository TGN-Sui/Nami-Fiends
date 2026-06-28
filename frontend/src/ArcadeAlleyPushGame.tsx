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
  ARCADE_ALLEY_PUSH_CREW_PASS_LANE,
  ARCADE_ALLEY_PUSH_CREW_PASS_SCORE,
  ARCADE_ALLEY_PUSH_GAME_DURATION_MS,
  ARCADE_ALLEY_PUSH_HIT_PENALTY,
  ARCADE_ALLEY_PUSH_LANE_COUNT,
  applyArcadeAlleyPushLaneStep,
  arcadeAlleyPushCollision,
  arcadeAlleyPushGameConfig,
  arcadeAlleyPushHazardTrackY,
  arcadeAlleyPushPlayerTrackY,
  createArcadeAlleyPushPlayer,
  moveArcadeAlleyPushPlayerHorizontal,
  resetArcadeAlleyPushPlayerAfterHit,
  resetArcadeAlleyPushPlayerAfterPass,
  shouldAwardArcadeAlleyPushPass,
  spawnArcadeAlleyPushHazards,
  updateArcadeAlleyPushHazards,
  type ArcadeAlleyPushHazard,
  type ArcadeAlleyPushMode,
  type ArcadeAlleyPushPlayer,
} from './arcade-alley-push-game.js';
import { formatArcadeG } from './arcade-score.js';
import {
  playArcadeBubblePopSfx,
  playArcadeGameOverSfx,
  playArcadeGameStartSfx,
  playArcadeGameTickSfx,
} from './nami-sfx.js';
import { prefersReducedMotion, subscribeVisibilityPause } from './perf-utils.js';

export type ArcadeAlleyPushGameSummary = {
  score: number;
  passesCompleted: number;
  mode: ArcadeAlleyPushMode;
};

type ArcadeAlleyPushGameProps = {
  mode: ArcadeAlleyPushMode;
  cabinetAccent: string;
  cabinetGlow: string;
  onComplete: (summary: ArcadeAlleyPushGameSummary) => void;
  onForfeit?: () => void;
};

type HorizontalInput = {
  left: boolean;
  right: boolean;
};

function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return String(minutes) + ':' + String(seconds).padStart(2, '0');
}

function readHorizontalInput(keys: Set<string>): HorizontalInput {
  return {
    left: keys.has('ArrowLeft') || keys.has('a') || keys.has('A'),
    right: keys.has('ArrowRight') || keys.has('d') || keys.has('D'),
  };
}

function readLaneDirection(key: string): 'up' | 'down' | null {
  if (key === 'ArrowUp' || key === 'w' || key === 'W') {
    return 'up';
  }

  if (key === 'ArrowDown' || key === 's' || key === 'S') {
    return 'down';
  }

  return null;
}

export function ArcadeAlleyPushGame(props: ArcadeAlleyPushGameProps): ReactElement {
  const config = useMemo(() => arcadeAlleyPushGameConfig(props.mode), [props.mode]);
  const keysRef = useRef(new Set<string>());
  const playerRef = useRef<ArcadeAlleyPushPlayer>(createArcadeAlleyPushPlayer(performance.now()));
  const hazardsRef = useRef<ArcadeAlleyPushHazard[]>(spawnArcadeAlleyPushHazards(config));
  const scoreRef = useRef(0);
  const passesRef = useRef(0);
  const lastLaneChangeAtRef = useRef(0);
  const lastPassAtRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const completedRef = useRef(false);
  const startedAtRef = useRef(performance.now());
  const [score, setScore] = useState(0);
  const [passes, setPasses] = useState(0);
  const [remainingMs, setRemainingMs] = useState(ARCADE_ALLEY_PUSH_GAME_DURATION_MS);
  const [playerLane, setPlayerLane] = useState(0);
  const [playerTrack, setPlayerTrack] = useState(1);
  const [playerX, setPlayerX] = useState(50);
  const [hazards, setHazards] = useState<ArcadeAlleyPushHazard[]>(() => hazardsRef.current);
  const [isInvincible, setIsInvincible] = useState(true);

  const finishGame = useCallback(
    (reason: 'complete' | 'forfeit'): void => {
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
        passesCompleted: passesRef.current,
        mode: props.mode,
      });
    },
    [props],
  );

  const tryLaneStep = useCallback((direction: 'up' | 'down'): void => {
    if (completedRef.current || pausedRef.current) {
      return;
    }

    const now = performance.now();
    const previousLane = playerRef.current.lane;
    const laneStep = applyArcadeAlleyPushLaneStep(
      playerRef.current,
      direction,
      config,
      lastLaneChangeAtRef.current,
      now,
    );

    if (!laneStep.moved) {
      return;
    }

    lastLaneChangeAtRef.current = laneStep.lastLaneChangeAt;
    playerRef.current = laneStep.player;

    if (
      shouldAwardArcadeAlleyPushPass(
        previousLane,
        playerRef.current.lane,
        lastPassAtRef.current,
        now,
      )
    ) {
      scoreRef.current += ARCADE_ALLEY_PUSH_CREW_PASS_SCORE;
      passesRef.current += 1;
      lastPassAtRef.current = now;
      setScore(scoreRef.current);
      setPasses(passesRef.current);
      playArcadeGameTickSfx();
      playerRef.current = resetArcadeAlleyPushPlayerAfterPass(playerRef.current, now);
    }

    setPlayerLane(playerRef.current.lane);
    setPlayerTrack(playerRef.current.track);
    setPlayerX(playerRef.current.x);
    setIsInvincible(now < playerRef.current.invincibleUntil);
  }, [config]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (completedRef.current) {
        return;
      }

      keysRef.current.add(event.key);

      if (event.repeat) {
        return;
      }

      const direction = readLaneDirection(event.key);

      if (direction) {
        tryLaneStep(direction);
      }
    }

    function handleKeyUp(event: KeyboardEvent): void {
      keysRef.current.delete(event.key);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysRef.current.clear();
    };
  }, [tryLaneStep]);

  useEffect(() => {
    playArcadeGameStartSfx();
    startedAtRef.current = performance.now();
    completedRef.current = false;
    pausedRef.current = false;
    scoreRef.current = 0;
    passesRef.current = 0;
    lastLaneChangeAtRef.current = 0;
    lastPassAtRef.current = 0;
    playerRef.current = createArcadeAlleyPushPlayer(performance.now());
    hazardsRef.current = spawnArcadeAlleyPushHazards(config);
    setScore(0);
    setPasses(0);
    setRemainingMs(ARCADE_ALLEY_PUSH_GAME_DURATION_MS);
    setPlayerLane(playerRef.current.lane);
    setPlayerTrack(playerRef.current.track);
    setPlayerX(playerRef.current.x);
    setHazards(hazardsRef.current);
    setIsInvincible(true);

    timerRef.current = window.setInterval(() => {
      if (pausedRef.current || completedRef.current) {
        return;
      }

      const elapsed = performance.now() - startedAtRef.current;
      const nextRemaining = Math.max(0, ARCADE_ALLEY_PUSH_GAME_DURATION_MS - elapsed);
      setRemainingMs(nextRemaining);

      if (nextRemaining <= 0) {
        finishGame('complete');
      }
    }, 250);

    const reducedMotion = prefersReducedMotion();

    function tick(now: number): void {
      if (pausedRef.current || completedRef.current) {
        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const input = readHorizontalInput(keysRef.current);
      playerRef.current = moveArcadeAlleyPushPlayerHorizontal(playerRef.current, input, config);

      const collision = arcadeAlleyPushCollision(
        playerRef.current,
        hazardsRef.current,
        now,
        config,
      );

      if (collision) {
        scoreRef.current = Math.max(0, scoreRef.current - ARCADE_ALLEY_PUSH_HIT_PENALTY);
        setScore(scoreRef.current);
        playArcadeBubblePopSfx('small');
        playerRef.current = resetArcadeAlleyPushPlayerAfterHit(playerRef.current, now);
      }

      if (!reducedMotion) {
        hazardsRef.current = updateArcadeAlleyPushHazards(hazardsRef.current, config);
        setHazards([...hazardsRef.current]);
      }

      setPlayerLane(playerRef.current.lane);
      setPlayerTrack(playerRef.current.track);
      setPlayerX(playerRef.current.x);
      setIsInvincible(now < playerRef.current.invincibleUntil);
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
    };
  }, [config, finishGame]);

  const laneLabels = ['START', 'LANE 1', 'LANE 2', 'LANE 3', 'CREW PASS'];
  const accentStyle = {
    '--arcade-alley-accent': props.cabinetAccent,
    '--arcade-alley-glow': props.cabinetGlow,
  } as CSSProperties;

  return (
    <div
      className={
        'arcade-alley-push-game' +
        (config.hazardTracksPerLane > 1 ? ' is-heat-chase' : '')
      }
      style={accentStyle}
    >
      <div className="arcade-alley-push-game-hud">
        <div className="arcade-alley-push-game-hud-stats">
          <div className="arcade-alley-push-game-hud-block">
            <span>G</span>
            <strong>{score}</strong>
          </div>
          <div className="arcade-alley-push-game-hud-block">
            <span>Time</span>
            <strong className={remainingMs <= 10_000 ? 'is-arcade-time-warning' : ''}>
              {formatCountdown(remainingMs)}
            </strong>
          </div>
          <div className="arcade-alley-push-game-hud-block">
            <span>Passes</span>
            <strong>{passes}</strong>
          </div>
        </div>
        <button
          className="arcade-alley-push-game-exit-button"
          onClick={() => finishGame('forfeit')}
          type="button"
        >
          Exit game
        </button>
      </div>

      <div aria-label="Five lane alley crossing field" className="arcade-alley-push-game-field">
        {Array.from({ length: ARCADE_ALLEY_PUSH_LANE_COUNT }, (_, displayIndex) => {
          const laneIndex = ARCADE_ALLEY_PUSH_LANE_COUNT - 1 - displayIndex;

          return (
            <div
              className={
                'arcade-alley-push-game-lane' +
                (laneIndex === ARCADE_ALLEY_PUSH_CREW_PASS_LANE ? ' is-crew-pass-lane' : '') +
                (laneIndex === 0 ? ' is-start-lane' : '')
              }
              key={'lane-' + laneIndex}
            >
              <span className="arcade-alley-push-game-lane-label">{laneLabels[laneIndex]}</span>
              {laneIndex === playerLane ? (
                <span
                  aria-label="Crew runner"
                  className={
                    'arcade-alley-push-game-player' + (isInvincible ? ' is-invincible' : '')
                  }
                  style={{
                    left: playerX + '%',
                    top: arcadeAlleyPushPlayerTrackY(
                      { lane: playerLane, track: playerTrack, x: playerX, invincibleUntil: 0 },
                      config,
                    ) + '%',
                  }}
                />
              ) : null}
              {hazards
                .filter((hazard) => hazard.lane === laneIndex)
                .map((hazard) => (
                  <span
                    aria-hidden="true"
                    className="arcade-alley-push-game-hazard"
                    key={hazard.id}
                    style={{
                      left: hazard.x + '%',
                      top: arcadeAlleyPushHazardTrackY(hazard.track, config.hazardTracksPerLane) + '%',
                      width: hazard.width + '%',
                    }}
                  >
                    {hazard.label}
                  </span>
                ))}
            </div>
          );
        })}
        <p className="arcade-alley-push-game-hint">
          {config.hazardTracksPerLane > 1
            ? '↑↓ switch rows and cross lanes · ←→ strafe · Reach CREW PASS for ' +
              formatArcadeG(ARCADE_ALLEY_PUSH_CREW_PASS_SCORE, true)
            : 'Arrow keys or WASD to move · Reach CREW PASS for ' +
              formatArcadeG(ARCADE_ALLEY_PUSH_CREW_PASS_SCORE, true)}
        </p>
      </div>
    </div>
  );
}