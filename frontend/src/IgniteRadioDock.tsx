import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';

import {
  readIgniteRadioPosition,
  saveIgniteRadioPosition,
  useIgniteRadioEnabled,
  type IgniteRadioPosition,
} from './ignite-radio-store.js';

const EMBED_SRC =
  'https://igniteradio.xyz/embed/?s=gmyth-radio&skin=minimal&accent=black&radius=sm&size=compact&art=0&brand=0&viz=pulse&transparent=1';
const DOCK_WIDTH_PX = 320;
const DOCK_HEIGHT_PX = 164;
const EMBED_HEIGHT_PX = 120;
const DEFAULT_TOP_PX = 148;
const DEFAULT_RIGHT_PX = 28;

function clampDockPosition(position: IgniteRadioPosition): IgniteRadioPosition {
  const maxX = Math.max(12, window.innerWidth - DOCK_WIDTH_PX - 12);
  const maxY = Math.max(12, window.innerHeight - DOCK_HEIGHT_PX - 12);

  return {
    x: Math.min(Math.max(12, position.x), maxX),
    y: Math.min(Math.max(12, position.y), maxY),
  };
}

function defaultDockPosition(): IgniteRadioPosition {
  return clampDockPosition({
    x: window.innerWidth - DOCK_WIDTH_PX - DEFAULT_RIGHT_PX,
    y: DEFAULT_TOP_PX,
  });
}

export function IgniteRadioDock(): ReactElement | null {
  const enabled = useIgniteRadioEnabled();
  const [position, setPosition] = useState<IgniteRadioPosition>(() => {
    return readIgniteRadioPosition() ?? defaultDockPosition();
  });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleResize(): void {
      setPosition((current) => clampDockPosition(current));
    }

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const stored = readIgniteRadioPosition();
    setPosition(stored ?? defaultDockPosition());
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>): void {
    if (event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    setPosition(
      clampDockPosition({
        x: dragRef.current.originX + deltaX,
        y: dragRef.current.originY + deltaY,
      })
    );
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>): void {
    const dragState = dragRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const nextPosition = clampDockPosition({
      x: dragState.originX + (event.clientX - dragState.startX),
      y: dragState.originY + (event.clientY - dragState.startY),
    });

    dragRef.current = null;
    setPosition(nextPosition);
    saveIgniteRadioPosition(nextPosition);
  }

  return createPortal(
    <div
      className="ignite-radio-dock"
      id="ignite-radio-embed-dock"
      style={{
        left: position.x + 'px',
        top: position.y + 'px',
        width: DOCK_WIDTH_PX + 'px',
      }}
    >
      <div
        aria-label="Drag Ignite Radio player"
        className="ignite-radio-drag-handle"
        onPointerCancel={endDrag}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        role="button"
        tabIndex={0}
      >
        <span className="mini-badge">Ignite Radio</span>
        <small>Drag to reposition</small>
      </div>

      <div className="ignite-radio-embed-inner">
        <iframe
          allow="autoplay"
          className="ignite-radio-embed-frame"
          height={EMBED_HEIGHT_PX}
          loading="lazy"
          src={EMBED_SRC}
          title="Ignite Radio Player"
          width="100%"
        />
      </div>
    </div>,
    document.body
  );
}