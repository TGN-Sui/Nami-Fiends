import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';

import { channelRainbowBorderClass } from './channel-surface.js';
import { type BubbleLeaderboardSize } from './events-store.js';
import { prefersReducedMotion, subscribeIntersectionPause, subscribeVisibilityPause } from './perf-utils.js';
import { type NamiChannel } from './uiMockData.js';

export type NamiCryptoBubbleEntry = {
  channel: NamiChannel;
  slotId: string;
};

type NamiCryptoBubbleNode = {
  id: string;
  channel: NamiChannel;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  radius: number;
  baseRadius: number;
  scale: number;
  mass: number;
  collisionStress: number;
  renderX: number;
  renderY: number;
  renderGrowth: number;
};

const COLLISION_GRID_CELL_PX = 132;
const TARGET_FRAME_MS = 32;
const POINTER_COAST_MS = 900;

function seededRandom(seed: number): number {
  const value = Math.sin(seed * 999.91) * 43758.5453123;

  return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothFalloff(value: number): number {
  const clampedValue = clamp(value, 0, 1);

  return clampedValue * clampedValue * (3 - 2 * clampedValue);
}

function readableBubbleRadius(node: Pick<NamiCryptoBubbleNode, 'radius' | 'baseRadius' | 'scale'>): number {
  const visualRadius = node.radius * node.scale;
  const softMoat = node.baseRadius >= 50 ? 6 : node.baseRadius >= 40 ? 5 : 4;

  return visualRadius * 0.82 + softMoat;
}

function bubbleVisualSize(node: Pick<NamiCryptoBubbleNode, 'baseRadius' | 'scale'>): number {
  return node.baseRadius * node.scale * 2;
}

function buildNamiCryptoBubbleNodes(
  entries: NamiCryptoBubbleEntry[],
  bubbleScale = 1,
): NamiCryptoBubbleNode[] {
  const virtualWidth = 1160;
  const virtualHeight = 720;
  const placedNodes: NamiCryptoBubbleNode[] = [];

  return entries.map((entry, index) => {
    const rank = index + 1;
    const randomScale = seededRandom(index + 211);
    const randomMass = seededRandom(index + 311);

    const baseRadius =
      (rank <= 5
        ? 56 + randomScale * 12
        : rank <= 12
          ? 47 + randomScale * 10
          : rank <= 24
            ? 37 + randomScale * 9
            : 27 + randomScale * 8) * bubbleScale;

    const scale = 0.88 + randomScale * 0.3;
    const visualRadius = baseRadius * scale;
    const softMoat = baseRadius >= 50 ? 6 : baseRadius >= 40 ? 5 : 4;
    const candidateRadius = visualRadius * 0.82 + softMoat;
    const padX = candidateRadius / virtualWidth;
    const padY = candidateRadius / virtualHeight;

    let bestX = 0.5;
    let bestY = 0.5;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let attempt = 0; attempt < 72; attempt += 1) {
      const randomX = seededRandom(index * 101 + attempt * 17 + 3);
      const randomY = seededRandom(index * 137 + attempt * 19 + 7);

      const candidateX = clamp(0.04 + randomX * 0.92, padX, 1 - padX);
      const candidateY = clamp(0.06 + randomY * 0.88, padY, 1 - padY);
      const candidatePixelX = candidateX * virtualWidth;
      const candidatePixelY = candidateY * virtualHeight;

      let closestGap = Number.POSITIVE_INFINITY;

      for (const placedNode of placedNodes) {
        const dx = candidatePixelX - placedNode.x * virtualWidth;
        const dy = candidatePixelY - placedNode.y * virtualHeight;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const minimumDistance = candidateRadius + readableBubbleRadius(placedNode);

        closestGap = Math.min(closestGap, distance - minimumDistance);
      }

      const edgeComfort =
        Math.min(candidateX, 1 - candidateX) * 0.35 + Math.min(candidateY, 1 - candidateY) * 0.45;

      const score =
        (placedNodes.length === 0 ? 80 : closestGap * 0.55) +
        edgeComfort * 54 +
        seededRandom(index * 197 + attempt * 23) * 22;

      if (score > bestScore) {
        bestScore = score;
        bestX = candidateX;
        bestY = candidateY;
      }
    }

    const node: NamiCryptoBubbleNode = {
      id: entry.slotId,
      channel: entry.channel,
      x: bestX,
      y: bestY,
      vx: 0,
      vy: 0,
      baseX: bestX,
      baseY: bestY,
      radius: baseRadius,
      baseRadius,
      scale,
      mass: 0.9 + randomMass * 1.8,
      collisionStress: 0,
      renderX: bestX,
      renderY: bestY,
      renderGrowth: 1,
    };

    placedNodes.push(node);

    return node;
  });
}

