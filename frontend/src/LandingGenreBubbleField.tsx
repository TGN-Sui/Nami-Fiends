import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';

import { genreOfficialChats } from './global-chats.js';

type FloatingGenreBubble = {
  id: string;
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
};

const MAX_BUBBLES = 14;
const SPAWN_INTERVAL_MS = 2200;
const BUBBLE_LIFETIME_MS = 15000;
const CURSOR_RADIUS = 140;

function bubbleBaseRadius(members: number): number {
  return 34 + Math.min(26, Math.round(members / 45));
}

function spawnBubble(width: number, height: number): FloatingGenreBubble {
  const chat = genreOfficialChats[Math.floor(Math.random() * genreOfficialChats.length)]!;
  const spawnLeft = Math.random() < 0.5;
  const sidePadding = width * 0.06;
  const sideWidth = width * 0.28;
  const scale = 0.78 + Math.random() * 0.48;
  const riseSpeed = 0.55 + Math.random() * 1.35;
  const radius = bubbleBaseRadius(chat.activeMembers) * scale;
  const x = spawnLeft
    ? sidePadding + Math.random() * sideWidth
    : width - sidePadding - Math.random() * sideWidth;

  return {
    id: chat.id + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
    title: chat.title,
    members: chat.activeMembers,
    x,
    y: height + radius + 12,
    vx: (Math.random() - 0.5) * 0.42,
    vy: -riseSpeed - Math.random() * 0.45,
    radius,
    scale,
    riseSpeed,
    opacity: 0,
    bornAt: performance.now(),
  };
}

export function LandingGenreBubbleField(): ReactElement {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const bubblesRef = useRef<FloatingGenreBubble[]>([]);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });
  const frameRef = useRef<number | null>(null);
  const spawnRef = useRef<number | null>(null);
  const [renderTick, setRenderTick] = useState(0);

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
      const width = window.innerWidth;
      const height = window.innerHeight;
      const next: FloatingGenreBubble[] = [];

      for (const bubble of bubblesRef.current) {
        const age = now - bubble.bornAt;
        const life = age / BUBBLE_LIFETIME_MS;

        if (life >= 1) {
          continue;
        }

        bubble.vy = Math.min(bubble.vy, -bubble.riseSpeed * 0.9);
        bubble.vx *= 0.97;
        bubble.vy *= 0.996;
        pushBubbleAway(bubble);

        bubble.x += bubble.vx;
        bubble.y += bubble.vy;

        if (age < 500) {
          bubble.opacity = Math.min(1, age / 500);
        } else if (life > 0.72) {
          bubble.opacity = Math.max(0, 1 - (life - 0.72) / 0.28);
        } else {
          bubble.opacity = 1;
        }

        if (bubble.y + bubble.radius < -120) {
          continue;
        }

        bubble.x = Math.max(bubble.radius, Math.min(width - bubble.radius, bubble.x));
        next.push(bubble);
      }

      bubblesRef.current = next;
      setRenderTick((tick) => tick + 1);
      frameRef.current = window.requestAnimationFrame(step);
    }

    frameRef.current = window.requestAnimationFrame(step);

    spawnRef.current = window.setInterval(() => {
      if (bubblesRef.current.length >= MAX_BUBBLES) {
        return;
      }

      bubblesRef.current = [
        ...bubblesRef.current,
        spawnBubble(window.innerWidth, window.innerHeight),
      ];
    }, SPAWN_INTERVAL_MS);

    bubblesRef.current = [
      spawnBubble(window.innerWidth, window.innerHeight),
      spawnBubble(window.innerWidth, window.innerHeight),
    ];

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      if (spawnRef.current !== null) {
        window.clearInterval(spawnRef.current);
      }
    };
  }, []);

  void renderTick;

  return (
    <div aria-hidden="true" className="nami-landing-genre-bubble-field" ref={fieldRef}>
      {bubblesRef.current.map((bubble) => (
        <div
          className="nami-landing-floating-genre-bubble"
          key={bubble.id}
          style={
            {
              width: bubble.radius * 2 + 'px',
              height: bubble.radius * 2 + 'px',
              opacity: bubble.opacity,
              transform:
                'translate3d(' + (bubble.x - bubble.radius) + 'px,' + (bubble.y - bubble.radius) + 'px,0)',
            } as CSSProperties
          }
        >
          <strong>{bubble.title}</strong>
          <small>{bubble.members.toLocaleString()} active</small>
        </div>
      ))}
    </div>
  );
}