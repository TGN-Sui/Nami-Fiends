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
  saveIgniteRadioCollapsed,
  saveIgniteRadioPosition,
  useIgniteRadioCollapsed,
  useIgniteRadioEnabled,
  type IgniteRadioPosition,
} from './ignite-radio-store.js';

const EMBED_SRC =
  'https://igniteradio.xyz/embed/?s=gmyth-radio&skin=minimal&accent=black&radius=sm&size=compact&art=0&brand=0&viz=pulse&transparent=1';
const DOCK_WIDTH_PX = 320;
const DOCK_COLLAPSED_HEIGHT_PX = 44;
const DOCK_EXPANDED_HEIGHT_PX = 164;
const EMBED_HEIGHT_PX = 120;
const DEFAULT_TOP_PX = 148;
const DEFAULT_RIGHT_PX = 28;

function mobileBottomNavReservePx(): number {
  return window.innerWidth <= 760 ? 76 : 0;
}

function clampDockPosition(position: IgniteRadioPosition, collapsed: boolean): IgniteRadioPosition {
  const dockHeight = collapsed ? DOCK_COLLAPSED_HEIGHT_PX : DOCK_EXPANDED_HEIGHT_PX;
  const bottomReserve = mobileBottomNavReservePx();
  const maxX = Math.max(12, window.innerWidth - DOCK_WIDTH_PX - 12);
  const maxY = Math.max(12, window.innerHeight - dockHeight - 12 - bottomReserve);

  return {
    x: Math.min(Math.max(12, position.x), maxX),
    y: Math.min(Math.max(12, position.y), maxY),
  };
}

function defaultDockPosition(collapsed: boolean): IgniteRadioPosition {
  return clampDockPosition(
    {
      x: window.innerWidth - DOCK_WIDTH_PX - DEFAULT_RIGHT_PX,
      y: DEFAULT_TOP_PX,
    },
    collapsed,
  );
}

export function IgniteRadioDock(): ReactElement | null {
  const enabled = useIgniteRadioEnabled();
  const collapsed = useIgniteRadioCollapsed();
  const [position, setPosition] = useState<IgniteRadioPosition>(() => {
    return readIgniteRadioPosition() ?? defaultDockPosition(collapsed);
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
      setPosition((current) => clampDockPosition(current, collapsed));
    }

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const stored = readIgniteRadioPosition();
    setPosition((current) => clampDockPosition(stored ?? current, collapsed));
  }, [collapsed, enabled]);

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
      clampDockPosition(
        {
          x: dragRef.current.originX + deltaX,
          y: dragRef.current.originY + deltaY,
        },
        collapsed,
      ),
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

    const nextPosition = clampDockPosition(
      {
        x: dragState.originX + (event.clientX - dragState.startX),
        y: dragState.originY + (event.clientY - dragState.startY),
      },
      collapsed,
    );

    dragRef.current = null;
    setPosition(nextPosition);
    saveIgniteRadioPosition(nextPosition);
  }

  return createPortal(
    <div
      className={'ignite-radio-dock' + (collapsed ? ' is-ignite-radio-collapsed' : '')}
      id="ignite-radio-embed-dock"
      style={{
        left: position.x + 'px',
        top: position.y + 'px',
        width: DOCK_WIDTH_PX + 'px',
      }}
    >
      <div className="ignite-radio-drag-handle">
        <div
          aria-label="Drag Ignite Radio player"
          className="ignite-radio-drag-surface"
          onPointerCancel={endDrag}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          role="button"
          tabIndex={0}
        >
          <span className="mini-badge">Ignite Radio</span>
          <small>{collapsed ? 'Collapsed — expand to listen' : 'Drag to reposition'}</small>
        </div>

        <button
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand Ignite Radio player' : 'Collapse Ignite Radio player'}
          className="ignite-radio-collapse-toggle"
          onClick={() => saveIgniteRadioCollapsed(!collapsed)}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          <span className="ignite-radio-collapse-icon" aria-hidden="true">
            {collapsed ? '▾' : '▴'}
          </span>
          <span>{collapsed ? 'Expand' : 'Collapse'}</span>
        </button>
      </div>

      {collapsed ? null : (
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
      )}
    </div>,
    document.body
  );
}