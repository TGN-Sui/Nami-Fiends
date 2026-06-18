import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';

import { genreOfficialChats } from './global-chats.js';
import { LANDING_GENRE_LOUNGES } from './landing-content.js';
import { prefersReducedMotion, subscribeVisibilityPause } from './perf-utils.js';

const genreLoungesByTitle = new Map(genreOfficialChats.map((chat) => [chat.title, chat]));

type FloatingGenreBubble = {
  id: string;
  chatId: string;
  title: string;
  members: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  scale: number;
  riseSpeed: number;
  opacity: number;
  bornAt: number;
  popClicks: number;
  popClicksRequired: number;
  poppedAt: number | null;
  lastClickAt: number;
};

const MAX_BUBBLES = 14;
const SPAWN_INTERVAL_MS = 2200;
const BUBBLE_LIFETIME_MS = 15000;
const BUBBLE_POP_ANIMATION_MS = 320;
const CURSOR_RADIUS = 140;
const BUBBLE_SCALE_MIN = 1.36;
const BUBBLE_SCALE_SPREAD = 0.36;
const POP_CLICK_HIT_MS = 180;

function bubbleBaseRadius(members: number): number {
  return 26 + Math.min(18, Math.round(members / 60));
}

function popClicksRequiredForBubble(): number {
  return 3 + Math.floor(Math.random() * 3);
}

function spawnBubble(width: number, height: number, now: number): FloatingGenreBubble {
  const title = LANDING_GENRE_LOUNGES[Math.floor(Math.random() * LANDING_GENRE_LOUNGES.length)]!;
  const chat = genreLoungesByTitle.get(title)!;
  const spawnLeft = Math.random() < 0.5;
  const sidePadding = width * 0.06;
  const sideWidth = width * 0.28;
  const scale = BUBBLE_SCALE_MIN + Math.random() * BUBBLE_SCALE_SPREAD;
  const riseSpeed = 0.55 + Math.random() * 1.35;
  const radius = bubbleBaseRadius(chat.activeMembers) * scale;
  const x = spawnLeft
    ? sidePadding + Math.random() * sideWidth
    : width - sidePadding - Math.random() * sideWidth;

  return {
    id: chat.id + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
    chatId: chat.id,
    title,
    members: chat.activeMembers,
    x,
    y: height + radius + 12,
    vx: (Math.random() - 0.5) * 0.42,
    vy: -riseSpeed - Math.random() * 0.45,
    radius,
    scale,
    riseSpeed,
    opacity: 0,
    bornAt: now,
    popClicks: 0,
    popClicksRequired: popClicksRequiredForBubble(),
    poppedAt: null,
    lastClickAt: 0,
  };
}

function bubbleIdSignature(bubbles: FloatingGenreBubble[]): string {
  return bubbles.map((bubble) => bubble.id).join('|');
}

function applyBubbleStyles(element: HTMLButtonElement, bubble: FloatingGenreBubble, now: number): void {
  const popProgress = bubble.popClicks / bubble.popClicksRequired;
  const recentlyClicked = now - bubble.lastClickAt <= POP_CLICK_HIT_MS;
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
    'nami-landing-floating-genre-bubble' +
    (recentlyClicked ? ' is-pop-hit' : '') +
    (isPopping ? ' is-popping' : '') +
    (popProgress > 0 && !isPopping ? ' is-pop-charging' : '');
}

