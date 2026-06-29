import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from 'react';

import { ArcadeBrickedUpSprite } from './ArcadeBrickedUpSprite.js';
import {
  arcadeBrickedUpBrickSpriteSlot,
  arcadeBrickedUpHazardDisplayScale,
  arcadeBrickedUpHazardSpriteSlot,
} from './arcade-bricked-up-sprites.js';
import {
  ARCADE_BRICKED_UP_BALL_RADIUS,
  ARCADE_BRICKED_UP_COMPLETE_BONUS,
  ARCADE_BRICKED_UP_STARTING_LIVES,
  arcadeBrickedUpGameConfig,
  aimArcadeBrickedUpPaddleFromPointer,
  computeArcadeBrickedUpModifiers,
  createArcadeBrickedUpState,
  effectiveArcadeBrickedUpBallRadius,
  effectiveArcadeBrickedUpPaddleWidth,
  hasArcadeBrickedUpUnlaunchedBalls,
  isArcadeBrickedUpDefeated,
  isArcadeBrickedUpHazardFlashing,
  isArcadeBrickedUpVictory,
  launchArcadeBrickedUpBalls,
  readArcadeBrickedUpActiveEffectChips,
  readArcadeBrickedUpPaddleDirection,
  readArcadeBrickedUpSpotlightBall,
  updateArcadeBrickedUpState,
  type ArcadeBrickedUpBall,
  type ArcadeBrickedUpBrick,
  type ArcadeBrickedUpExplosion,
  type ArcadeBrickedUpHazard,
  type ArcadeBrickedUpMode,
  type ArcadeBrickedUpMysteryDrop,
  type ArcadeBrickedUpProjectile,
  type ArcadeBrickedUpState,
} from './arcade-bricked-up-game.js';
import { ARCADE_SKILL_DIFF_MODE } from './arcade-skill-diff.js';
import { formatArcadeG } from './arcade-score.js';
import {
  playArcadeDropWindowBuzzerSfx,
  playArcadeGameOverSfx,
  playArcadeGameStartSfx,
  playArcadeGameTickSfx,
  playArcadeStashBulletHitSfx,
} from './nami-sfx.js';
import { prefersReducedMotion, subscribeVisibilityPause } from './perf-utils.js';

export type ArcadeBrickedUpGameSummary = {
  score: number;
  bricksBroken: number;
  levelsCleared: number;
  mode: ArcadeBrickedUpMode;
};

type ArcadeBrickedUpGameProps = {
  mode: ArcadeBrickedUpMode;
  cabinetAccent: string;
  cabinetGlow: string;
  onComplete: (summary: ArcadeBrickedUpGameSummary) => void;
  onForfeit?: () => void;
};

