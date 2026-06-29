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
  ARCADE_BUBBLE_CURSOR_RADIUS,
  ARCADE_BUBBLE_GAME_DURATION_MS,
  ARCADE_BUBBLE_POP_ANIMATION_MS,
  ARCADE_BUBBLE_POP_CLICK_HIT_MS,
  arcadeBubbleGameConfig,
  arcadeBubbleIdSignature,
  arcadeBubbleLifeProgress,
  formatGoonPopG,
  spawnArcadeBubble,
  type ArcadeBubbleEntity,
  type ArcadeBubbleMode,
} from './arcade-bubble-game.js';
import { recordArcadeBubblePop } from './arcade-bubble-game-store.js';
import { SELF_MEMBER_ID } from './member-access.js';
import {
  arcadeCountdownWarningStyle,
  isArcadeCountdownWarning,
} from './arcade-countdown-ui.js';
import {
  playArcadeBubbleChargeSfx,
  playArcadeBubblePopSfx,
  playArcadeGameCountdownTickSfx,
  playArcadeGameStartSfx,
} from './nami-sfx.js';
import { prefersReducedMotion, subscribeVisibilityPause } from './perf-utils.js';

export type ArcadeBubbleGameSummary = {
  score: number;
  bubblesPopped: number;
  mode: ArcadeBubbleMode;
};

type ArcadeBubbleGameProps = {
  mode: ArcadeBubbleMode;
  memberId?: string;
  cabinetAccent: string;
  cabinetGlow: string;
  onComplete: (summary: ArcadeBubbleGameSummary) => void;
  onForfeit?: () => void;
};

function applyArcadeBubbleStyles(
  element: HTMLButtonElement,
  bubble: ArcadeBubbleEntity,
  now: number,
): void {
  const popProgress = bubble.popClicks / bubble.popClicksRequired;
  const recentlyClicked = now - bubble.lastClickAt <= ARCADE_BUBBLE_POP_CLICK_HIT_MS;
  const isPopping = bubble.poppedAt !== null;

  element.style.opacity = String(bubble.opacity);
  element.style.setProperty('--bubble-scale', String(bubble.scale));
  element.style.setProperty('--pop-progress', String(popProgress));
  element.style.setProperty('--pop-x', bubble.x - bubble.radius + 'px');
  element.style.setProperty('--pop-y', bubble.y - bubble.radius + 'px');
  element.style.width = bubble.radius * 2 + 'px';
  element.style.height = bubble.radius * 2 + 'px';

  if (!isPopping) {
    element.style.transform =
      'translate3d(' + (bubble.x - bubble.radius) + 'px,' + (bubble.y - bubble.radius) + 'px,0)';
  }

  element.className =
    'arcade-bubble-game-bubble' +
    (bubble.size === 'big' ? ' is-big-bubble' : ' is-small-bubble') +
    (recentlyClicked ? ' is-pop-hit' : '') +
    (isPopping ? ' is-popping' : '') +
    (popProgress > 0 && !isPopping ? ' is-pop-charging' : '');
}

function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return String(minutes) + ':' + String(seconds).padStart(2, '0');
}