export function LandingGenreBubbleField(props: {
  onGenrePop?: (chatId: string) => void;
}): ReactElement {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const bubblesRef = useRef<FloatingGenreBubble[]>([]);
  const bubbleElementsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });
  const scoreRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const spawnRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const [bubbleRevision, setBubbleRevision] = useState(0);
  const [score, setScore] = useState(0);

  const handleBubblePop = useCallback((bubbleId: string): void => {
    const bubble = bubblesRef.current.find((entry) => entry.id === bubbleId);

    if (!bubble || bubble.poppedAt !== null) {
      return;
    }

    const now = performance.now();
    bubble.popClicks += 1;
    bubble.lastClickAt = now;
    bubble.vx += (Math.random() - 0.5) * 0.75;
    bubble.vy += -0.55;

    if (bubble.popClicks >= bubble.popClicksRequired) {
      bubble.poppedAt = now;
      scoreRef.current += 1;
      setScore(scoreRef.current);
      props.onGenrePop?.(bubble.chatId);
    }

    const element = bubbleElementsRef.current.get(bubbleId);

    if (element) {
      applyBubbleStyles(element, bubble, now);
    }
  }, [props.onGenrePop]);

  useEffect(() => {
    function onPointerMove(event: PointerEvent): void {
      pointerRef.current = {
        x: event.clientX,
        y: event.clientY,
        active: true,
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

    let lastIdSignature = bubbleIdSignature(bubblesRef.current);

    function pushBubbleAway(bubble: FloatingGenreBubble): void {
      const pointer = pointerRef.current;

      if (!pointer.active) {
        return;
      }

      const dx = bubble.x - pointer.x;
      const dy = bubble.y - pointer.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;

      if (distance > CURSOR_RADIUS + bubble.radius) {
        return;
      }

      const influence = 1 - distance / (CURSOR_RADIUS + bubble.radius);
      const push = influence * influence * 2.4;
      bubble.vx += (dx / distance) * push;
      bubble.vy += (dy / distance) * push * 0.65;
    }

    function step(now: number): void {
      if (pausedRef.current) {
        frameRef.current = window.requestAnimationFrame(step);
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      const next: FloatingGenreBubble[] = [];

      for (const bubble of bubblesRef.current) {
        const age = now - bubble.bornAt;
        const life = age / BUBBLE_LIFETIME_MS;

        if (bubble.poppedAt !== null) {
          if (now - bubble.poppedAt >= BUBBLE_POP_ANIMATION_MS) {
            continue;
          }
        } else if (life >= 1) {
          continue;
        }

        bubble.vy = Math.min(bubble.vy, -bubble.riseSpeed * 0.9);
        bubble.vx *= 0.97;
        bubble.vy *= 0.996;
        pushBubbleAway(bubble);

        bubble.x += bubble.vx;
        bubble.y += bubble.vy;

        if (bubble.poppedAt !== null) {
          bubble.opacity = Math.max(0, 1 - (now - bubble.poppedAt) / BUBBLE_POP_ANIMATION_MS);
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
          applyBubbleStyles(element, bubble, now);
        }
      }

      const nextIdSignature = bubbleIdSignature(next);

      if (nextIdSignature !== lastIdSignature) {
        lastIdSignature = nextIdSignature;
        setBubbleRevision((revision) => revision + 1);
      }

      frameRef.current = window.requestAnimationFrame(step);
    }

    const bootNow = performance.now();

    frameRef.current = window.requestAnimationFrame(step);

    spawnRef.current = window.setInterval(() => {
      if (bubblesRef.current.length >= MAX_BUBBLES) {
        return;
      }

      bubblesRef.current = [
        ...bubblesRef.current,
        spawnBubble(window.innerWidth, window.innerHeight, performance.now()),
      ];
      setBubbleRevision((revision) => revision + 1);
    }, SPAWN_INTERVAL_MS);

    bubblesRef.current = [
      spawnBubble(window.innerWidth, window.innerHeight, bootNow),
      spawnBubble(window.innerWidth, window.innerHeight, bootNow + 1),
    ];
    setBubbleRevision((revision) => revision + 1);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      if (spawnRef.current !== null) {
        window.clearInterval(spawnRef.current);
      }
    };
  }, []);

  void bubbleRevision;
  const now = performance.now();

  return (
    <>
      <div aria-live="polite" className="nami-landing-bubble-game-hud">
        <span className="nami-landing-bubble-game-label">Popped</span>
        <strong className="nami-landing-bubble-game-score">{score}</strong>
        <p className="nami-landing-bubble-game-hint">Click a bubble several times to pop it.</p>
      </div>

      <div className="nami-landing-genre-bubble-field" ref={fieldRef}>
        {bubblesRef.current.map((bubble) => {
          const popProgress = bubble.popClicks / bubble.popClicksRequired;
          const recentlyClicked = now - bubble.lastClickAt <= POP_CLICK_HIT_MS;
          const isPopping = bubble.poppedAt !== null;

          return (
            <button
              aria-label={
                'Pop ' +
                bubble.title +
                ' bubble. ' +
                bubble.popClicks +
                ' of ' +
                bubble.popClicksRequired +
                ' clicks.'
              }
              className={
                'nami-landing-floating-genre-bubble' +
                (recentlyClicked ? ' is-pop-hit' : '') +
                (isPopping ? ' is-popping' : '') +
                (popProgress > 0 && !isPopping ? ' is-pop-charging' : '')
              }
              key={bubble.id}
              onClick={() => handleBubblePop(bubble.id)}
              ref={(element) => {
                if (element) {
                  bubbleElementsRef.current.set(bubble.id, element);
                  applyBubbleStyles(element, bubble, now);
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
              <span aria-hidden="true" className="nami-landing-floating-genre-bubble-pop-ring" />
              <strong>{bubble.title}</strong>
              <small>
                {isPopping
                  ? 'Pop!'
                  : bubble.popClicks > 0
                    ? bubble.popClicks + ' / ' + bubble.popClicksRequired + ' taps'
                    : bubble.members.toLocaleString() + ' active'}
              </small>
            </button>
          );
        })}
      </div>
    </>
  );
}