function mountBubbleElement(
  node: NamiCryptoBubbleNode,
  element: HTMLButtonElement,
  boardWidth: number,
  boardHeight: number,
): void {
  const size = bubbleVisualSize(node);

  element.style.width = size + 'px';
  element.style.height = size + 'px';
  applyBubbleNodeStyles(node, boardWidth, boardHeight, element, true);
}

function applyBubbleNodeStyles(
  node: NamiCryptoBubbleNode,
  boardWidth: number,
  boardHeight: number,
  element: HTMLButtonElement,
  force = false,
): void {
  const px = node.x * boardWidth;
  const py = node.y * boardHeight;
  const growth = node.radius / node.baseRadius;
  const visualRadius = node.radius * node.scale;
  const translateX = px - visualRadius;
  const translateY = py - visualRadius;

  if (
    !force &&
    Math.abs(node.renderX - translateX) < 0.35 &&
    Math.abs(node.renderY - translateY) < 0.35 &&
    Math.abs(node.renderGrowth - growth) < 0.004
  ) {
    return;
  }

  node.renderX = translateX;
  node.renderY = translateY;
  node.renderGrowth = growth;
  element.style.transform = 'translate3d(' + translateX + 'px,' + translateY + 'px,0) scale(' + growth + ')';
}

function effectiveMass(node: NamiCryptoBubbleNode): number {
  return node.mass * Math.max(0.85, node.baseRadius / 42);
}

function limitVelocity(node: NamiCryptoBubbleNode, maxVelocity: number): void {
  const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);

  if (speed > maxVelocity) {
    const ratio = maxVelocity / speed;

    node.vx *= ratio;
    node.vy *= ratio;
  }
}