export function ArcadeBubbleGame(props: ArcadeBubbleGameProps): ReactElement {
  const memberId = props.memberId ?? SELF_MEMBER_ID;
  const config = useMemo(() => arcadeBubbleGameConfig(props.mode), [props.mode]);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const bubblesRef = useRef<ArcadeBubbleEntity[]>([]);
  const bubbleElementsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });
  const scoreRef = useRef(0);
  const popsRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const spawnRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const completedRef = useRef(false);
  const startedAtRef = useRef(performance.now());
  const [bubbleRevision, setBubbleRevision] = useState(0);
  const [score, setScore] = useState(0);
  const [popped, setPopped] = useState(0);
  const [remainingMs, setRemainingMs] = useState(ARCADE_BUBBLE_GAME_DURATION_MS);
  const lastTickSecondRef = useRef<number | null>(null);
  const onCompleteRef = useRef(props.onComplete);
  const onForfeitRef = useRef(props.onForfeit);
  const modeRef = useRef(props.mode);

  onCompleteRef.current = props.onComplete;
  onForfeitRef.current = props.onForfeit;
  modeRef.current = props.mode;

  const stopTimers = useCallback((): void => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (spawnRef.current !== null) {
      window.clearInterval(spawnRef.current);
      spawnRef.current = null;
    }

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const finishGame = useCallback(
    (reason: 'complete' | 'forfeit' = 'complete'): void => {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;
      stopTimers();

      if (reason === 'forfeit') {
        onForfeitRef.current?.();
        return;
      }

      if (popsRef.current > 0) {
        recordArcadeBubblePop(memberId, popsRef.current);
      }

      onCompleteRef.current({
        score: scoreRef.current,
        bubblesPopped: popsRef.current,
        mode: modeRef.current,
      });
    },
    [memberId, stopTimers],
  );

  const handleBubblePop = useCallback(
    (bubbleId: string): void => {
      const bubble = bubblesRef.current.find((entry) => entry.id === bubbleId);

      if (!bubble || bubble.poppedAt !== null || completedRef.current) {
        return;
      }

      const now = performance.now();
      bubble.popClicks += 1;
      bubble.lastClickAt = now;
      bubble.vx += (Math.random() - 0.5) * 0.75;
      bubble.vy += -0.55;

      if (bubble.popClicks >= bubble.popClicksRequired) {
        bubble.poppedAt = now;
        scoreRef.current += bubble.points;
        popsRef.current += 1;
        setScore(scoreRef.current);
        setPopped(popsRef.current);
        playArcadeBubblePopSfx(bubble.size);
      } else {
        playArcadeBubbleChargeSfx(bubble.popClicks / bubble.popClicksRequired);
      }

      const element = bubbleElementsRef.current.get(bubbleId);

      if (element) {
        applyArcadeBubbleStyles(element, bubble, now);
      }
    },
    [memberId],
  );

  useEffect(() => {
    playArcadeGameStartSfx();
    startedAtRef.current = performance.now();
    completedRef.current = false;
    scoreRef.current = 0;
    popsRef.current = 0;
    setScore(0);
    setPopped(0);
    setRemainingMs(ARCADE_BUBBLE_GAME_DURATION_MS);
    lastTickSecondRef.current = null;

    timerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startedAtRef.current;
      const nextRemaining = Math.max(0, ARCADE_BUBBLE_GAME_DURATION_MS - elapsed);
      const nextSecond = Math.ceil(nextRemaining / 1000);

      setRemainingMs(nextRemaining);

      if (nextRemaining <= 10_000 && nextRemaining > 0 && lastTickSecondRef.current !== nextSecond) {
        lastTickSecondRef.current = nextSecond;
        playArcadeGameCountdownTickSfx(nextSecond);
      }

      if (nextRemaining <= 0) {
        finishGame('complete');
      }
    }, 100);

    return () => {
      stopTimers();
    };
  }, [finishGame, stopTimers]);

  useEffect(() => {
    function onPointerMove(event: PointerEvent): void {
      const field = fieldRef.current;

      if (!field) {
        return;
      }

      const rect = field.getBoundingClientRect();
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active:
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom,
      };
    }

    function onPointerLeave(): void {
      pointerRef.current.active = false;
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    return subscribeVisibilityPause((paused) => {
      pausedRef.current = paused;
    });
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    let lastIdSignature = arcadeBubbleIdSignature(bubblesRef.current);

    function pushBubbleAway(bubble: ArcadeBubbleEntity, width: number, height: number): void {
      const pointer = pointerRef.current;

      if (!pointer.active) {
        return;
      }

      const dx = bubble.x - pointer.x;
      const dy = bubble.y - pointer.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;

      if (distance > ARCADE_BUBBLE_CURSOR_RADIUS + bubble.radius) {
        return;
      }

      const influence = 1 - distance / (ARCADE_BUBBLE_CURSOR_RADIUS + bubble.radius);
      const push = influence * influence * 2.4;
      bubble.vx += (dx / distance) * push;
      bubble.vy += (dy / distance) * push * 0.65;
    }

    function spawn(width: number, height: number, now: number): void {
      if (bubblesRef.current.length >= config.maxBubbles || completedRef.current) {
        return;
      }

      bubblesRef.current = [...bubblesRef.current, spawnArcadeBubble(width, height, now, config)];
      setBubbleRevision((revision) => revision + 1);
    }

    function step(now: number): void {
      if (pausedRef.current || completedRef.current) {
        frameRef.current = window.requestAnimationFrame(step);
        return;
      }

      const field = fieldRef.current;
      const width = field?.clientWidth ?? 1;
      const height = field?.clientHeight ?? 1;
      const next: ArcadeBubbleEntity[] = [];

      for (const bubble of bubblesRef.current) {
        const age = now - bubble.bornAt;
        const life = arcadeBubbleLifeProgress(bubble, now);

        if (bubble.poppedAt !== null) {
          if (now - bubble.poppedAt >= ARCADE_BUBBLE_POP_ANIMATION_MS) {
            continue;
          }
        } else if (life >= 1) {
          continue;
        }

        bubble.vy = Math.min(bubble.vy, -bubble.riseSpeed * 0.9);
        bubble.vx *= 0.97;
        bubble.vy *= 0.996;
        pushBubbleAway(bubble, width, height);

        bubble.x += bubble.vx;
        bubble.y += bubble.vy;

        if (bubble.poppedAt !== null) {
          bubble.opacity = Math.max(0, 1 - (now - bubble.poppedAt) / ARCADE_BUBBLE_POP_ANIMATION_MS);
        } else if (age < 500) {
          bubble.opacity = Math.min(1, age / 500);
        } else if (life > 0.72) {
          bubble.opacity = Math.max(0, 1 - (life - 0.72) / 0.28);
        } else {
          bubble.opacity = 1;
        }

        if (bubble.poppedAt === null && bubble.y + bubble.radius < -120) {
          continue;
        }

        bubble.x = Math.max(bubble.radius, Math.min(width - bubble.radius, bubble.x));
        next.push(bubble);
      }

      bubblesRef.current = next;

      for (const bubble of next) {
        const element = bubbleElementsRef.current.get(bubble.id);

        if (element) {
          applyArcadeBubbleStyles(element, bubble, now);
        }
      }

      const nextIdSignature = arcadeBubbleIdSignature(next);

      if (nextIdSignature !== lastIdSignature) {
        lastIdSignature = nextIdSignature;
        setBubbleRevision((revision) => revision + 1);
      }

      frameRef.current = window.requestAnimationFrame(step);
    }

    const bootNow = performance.now();
    const field = fieldRef.current;
    const bootWidth = field?.clientWidth ?? 640;
    const bootHeight = field?.clientHeight ?? 420;

    frameRef.current = window.requestAnimationFrame(step);

    spawnRef.current = window.setInterval(() => {
      const currentField = fieldRef.current;

      if (!currentField) {
        return;
      }

      const now = performance.now();
      const width = currentField.clientWidth;
      const height = currentField.clientHeight;

      for (let index = 0; index < config.spawnsPerTick; index += 1) {
        spawn(width, height, now + index);
      }
    }, config.spawnIntervalMs);

    bubblesRef.current = [
      spawnArcadeBubble(bootWidth, bootHeight, bootNow, config),
      spawnArcadeBubble(bootWidth, bootHeight, bootNow + 1, config),
    ];
    setBubbleRevision((revision) => revision + 1);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      if (spawnRef.current !== null) {
        window.clearInterval(spawnRef.current);
        spawnRef.current = null;
      }
    };
  }, [config]);

  void bubbleRevision;
  const now = performance.now();

  const accentStyle = {
    '--arcade-bubble-accent': props.cabinetAccent,
    '--arcade-bubble-glow': props.cabinetGlow,
  } as CSSProperties;

  return (
    <div className="arcade-bubble-game" style={accentStyle}>
      <div className="arcade-bubble-game-hud">
        <div className="arcade-bubble-game-hud-stats">
          <div className="arcade-bubble-game-hud-block">
            <span>G</span>
            <strong>{score}</strong>
          </div>
          <div
            className={
              'arcade-bubble-game-hud-block' + (isArcadeCountdownWarning(remainingMs) ? ' is-time-warning' : '')
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
          <div className="arcade-bubble-game-hud-block">
            <span>Ghosted</span>
            <strong>{popped}</strong>
          </div>
        </div>
        <button
          className="arcade-bubble-game-exit-button"
          onClick={() => finishGame('forfeit')}
          type="button"
        >
          Exit game
        </button>
      </div>

      <div className="arcade-bubble-game-field" ref={fieldRef}>
        {bubblesRef.current.map((bubble) => {
          const popProgress = bubble.popClicks / bubble.popClicksRequired;
          const recentlyClicked = now - bubble.lastClickAt <= ARCADE_BUBBLE_POP_CLICK_HIT_MS;
          const isPopping = bubble.poppedAt !== null;

          return (
            <button
              aria-label={
                bubble.label +
                ' glow worth ' +
                formatGoonPopG(bubble.points) +
                '. ' +
                bubble.popClicks +
                ' of ' +
                bubble.popClicksRequired +
                ' hits.'
              }
              className={
                'arcade-bubble-game-bubble' +
                (bubble.size === 'big' ? ' is-big-bubble' : ' is-small-bubble') +
                (recentlyClicked ? ' is-pop-hit' : '') +
                (isPopping ? ' is-popping' : '') +
                (popProgress > 0 && !isPopping ? ' is-pop-charging' : '')
              }
              key={bubble.id}
              onClick={() => handleBubblePop(bubble.id)}
              ref={(element) => {
                if (element) {
                  bubbleElementsRef.current.set(bubble.id, element);
                  applyArcadeBubbleStyles(element, bubble, now);
                } else {
                  bubbleElementsRef.current.delete(bubble.id);
                }
              }}
              style={
                {
                  '--bubble-scale': String(bubble.scale),
                  '--pop-progress': String(popProgress),
                  '--pop-x': bubble.x - bubble.radius + 'px',
                  '--pop-y': bubble.y - bubble.radius + 'px',
                  width: bubble.radius * 2 + 'px',
                  height: bubble.radius * 2 + 'px',
                  opacity: bubble.opacity,
                  transform: isPopping
                    ? undefined
                    : 'translate3d(' +
                      (bubble.x - bubble.radius) +
                      'px,' +
                      (bubble.y - bubble.radius) +
                      'px,0)',
                } as CSSProperties
              }
              type="button"
            >
              <span aria-hidden="true" className="arcade-bubble-game-bubble-pop-ring" />
              <strong>{bubble.label}</strong>
              <small>
                {isPopping
                  ? formatGoonPopG(bubble.points, true)
                  : bubble.popClicks > 0
                    ? bubble.popClicks + ' / ' + bubble.popClicksRequired
                    : formatGoonPopG(bubble.points, true)}
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
}