export function ArcadeBrickedUpGame(props: ArcadeBrickedUpGameProps): ReactElement {
  const config = useMemo(() => arcadeBrickedUpGameConfig(props.mode), [props.mode]);
  const keysRef = useRef(new Set<string>());
  const stateRef = useRef<ArcadeBrickedUpState>(createArcadeBrickedUpState(config));
  const pointerActiveRef = useRef(false);
  const pointerXRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const completedRef = useRef(false);
  const lastBrickCountRef = useRef(stateRef.current.bricks.length);
  const livesRef = useRef(config.startingLives);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(config.startingLives);
  const [levelDisplay, setLevelDisplay] = useState(1);
  const [bricksBroken, setBricksBroken] = useState(0);
  const [paddleX, setPaddleX] = useState(stateRef.current.paddleX);
  const [balls, setBalls] = useState<ArcadeBrickedUpBall[]>(stateRef.current.balls);
  const [bricks, setBricks] = useState<ArcadeBrickedUpBrick[]>(stateRef.current.bricks);
  const [drops, setDrops] = useState<ArcadeBrickedUpMysteryDrop[]>([]);
  const [hazards, setHazards] = useState<ArcadeBrickedUpHazard[]>([]);
  const [projectiles, setProjectiles] = useState<ArcadeBrickedUpProjectile[]>([]);
  const [explosions, setExplosions] = useState<ArcadeBrickedUpExplosion[]>([]);
  const [effectChips, setEffectChips] = useState(readArcadeBrickedUpActiveEffectChips(stateRef.current));
  const [hazardFlashing, setHazardFlashing] = useState(false);
  const [awaitingServe, setAwaitingServe] = useState(true);
  const [magnetHeld, setMagnetHeld] = useState(false);
  const [darkModeActive, setDarkModeActive] = useState(false);
  const [spotlightBallId, setSpotlightBallId] = useState<string | null>(null);
  const [hasHeldSkillBall, setHasHeldSkillBall] = useState(false);
  const [paddleWidth, setPaddleWidth] = useState(config.paddleWidth);
  const [ballSizePx, setBallSizePx] = useState(10);

  const finishGame = useCallback(
    (reason: 'victory' | 'defeat' | 'forfeit'): void => {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      if (reason === 'forfeit') {
        props.onForfeit?.();
        return;
      }

      playArcadeGameOverSfx();

      const levelsCleared = isArcadeBrickedUpVictory(stateRef.current, config)
        ? config.levelCount
        : stateRef.current.levelIndex;

      props.onComplete({
        score: stateRef.current.score,
        bricksBroken: stateRef.current.bricksBroken,
        levelsCleared,
        mode: props.mode,
      });
    },
    [config, props],
  );

  const tryLaunch = useCallback((): void => {
    if (completedRef.current || pausedRef.current) {
      return;
    }

    const canLaunchHeldSkillBall =
      props.mode === ARCADE_SKILL_DIFF_MODE && hasArcadeBrickedUpUnlaunchedBalls(stateRef.current);

    if (
      !stateRef.current.awaitingServe &&
      stateRef.current.magnetHeldBallId === null &&
      !canLaunchHeldSkillBall
    ) {
      return;
    }

    const modifiers = computeArcadeBrickedUpModifiers(
      stateRef.current.activeEffects,
      stateRef.current.tick,
    );
    stateRef.current = launchArcadeBrickedUpBalls(stateRef.current, config, modifiers);
    setAwaitingServe(stateRef.current.awaitingServe);
    setMagnetHeld(false);
    setHasHeldSkillBall(hasArcadeBrickedUpUnlaunchedBalls(stateRef.current));
    setBalls([...stateRef.current.balls]);
    playArcadeStashBulletHitSfx();
  }, [config, props.mode]);

  const releaseMagnet = useCallback((): void => {
    if (completedRef.current || pausedRef.current || stateRef.current.magnetHeldBallId === null) {
      return;
    }

    const modifiers = computeArcadeBrickedUpModifiers(
      stateRef.current.activeEffects,
      stateRef.current.tick,
    );
    stateRef.current = launchArcadeBrickedUpBalls(stateRef.current, config, modifiers);
    setMagnetHeld(false);
    setBalls([...stateRef.current.balls]);
    playArcadeStashBulletHitSfx();
  }, [config]);

  const syncUi = useCallback((previousBrickCount: number): void => {
    const state = stateRef.current;
    const modifiers = computeArcadeBrickedUpModifiers(state.activeEffects, state.tick);

    if (state.bricksBroken > 0 && state.bricks.length < previousBrickCount) {
      playArcadeGameTickSfx();
    }

    if (state.lives < livesRef.current) {
      playArcadeDropWindowBuzzerSfx();
    }

    livesRef.current = state.lives;

    if (state.completed) {
      playArcadeGameTickSfx();
    }

    setScore(state.score);
    setLives(state.lives);
    setLevelDisplay(Math.min(config.levelCount, state.levelIndex + 1));
    setBricksBroken(state.bricksBroken);
    setPaddleX(state.paddleX);
    setBalls([...state.balls]);
    setBricks([...state.bricks]);
    setDrops([...state.drops]);
    setHazards([...state.hazards]);
    setProjectiles([...state.projectiles]);
    setExplosions([...state.explosions]);
    setEffectChips(readArcadeBrickedUpActiveEffectChips(state));
    setHazardFlashing(isArcadeBrickedUpHazardFlashing(state));
    setAwaitingServe(state.awaitingServe);
    setMagnetHeld(state.magnetHeldBallId !== null);
    setHasHeldSkillBall(hasArcadeBrickedUpUnlaunchedBalls(state));
    setDarkModeActive(modifiers.hasDarkMode);
    setSpotlightBallId(readArcadeBrickedUpSpotlightBall(state.balls)?.id ?? null);
    setPaddleWidth(effectiveArcadeBrickedUpPaddleWidth(config, modifiers));
    setBallSizePx((effectiveArcadeBrickedUpBallRadius(modifiers) / ARCADE_BRICKED_UP_BALL_RADIUS) * 10);
    lastBrickCountRef.current = state.bricks.length;
  }, [config]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      keysRef.current.add(event.key);

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        tryLaunch();
      }
    }

    function handleKeyUp(event: KeyboardEvent): void {
      keysRef.current.delete(event.key);

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        releaseMagnet();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysRef.current.clear();
    };
  }, [releaseMagnet, tryLaunch]);

  useEffect(() => {
    playArcadeGameStartSfx();
    completedRef.current = false;
    pausedRef.current = false;
    pointerActiveRef.current = false;
    pointerXRef.current = null;
    stateRef.current = createArcadeBrickedUpState(config);
    lastBrickCountRef.current = stateRef.current.bricks.length;
    setScore(0);
    setLives(config.startingLives);
    livesRef.current = config.startingLives;
    setLevelDisplay(1);
    setBricksBroken(0);
    setPaddleX(stateRef.current.paddleX);
    setBalls([...stateRef.current.balls]);
    setBricks([...stateRef.current.bricks]);
    setDrops([]);
    setHazards([]);
    setProjectiles([]);
    setExplosions([]);
    setEffectChips([]);
    setHazardFlashing(false);
    setAwaitingServe(true);
    setMagnetHeld(false);
    setDarkModeActive(false);
    setSpotlightBallId(null);
    setHasHeldSkillBall(false);
    setPaddleWidth(config.paddleWidth);
    setBallSizePx(10);

    const reducedMotion = prefersReducedMotion();

    function tick(): void {
      if (pausedRef.current || completedRef.current) {
        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      if (!reducedMotion) {
        const previousBrickCount = stateRef.current.bricks.length;
        let paddleDirection = readArcadeBrickedUpPaddleDirection(keysRef.current);
        const modifiers = computeArcadeBrickedUpModifiers(
          stateRef.current.activeEffects,
          stateRef.current.tick,
        );

        if (pointerActiveRef.current && pointerXRef.current !== null) {
          stateRef.current = {
            ...stateRef.current,
            paddleX: aimArcadeBrickedUpPaddleFromPointer(
              stateRef.current.paddleX,
              pointerXRef.current,
              config,
              modifiers,
            ),
          };
          paddleDirection = 0;
        }

        stateRef.current = updateArcadeBrickedUpState(stateRef.current, config, {
          paddleDirection,
        });
        syncUi(previousBrickCount);

        if (isArcadeBrickedUpVictory(stateRef.current, config)) {
          finishGame('victory');
        } else if (isArcadeBrickedUpDefeated(stateRef.current)) {
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

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [config, finishGame, syncUi]);

  const handleFieldPointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (completedRef.current) {
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();
      const pointerXPercent = ((event.clientX - bounds.left) / bounds.width) * 100;

      pointerActiveRef.current = event.buttons > 0;
      pointerXRef.current = pointerXPercent;

      if (event.type === 'pointerdown') {
        if (stateRef.current.magnetHeldBallId !== null) {
          releaseMagnet();
        } else {
          tryLaunch();
        }
      }
    },
    [releaseMagnet, tryLaunch],
  );

  const accentStyle = {
    '--arcade-bricked-accent': props.cabinetAccent,
    '--arcade-bricked-glow': props.cabinetGlow,
  } as CSSProperties;

  return (
    <div className="arcade-bricked-up-game" style={accentStyle}>
      <div className="arcade-bricked-up-game-hud">
        <div className="arcade-bricked-up-game-hud-stats">
          <div className="arcade-bricked-up-game-hud-block">
            <span>G</span>
            <strong>{score}</strong>
          </div>
          <div className="arcade-bricked-up-game-hud-block">
            <span>Level</span>
            <strong>
              {levelDisplay}/{config.levelCount}
            </strong>
          </div>
          <div className="arcade-bricked-up-game-hud-block">
            <span>Broken</span>
            <strong>{bricksBroken}</strong>
          </div>
          <div
            className={
              'arcade-bricked-up-game-hud-block' + (lives <= 1 ? ' is-lives-warning' : '')
            }
          >
            <span>Lives</span>
            <strong>{lives}</strong>
          </div>
        </div>
        <button
          className="arcade-bricked-up-game-exit-button"
          onClick={() => finishGame('forfeit')}
          type="button"
        >
          Exit game
        </button>
      </div>

      {effectChips.length > 0 ? (
        <div className="arcade-bricked-up-game-effects" aria-label="Active power effects">
          {effectChips.map((chip) => (
            <span
              className={
                'arcade-bricked-up-game-effect-chip' +
                (chip.isPowerDown ? ' is-power-down' : ' is-power-up')
              }
              key={chip.id}
              style={{ '--arcade-bricked-effect-progress': String(chip.progress) } as CSSProperties}
            >
              <span className="arcade-bricked-up-game-effect-chip-label">{chip.label}</span>
              <span className="arcade-bricked-up-game-effect-chip-timer">{chip.remainingSeconds}s</span>
              <span aria-hidden="true" className="arcade-bricked-up-game-effect-chip-bar" />
            </span>
          ))}
        </div>
      ) : null}

      <div
        aria-label="Brick breaker playfield"
        className={
          'arcade-bricked-up-game-field' +
          (hazardFlashing ? ' is-hazard-hit' : '') +
          (darkModeActive ? ' is-dark-mode' : '')
        }
        onPointerDown={handleFieldPointer}
        onPointerLeave={() => {
          pointerActiveRef.current = false;
          pointerXRef.current = null;
        }}
        onPointerMove={handleFieldPointer}
        onPointerUp={() => {
          if (stateRef.current.magnetHeldBallId !== null) {
            releaseMagnet();
          }

          pointerActiveRef.current = false;
          pointerXRef.current = null;
        }}
      >
        {bricks.map((brick) => (
          <ArcadeBrickedUpSprite
            className={
              'arcade-bricked-up-game-brick' +
              (brick.maxHp >= 3 ? ' is-armored' : brick.maxHp >= 2 ? ' is-reinforced' : '')
            }
            fallback={
              <>
                <span className="arcade-bricked-up-game-brick-face" />
                {brick.maxHp > 1 ? (
                  <span className="arcade-bricked-up-game-brick-hp">{brick.hp}</span>
                ) : null}
              </>
            }
            key={brick.id}
            slot={arcadeBrickedUpBrickSpriteSlot(brick.maxHp)}
            style={{
              left: brick.x + '%',
              top: brick.y + '%',
              width: brick.width + '%',
              height: brick.height + '%',
            }}
          />
        ))}
        {hazards.map((hazard) => (
          <ArcadeBrickedUpSprite
            className={
              'arcade-bricked-up-game-hazard' +
              (hazard.kind === 'explosive' ? ' is-explosive' : ' is-shard')
            }
            fallback={
              <span
                className={
                  'arcade-bricked-up-game-hazard-core' +
                  (hazard.kind === 'explosive' ? ' is-explosive-core' : '')
                }
              />
            }
            key={hazard.id}
            slot={arcadeBrickedUpHazardSpriteSlot(hazard.kind)}
            style={{
              left: hazard.x + '%',
              top: hazard.y + '%',
              width: hazard.size * arcadeBrickedUpHazardDisplayScale(hazard.kind) + '%',
              height: hazard.size * arcadeBrickedUpHazardDisplayScale(hazard.kind) + '%',
              '--arcade-bricked-hazard-rotation':
                hazard.kind === 'explosive' ? hazard.rotation + 'deg' : '0deg',
            } as CSSProperties}
          />
        ))}
        {drops.map((drop) => (
          <ArcadeBrickedUpSprite
            className="arcade-bricked-up-game-mystery-drop"
            fallback={<span className="arcade-bricked-up-game-mystery-drop-face" />}
            key={drop.id}
            slot="mystery-drop"
            style={{
              left: drop.x + '%',
              top: drop.y + '%',
              '--arcade-bricked-drop-rotation': drop.rotation + 'deg',
            } as CSSProperties}
          />
        ))}
        {projectiles.map((projectile) => (
          <ArcadeBrickedUpSprite
            className="arcade-bricked-up-game-projectile"
            fallback={<span className="arcade-bricked-up-game-projectile-core" />}
            key={projectile.id}
            slot="projectile"
            style={{ left: projectile.x + '%', top: projectile.y + '%' }}
          />
        ))}
        {explosions.map((explosion) => (
          <ArcadeBrickedUpSprite
            className="arcade-bricked-up-game-explosion"
            fallback={<span className="arcade-bricked-up-game-explosion-core" />}
            key={explosion.id}
            slot="explosion"
            style={{
              left: explosion.x + '%',
              top: explosion.y + '%',
              width: explosion.radius * 2 + '%',
              height: explosion.radius * 2 + '%',
            }}
          />
        ))}
        {balls.map((ball) => (
          <ArcadeBrickedUpSprite
            className={
              'arcade-bricked-up-game-ball' +
              (ball.launched ? '' : ' is-held') +
              (darkModeActive && ball.id === spotlightBallId ? ' is-spotlight' : '') +
              (darkModeActive && ball.id !== spotlightBallId ? ' is-dark-hidden' : '')
            }
            fallback={<span className="arcade-bricked-up-game-ball-core" />}
            key={ball.id}
            slot="ball"
            style={{
              left: ball.x + '%',
              top: ball.y + '%',
              width: ballSizePx + 'px',
              height: ballSizePx + 'px',
            }}
          />
        ))}
        {darkModeActive && spotlightBallId ? (
          <span
            aria-hidden="true"
            className="arcade-bricked-up-game-spotlight"
            style={{
              left: (balls.find((ball) => ball.id === spotlightBallId)?.x ?? 50) + '%',
              top: (balls.find((ball) => ball.id === spotlightBallId)?.y ?? 50) + '%',
            }}
          />
        ) : null}
        <ArcadeBrickedUpSprite
          className="arcade-bricked-up-game-paddle"
          fallback={<span className="arcade-bricked-up-game-paddle-face" />}
          slot="paddle"
          style={{
            left: paddleX + '%',
            width: paddleWidth + '%',
          }}
        />
        {awaitingServe ? (
          <p className="arcade-bricked-up-game-serve-hint">Tap field or press Space to launch</p>
        ) : magnetHeld ? (
          <p className="arcade-bricked-up-game-serve-hint">Release Space or tap to fling the ball</p>
        ) : hasHeldSkillBall ? (
          <p className="arcade-bricked-up-game-serve-hint">Tap or press Space to relaunch a held ball</p>
        ) : null}
        <p className="arcade-bricked-up-game-hint">
          ←/→ or A/D to move · Mystery drops from bricks · Dodge falling hazards ·{' '}
          {config.ballCount > 1 ? config.ballCount + ' balls · ' : ''}
          Clear {config.levelCount} levels · {formatArcadeG(ARCADE_BRICKED_UP_COMPLETE_BONUS, true)} wall
          bonus
        </p>
      </div>
    </div>
  );
}