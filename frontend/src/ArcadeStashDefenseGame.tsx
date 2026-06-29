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
  ARCADE_STASH_DEFENSE_GAME_DURATION_MS,
  ARCADE_STASH_DEFENSE_HIT_FLASH_MS,
  ARCADE_STASH_DEFENSE_KILL_SCORE,
  ARCADE_STASH_DEFENSE_LANE_COUNT,
  ARCADE_STASH_DEFENSE_STASH_HIT_PENALTY,
  ARCADE_STASH_DEFENSE_SURVIVE_BONUS,
  arcadeStashDefenseGameConfig,
  arcadeStashDefenseSurviveBonus,
  canShootArcadeStashDefenseLane,
  createArcadeStashDefenseState,
  formatArcadeStashDefenseLives,
  isArcadeStashDefenseDefeated,
  readArcadeStashDefenseLaneFromKey,
  shootArcadeStashDefenseLane,
  spawnArcadeStashDefenseEnemy,
  updateArcadeStashDefenseBullets,
  updateArcadeStashDefenseEnemies,
  type ArcadeStashDefenseBullet,
  type ArcadeStashDefenseEnemy,
  type ArcadeStashDefenseMode,
  type ArcadeStashDefenseState,
} from './arcade-stash-defense-game.js';
import {
  arcadeCountdownWarningStyle,
  isArcadeCountdownWarning,
} from './arcade-countdown-ui.js';
import { formatArcadeG } from './arcade-score.js';
import {
  playArcadeDropWindowBuzzerSfx,
  playArcadeGameCountdownTickSfx,
  playArcadeGameOverSfx,
  playArcadeGameStartSfx,
  playArcadeGameTickSfx,
  playArcadeStashBulletHitSfx,
} from './nami-sfx.js';
import { prefersReducedMotion, subscribeVisibilityPause } from './perf-utils.js';

export type ArcadeStashDefenseGameSummary = {
  score: number;
  enemiesRepelled: number;
  mode: ArcadeStashDefenseMode;
};

type ArcadeStashDefenseGameProps = {
  mode: ArcadeStashDefenseMode;
  cabinetAccent: string;
  cabinetGlow: string;
  onComplete: (summary: ArcadeStashDefenseGameSummary) => void;
  onForfeit?: () => void;
};

const LANE_LABELS = ['LOW', 'MID', 'HIGH'] as const;

function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return String(minutes) + ':' + String(seconds).padStart(2, '0');
}