function resolveBubblePair(
  left: NamiCryptoBubbleNode,
  right: NamiCryptoBubbleNode,
  width: number,
  height: number,
  frameDelta: number,
  solverPass: number,
): void {
  const leftX = left.x * width;
  const leftY = left.y * height;
  const rightX = right.x * width;
  const rightY = right.y * height;
  const dx = rightX - leftX;
  const dy = rightY - leftY;
  const distanceSquared = dx * dx + dy * dy;
  const contactDistance = readableBubbleRadius(left) + readableBubbleRadius(right);
  const nearFieldDistance = contactDistance * 1.16;
  const nearFieldDistanceSquared = nearFieldDistance * nearFieldDistance;

  if (distanceSquared >= nearFieldDistanceSquared) {
    return;
  }

  const distance = Math.sqrt(distanceSquared) || 0.0001;
  const nx = dx / distance;
  const ny = dy / distance;
  const leftMass = effectiveMass(left);
  const rightMass = effectiveMass(right);
  const inverseLeftMass = 1 / leftMass;
  const inverseRightMass = 1 / rightMass;
  const inverseMassTotal = inverseLeftMass + inverseRightMass;

  if (distance > contactDistance) {
    const normalized = 1 - (distance - contactDistance) / (nearFieldDistance - contactDistance);
    const falloff = smoothFalloff(normalized);
    const softForce = falloff * 0.0045 * frameDelta;

    left.vx -= nx * softForce * (inverseLeftMass / inverseMassTotal);
    left.vy -= ny * softForce * (inverseLeftMass / inverseMassTotal);
    right.vx += nx * softForce * (inverseRightMass / inverseMassTotal);
    right.vy += ny * softForce * (inverseRightMass / inverseMassTotal);

    return;
  }

  const overlap = contactDistance - distance;
  const contactSlop = 8;

  if (overlap > contactSlop) {
    const correction = (overlap - contactSlop) * (solverPass === 0 ? 0.16 : 0.08);

    left.x -= (nx * correction * inverseLeftMass) / inverseMassTotal / width;
    left.y -= (ny * correction * inverseLeftMass) / inverseMassTotal / height;
    right.x += (nx * correction * inverseRightMass) / inverseMassTotal / width;
    right.y += (ny * correction * inverseRightMass) / inverseMassTotal / height;
  }

  const relativeVelocityX = right.vx - left.vx;
  const relativeVelocityY = right.vy - left.vy;
  const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;

  if (velocityAlongNormal < -0.12) {
    const restitution = 0.36;
    const impulseMagnitude = (-(1 + restitution) * velocityAlongNormal) / inverseMassTotal;
    const impulseX = impulseMagnitude * nx;
    const impulseY = impulseMagnitude * ny;

    left.vx -= impulseX * inverseLeftMass;
    left.vy -= impulseY * inverseLeftMass;
    right.vx += impulseX * inverseRightMass;
    right.vy += impulseY * inverseRightMass;
  } else if (overlap > contactSlop) {
    const separationImpulse = (overlap - contactSlop) * 0.0018;

    left.vx -= nx * separationImpulse * inverseLeftMass;
    left.vy -= ny * separationImpulse * inverseLeftMass;
    right.vx += nx * separationImpulse * inverseRightMass;
    right.vy += ny * separationImpulse * inverseRightMass;
  }

  left.collisionStress += Math.max(0, overlap - contactSlop);
  right.collisionStress += Math.max(0, overlap - contactSlop);
}

function solveBubbleCollisions(
  nodes: NamiCryptoBubbleNode[],
  width: number,
  height: number,
  frameDelta: number,
  solverPasses: number,
): void {
  const grid = new Map<string, number[]>();

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!;
    const px = node.x * width;
    const py = node.y * height;
    const key = Math.floor(px / COLLISION_GRID_CELL_PX) + ':' + Math.floor(py / COLLISION_GRID_CELL_PX);
    const bucket = grid.get(key);

    if (bucket) {
      bucket.push(index);
    } else {
      grid.set(key, [index]);
    }
  }

  const neighborOffsets = [
    [1, 0],
    [0, 1],
    [1, 1],
    [-1, 1],
  ] as const;

  for (let solverPass = 0; solverPass < solverPasses; solverPass += 1) {
    for (const [key, indices] of grid) {
      const [cellXRaw, cellYRaw] = key.split(':');
      const cellX = Number(cellXRaw ?? 0);
      const cellY = Number(cellYRaw ?? 0);

      for (let leftIndex = 0; leftIndex < indices.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < indices.length; rightIndex += 1) {
          resolveBubblePair(
            nodes[indices[leftIndex]!]!,
            nodes[indices[rightIndex]!]!,
            width,
            height,
            frameDelta,
            solverPass,
          );
        }
      }

      for (const [offsetX, offsetY] of neighborOffsets) {
        const neighbor = grid.get(cellX + offsetX + ':' + (cellY + offsetY));

        if (!neighbor) {
          continue;
        }

        for (const leftNodeIndex of indices) {
          for (const rightNodeIndex of neighbor) {
            resolveBubblePair(
              nodes[leftNodeIndex]!,
              nodes[rightNodeIndex]!,
              width,
              height,
              frameDelta,
              solverPass,
            );
          }
        }
      }
    }
  }
}

export function CryptoBubbleBoard(props: {
  entries: NamiCryptoBubbleEntry[];
  activeChannelId: string;
  onOpenChannel: (channel: NamiChannel) => void;
  onHoverChannel: (channelId: string | null) => void;
  heading?: string;
  subheading?: string;
  badgeLabel?: string;
  bubbleScale?: number;
  boardClassName?: string;
  maxEntries?: number;
  showCountToggle?: boolean;
  onMaxEntriesChange?: (size: BubbleLeaderboardSize) => void;
}): ReactElement {
  const bubbleScale = props.bubbleScale ?? 1;
  const maxEntries = props.maxEntries ?? props.entries.length;
  const visibleEntries = props.entries.slice(0, maxEntries);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const bubbleElementsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const boardSizeRef = useRef({ width: 1, height: 1 });
  const hiddenRef = useRef(false);
  const offscreenRef = useRef(false);
  const loopActiveRef = useRef(false);
  const lastPointerAtRef = useRef(0);
  const pointerRef = useRef({
    x: 0.5,
    y: 0.5,
    inside: false,
  });
  const entriesSignature = visibleEntries.map((entry) => entry.slotId).join('|');
  const nodesRef = useRef<NamiCryptoBubbleNode[]>(buildNamiCryptoBubbleNodes(visibleEntries, bubbleScale));
  const startLoopRef = useRef<() => void>(() => undefined);
  const [layoutRevision, setLayoutRevision] = useState(0);

  useEffect(() => {
    nodesRef.current = buildNamiCryptoBubbleNodes(visibleEntries, bubbleScale);
    bubbleElementsRef.current.clear();
    setLayoutRevision((value) => value + 1);
  }, [entriesSignature, bubbleScale]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    return subscribeVisibilityPause((paused) => {
      hiddenRef.current = paused;

      if (!paused) {
        startLoopRef.current();
      }
    });
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    const board = boardRef.current;

    if (!board) {
      return;
    }

    return subscribeIntersectionPause(board, (offscreen) => {
      offscreenRef.current = offscreen;

      if (!offscreen) {
        startLoopRef.current();
      }
    });
  }, [entriesSignature]);

  useEffect(() => {
    const board = boardRef.current;

    if (!board || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      boardSizeRef.current = {
        width: Math.max(entry.contentRect.width, 1),
        height: Math.max(entry.contentRect.height, 1),
      };
    });

    observer.observe(board);
    boardSizeRef.current = {
      width: Math.max(board.clientWidth, 1),
      height: Math.max(board.clientHeight, 1),
    };

    return () => observer.disconnect();
  }, [entriesSignature]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      const board = boardRef.current;
      const nodes = nodesRef.current;
      const width = board?.clientWidth ?? 1;
      const height = board?.clientHeight ?? 1;

      for (const node of nodes) {
        const element = bubbleElementsRef.current.get(node.id);

        if (element) {
          applyBubbleNodeStyles(node, width, height, element, true);
        }
      }

      return;
    }

    let lastSimTime = 0;
    let lastPaintTime = 0;

    function stopLoop(): void {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      loopActiveRef.current = false;
    }

    function nodesNeedSimulation(time: number): boolean {
      if (pointerRef.current.inside || time - lastPointerAtRef.current < POINTER_COAST_MS) {
        return true;
      }

      for (const node of nodesRef.current) {
        if (Math.abs(node.vx) > 0.05 || Math.abs(node.vy) > 0.05) {
          return true;
        }

        if (Math.abs(node.radius - node.baseRadius) > 0.35) {
          return true;
        }
      }

      return false;
    }

    function shouldRunPhysics(time: number): boolean {
      if (hiddenRef.current || offscreenRef.current) {
        return false;
      }

      return nodesNeedSimulation(time);
    }

    function startLoop(): void {
      if (loopActiveRef.current) {
        return;
      }

      loopActiveRef.current = true;
      animationRef.current = window.requestAnimationFrame(step);
    }

    startLoopRef.current = startLoop;

    const step = (time: number) => {
      const board = boardRef.current;
      const nodes = nodesRef.current;

      if (!board || nodes.length === 0 || !shouldRunPhysics(time)) {
        stopLoop();
        return;
      }

      if (time - lastPaintTime < TARGET_FRAME_MS) {
        animationRef.current = window.requestAnimationFrame(step);
        return;
      }

      lastPaintTime = time;

      const frameDelta = lastSimTime === 0 ? 1 : clamp((time - lastSimTime) / 16.67, 0.55, 1.55);
      lastSimTime = time;

      const width = boardSizeRef.current.width;
      const height = boardSizeRef.current.height;
      const cursorX = pointerRef.current.x * width;
      const cursorY = pointerRef.current.y * height;
      const pointerInside = pointerRef.current.inside;
      const influenceRadius = Math.min(width, height) * 0.44;
      const influenceRadiusSquared = influenceRadius * influenceRadius;

      for (const node of nodes) {
        node.collisionStress = 0;

        const px = node.x * width;
        const py = node.y * height;
        const anchorX = node.baseX * width;
        const anchorY = node.baseY * height;

        node.vx += (anchorX - px) * 0.00115 * frameDelta;
        node.vy += (anchorY - py) * 0.00115 * frameDelta;

        if (pointerInside) {
          const dx = px - cursorX;
          const dy = py - cursorY;
          const distanceSquared = dx * dx + dy * dy;

          if (distanceSquared < influenceRadiusSquared) {
            const distance = Math.sqrt(distanceSquared) || 0.0001;
            const normalized = 1 - distance / influenceRadius;
            const falloff = smoothFalloff(normalized);
            const nx = dx / distance;
            const ny = dy / distance;
            const isLargeBubble = node.baseRadius * node.scale >= 48;
            const proximityForce = isLargeBubble ? 0.42 * falloff : -0.2 * falloff;

            node.vx += nx * proximityForce * frameDelta;
            node.vy += ny * proximityForce * frameDelta;

            const radiusTarget =
              node.baseRadius * (isLargeBubble ? 1 + falloff * 0.05 : 1 + falloff * 0.11);

            node.radius += (radiusTarget - node.radius) * 0.14;
          } else {
            node.radius += (node.baseRadius - node.radius) * 0.08;
          }
        } else {
          node.radius += (node.baseRadius - node.radius) * 0.08;
        }
      }

      solveBubbleCollisions(nodes, width, height, frameDelta, 1);

      for (const node of nodes) {
        if (node.collisionStress > node.baseRadius * 1.05) {
          const awayFromCenterX = node.x - 0.5;
          const awayFromCenterY = node.y - 0.5;
          const awayDistance =
            Math.sqrt(awayFromCenterX * awayFromCenterX + awayFromCenterY * awayFromCenterY) || 0.0001;
          const stressMove = Math.min(node.collisionStress / 12000, 0.0017);

          node.baseX = clamp(node.baseX + (awayFromCenterX / awayDistance) * stressMove, 0.07, 0.93);
          node.baseY = clamp(node.baseY + (awayFromCenterY / awayDistance) * stressMove, 0.09, 0.91);
        }

        node.vx *= 0.92;
        node.vy *= 0.92;

        if (Math.abs(node.vx) < 0.012) node.vx *= 0.35;
        if (Math.abs(node.vy) < 0.012) node.vy *= 0.35;

        limitVelocity(node, 22);

        node.x += (node.vx / width) * frameDelta;
        node.y += (node.vy / height) * frameDelta;

        const padX = readableBubbleRadius(node) / width;
        const padY = readableBubbleRadius(node) / height;

        if (node.x < padX) {
          node.x = padX;
          node.vx = Math.abs(node.vx) * 0.42;
        }

        if (node.x > 1 - padX) {
          node.x = 1 - padX;
          node.vx = -Math.abs(node.vx) * 0.42;
        }

        if (node.y < padY) {
          node.y = padY;
          node.vy = Math.abs(node.vy) * 0.42;
        }

        if (node.y > 1 - padY) {
          node.y = 1 - padY;
          node.vy = -Math.abs(node.vy) * 0.42;
        }
      }

      for (const node of nodes) {
        const element = bubbleElementsRef.current.get(node.id);

        if (element) {
          applyBubbleNodeStyles(node, width, height, element);
        }
      }

      animationRef.current = window.requestAnimationFrame(step);
    };

    startLoop();

    return () => {
      stopLoop();
      startLoopRef.current = () => undefined;
    };
  }, [layoutRevision]);

  function syncBoardCursor(clientX: number, clientY: number, inside: boolean): void {
    const board = boardRef.current;

    if (!board) {
      return;
    }

    const rect = board.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);

    pointerRef.current.inside = inside;
    pointerRef.current.x = x;
    pointerRef.current.y = y;
    board.style.setProperty('--crypto-cursor-x', x * 100 + '%');
    board.style.setProperty('--crypto-cursor-y', y * 100 + '%');

    if (inside) {
      lastPointerAtRef.current = performance.now();
      startLoopRef.current();
    }
  }

  return (
    <section className="panel nami-hub-top50-panel crypto-bubbles-panel">
      <div className="browser-heading">
        <div>
          <h2>{props.heading ?? 'Top ' + maxEntries + ' Communities'}</h2>
          <p>
            {props.subheading ??
              'Live community board with loose marble physics and smooth cursor falloff.'}
          </p>
        </div>
        <div className="crypto-bubble-board-tools">
          {props.showCountToggle ? (
            <div aria-label="Bubble leaderboard size" className="crypto-bubble-count-toggle" role="group">
              {([50, 25, 10] as BubbleLeaderboardSize[]).map((size) => (
                <button
                  aria-pressed={maxEntries === size}
                  className={
                    'nami-surface-button crypto-bubble-count-button' +
                    (maxEntries === size ? ' is-active-view' : '')
                  }
                  key={size}
                  onClick={() => props.onMaxEntriesChange?.(size)}
                  type="button"
                >
                  Top {size}
                </button>
              ))}
            </div>
          ) : null}
          <span>{props.badgeLabel ?? 'Top ' + maxEntries + ' board'}</span>
        </div>
      </div>

      <div
        className={'crypto-bubbles-board' + (props.boardClassName ? ' ' + props.boardClassName : '')}
        onPointerLeave={() => {
          syncBoardCursor(0, 0, false);
          props.onHoverChannel(null);
        }}
        onPointerMove={(event) => {
          syncBoardCursor(event.clientX, event.clientY, true);
        }}
        ref={boardRef}
      >
        {nodesRef.current.map((node, index) => {
          return (
            <button
              className={
                'crypto-community-bubble' +
                (node.channel.id === props.activeChannelId ? ' is-active-crypto-bubble' : '') +
                channelRainbowBorderClass(node.channel)
              }
              key={node.id + ':' + layoutRevision}
              onClick={() => props.onOpenChannel(node.channel)}
              onMouseEnter={() => props.onHoverChannel(node.channel.id)}
              onMouseLeave={() => props.onHoverChannel(null)}
              ref={(element) => {
                if (element) {
                  bubbleElementsRef.current.set(node.id, element);
                  mountBubbleElement(
                    node,
                    element,
                    boardSizeRef.current.width,
                    boardSizeRef.current.height,
                  );
                } else {
                  bubbleElementsRef.current.delete(node.id);
                }
              }}
              style={
                {
                  '--bubble-size': bubbleVisualSize(node) + 'px',
                } as CSSProperties
              }
              type="button"
            >
              <strong>{node.channel.name}</strong>
              <small>{node.channel.genre}</small>
              <span className="crypto-bubble-rank">#{index + 1}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}