export function ArcadeStashDefenseGame(props: ArcadeStashDefenseGameProps): ReactElement {
  const config = useMemo(() => arcadeStashDefenseGameConfig(props.mode), [props.mode]);
  const enemiesRef = useRef<ArcadeStashDefenseEnemy[]>([]);
  const bulletsRef = useRef<ArcadeStashDefenseBullet[]>([]);
  const stateRef = useRef<ArcadeStashDefenseState>(createArcadeStashDefenseState(config));
  const bulletSpawnCountRef = useRef(0);
  const scoreRef = useRef(0);
  const repelledRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const hitFlashTimeoutRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const completedRef = useRef(false);
  const startedAtRef = useRef(performance.now());
  const lastCountdownSecondRef = useRef<number | null>(null);
  const [score, setScore] = useState(0);
  const [repelled, setRepelled] = useState(0);
  const [stashHp, setStashHp] = useState(config.stashHp);
  const [playerLives, setPlayerLives] = useState<number | null>(config.playerLives);
  const [remainingMs, setRemainingMs] = useState(ARCADE_STASH_DEFENSE_GAME_DURATION_MS);
  const [enemies, setEnemies] = useState<ArcadeStashDefenseEnemy[]>([]);
  const [bullets, setBullets] = useState<ArcadeStashDefenseBullet[]>([]);
  const [burstReadyAt, setBurstReadyAt] = useState<number[]>(() =>
    Array.from({ length: ARCADE_STASH_DEFENSE_LANE_COUNT }, () => 0),
  );
  const [burstShotsInBurst, setBurstShotsInBurst] = useState<number[]>(() =>
    Array.from({ length: ARCADE_STASH_DEFENSE_LANE_COUNT }, () => 0),
  );
  const [tickNow, setTickNow] = useState(performance.now());
  const [hitFlashActive, setHitFlashActive] = useState(false);
  const [hitFlashToken, setHitFlashToken] = useState(0);

  const finishGame = useCallback(
    (reason: 'complete' | 'defeat' | 'forfeit'): void => {
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

      if (hitFlashTimeoutRef.current !== null) {
        window.clearTimeout(hitFlashTimeoutRef.current);
        hitFlashTimeoutRef.current = null;
      }

      if (reason === 'forfeit') {
        props.onForfeit?.();
        return;
      }

      playArcadeGameOverSfx();
      props.onComplete({
        score: scoreRef.current,
        enemiesRepelled: repelledRef.current,
        mode: props.mode,
      });
    },
    [props],
  );

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
    }, ARCADE_STASH_DEFENSE_HIT_FLASH_MS);
  }, []);

  const syncLaneBurstUi = useCallback((): void => {
    setBurstReadyAt([...stateRef.current.burstCooldownUntil]);
    setBurstShotsInBurst([...stateRef.current.burstShotsInBurst]);
  }, []);

  const applyBulletResults = useCallback((kills: number, hits: number): void => {
    if (kills > 0) {
      scoreRef.current += kills * ARCADE_STASH_DEFENSE_KILL_SCORE;
      repelledRef.current += kills;
      setScore(scoreRef.current);
      setRepelled(repelledRef.current);
      playArcadeGameTickSfx();
    } else if (hits > 0) {
      playArcadeStashBulletHitSfx();
    }
  }, []);

  const tryShootLane = useCallback(
    (lane: number): void => {
      if (completedRef.current || pausedRef.current) {
        return;
      }

      const now = performance.now();
      const shot = shootArcadeStashDefenseLane(
        lane,
        bulletsRef.current,
        stateRef.current,
        config,
        now,
        bulletSpawnCountRef.current,
      );

      if (!shot.shot) {
        return;
      }

      bulletSpawnCountRef.current += 1;
      bulletsRef.current = shot.bullets;
      stateRef.current = shot.state;

      setBullets([...bulletsRef.current]);
      syncLaneBurstUi();
    },
    [config, syncLaneBurstUi],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (completedRef.current || event.repeat) {
        return;
      }

      const lane = readArcadeStashDefenseLaneFromKey(event.key);

      if (lane !== null) {
        tryShootLane(lane);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [tryShootLane]);

  useEffect(() => {
    playArcadeGameStartSfx();
    startedAtRef.current = performance.now();
    completedRef.current = false;
    pausedRef.current = false;
    scoreRef.current = 0;
    repelledRef.current = 0;
    bulletSpawnCountRef.current = 0;
    enemiesRef.current = [];
    bulletsRef.current = [];
    stateRef.current = createArcadeStashDefenseState(config);
    setScore(0);
    setRepelled(0);
    setStashHp(config.stashHp);
    setPlayerLives(config.playerLives);
    setRemainingMs(ARCADE_STASH_DEFENSE_GAME_DURATION_MS);
    setEnemies([]);
    setBullets([]);
    setBurstReadyAt(Array.from({ length: ARCADE_STASH_DEFENSE_LANE_COUNT }, () => 0));
    setBurstShotsInBurst(Array.from({ length: ARCADE_STASH_DEFENSE_LANE_COUNT }, () => 0));
    setHitFlashActive(false);
    setHitFlashToken(0);
    lastCountdownSecondRef.current = null;

    timerRef.current = window.setInterval(() => {
      if (pausedRef.current || completedRef.current) {
        return;
      }

      const elapsed = performance.now() - startedAtRef.current;
      const nextRemaining = Math.max(0, ARCADE_STASH_DEFENSE_GAME_DURATION_MS - elapsed);
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
        const bonus = arcadeStashDefenseSurviveBonus(stateRef.current, nextRemaining);
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
      setTickNow(now);

      if (pausedRef.current || completedRef.current) {
        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      if (!reducedMotion) {
        const spawned = spawnArcadeStashDefenseEnemy(
          enemiesRef.current,
          config,
          now,
          stateRef.current,
        );
        enemiesRef.current = spawned.enemies;
        stateRef.current = spawned.state;

        const advanced = updateArcadeStashDefenseEnemies(enemiesRef.current, stateRef.current);
        enemiesRef.current = advanced.enemies;
        stateRef.current = advanced.state;

        if (advanced.stashHits > 0) {
          scoreRef.current = Math.max(
            0,
            scoreRef.current - advanced.stashHits * ARCADE_STASH_DEFENSE_STASH_HIT_PENALTY,
          );
          setScore(scoreRef.current);
          triggerHitFlash();
        }

        const bulletUpdate = updateArcadeStashDefenseBullets(
          bulletsRef.current,
          enemiesRef.current,
          config,
        );
        bulletsRef.current = bulletUpdate.bullets;
        enemiesRef.current = bulletUpdate.enemies;

        if (bulletUpdate.kills > 0 || bulletUpdate.hits > 0) {
          applyBulletResults(bulletUpdate.kills, bulletUpdate.hits);
        }

        setStashHp(stateRef.current.stashHp);
        setPlayerLives(stateRef.current.playerLives);
        setEnemies([...enemiesRef.current]);
        setBullets([...bulletsRef.current]);
        syncLaneBurstUi();
      }

      if (isArcadeStashDefenseDefeated(stateRef.current)) {
        finishGame('defeat');
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
  }, [applyBulletResults, config, finishGame, syncLaneBurstUi, triggerHitFlash]);

  const accentStyle = {
    '--arcade-stash-accent': props.cabinetAccent,
    '--arcade-stash-glow': props.cabinetGlow,
  } as CSSProperties;

  return (
    <div
      className={'arcade-stash-defense-game' + (hitFlashActive ? ' is-hit-flash' : '')}
      data-hit-flash={hitFlashToken}
      style={accentStyle}
    >
      <div className="arcade-stash-defense-game-hud">
        <div className="arcade-stash-defense-game-hud-stats">
          <div className="arcade-stash-defense-game-hud-block">
            <span>G</span>
            <strong>{score}</strong>
          </div>
          <div className="arcade-stash-defense-game-hud-block">
            <span>{config.playerLives === null ? 'Stash' : 'Lives'}</span>
            <strong>
              {config.playerLives === null ? stashHp : formatArcadeStashDefenseLives(playerLives)}
            </strong>
          </div>
          <div
            className={
              'arcade-stash-defense-game-hud-block' +
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
          <div className="arcade-stash-defense-game-hud-block">
            <span>Repelled</span>
            <strong>{repelled}</strong>
          </div>
        </div>
        <button
          className="arcade-stash-defense-game-exit-button"
          onClick={() => finishGame('forfeit')}
          type="button"
        >
          Exit game
        </button>
      </div>

      <div aria-label="Three lane stash defense field" className="arcade-stash-defense-game-field">
        <div className="arcade-stash-defense-game-stash" aria-label="Crew stash">
          <span>STASH</span>
        </div>
        {Array.from({ length: ARCADE_STASH_DEFENSE_LANE_COUNT }, (_, laneIndex) => {
          const shotsInBurst = burstShotsInBurst[laneIndex] ?? 0;
          const canShoot = canShootArcadeStashDefenseLane(
            laneIndex,
            {
              ...stateRef.current,
              burstShotsInBurst,
              burstCooldownUntil: burstReadyAt,
            },
            tickNow,
            config,
          );
          const cooling = !config.freeShoot && !canShoot;

          return (
            <div className="arcade-stash-defense-game-lane" key={'lane-' + laneIndex}>
              <button
                className={'arcade-stash-defense-game-lane-button' + (cooling ? ' is-cooling' : '')}
                onClick={() => tryShootLane(laneIndex)}
                type="button"
              >
                <span className="arcade-stash-defense-game-lane-label">{LANE_LABELS[laneIndex]}</span>
                <span className="arcade-stash-defense-game-lane-action">
                  SHOOT {laneIndex + 1}
                  {!config.freeShoot && shotsInBurst > 0
                    ? ' · ' + shotsInBurst + '/' + config.burstSize
                    : ''}
                </span>
              </button>
              {bullets
                .filter((bullet) => bullet.lane === laneIndex)
                .map((bullet) => (
                  <span
                    aria-hidden="true"
                    className="arcade-stash-defense-game-bullet"
                    key={bullet.id}
                    style={{ left: bullet.x + '%' }}
                  />
                ))}
              {enemies
                .filter((enemy) => enemy.lane === laneIndex)
                .map((enemy) => (
                  <span
                    aria-hidden="true"
                    className="arcade-stash-defense-game-enemy"
                    key={enemy.id}
                    style={{ left: enemy.x + '%' }}
                  >
                    <span className="arcade-stash-defense-game-enemy-label">{enemy.label}</span>
                    <span className="arcade-stash-defense-game-enemy-hp">{enemy.hp}</span>
                  </span>
                ))}
            </div>
          );
        })}
        <p className="arcade-stash-defense-game-hint">
          1/2/3 or Q/W/E to shoot lanes ·{' '}
          {config.freeShoot
            ? 'Free fire — no reload lag'
            : 'Burst of ' + config.burstSize + ' shots'}{' '}
          · Each raider takes up to {config.enemyHpMax} hits · Hold the stash for{' '}
          {formatArcadeG(ARCADE_STASH_DEFENSE_SURVIVE_BONUS, true)} bonus
        </p>
      </div>
    </div>
  );
}