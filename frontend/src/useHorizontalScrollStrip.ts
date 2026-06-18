import { useEffect, useRef, type RefObject } from 'react';

const DRAG_START_THRESHOLD_PX = 4;
const CLICK_SUPPRESS_MS = 280;

type DragState = {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  dragging: boolean;
};

export function useHorizontalScrollStrip<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const scrollHost = ref.current;

    if (!scrollHost) {
      return;
    }

    const host: HTMLElement = scrollHost;
    let dragState: DragState | null = null;
    let suppressClickUntil = 0;

    function canScrollHorizontally(): boolean {
      return host.scrollWidth > host.clientWidth;
    }

    function onWheel(event: WheelEvent): void {
      if (!canScrollHorizontally()) {
        return;
      }

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

      if (delta === 0) {
        return;
      }

      host.scrollLeft += delta;
      event.preventDefault();
    }

    function onPointerDown(event: PointerEvent): void {
      if (event.button !== 0 || !canScrollHorizontally()) {
        return;
      }

      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: host.scrollLeft,
        dragging: false,
      };

      host.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event: PointerEvent): void {
      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;

      if (!dragState.dragging && Math.abs(deltaX) < DRAG_START_THRESHOLD_PX) {
        return;
      }

      if (!dragState.dragging) {
        dragState.dragging = true;
        host.classList.add('is-drag-scrolling');
      }

      host.scrollLeft = dragState.startScrollLeft - deltaX;
      event.preventDefault();
    }

    function endDrag(event: PointerEvent): void {
      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      if (dragState.dragging) {
        suppressClickUntil = Date.now() + CLICK_SUPPRESS_MS;
      }

      host.classList.remove('is-drag-scrolling');

      if (host.hasPointerCapture(event.pointerId)) {
        host.releasePointerCapture(event.pointerId);
      }

      dragState = null;
    }

    function onClickCapture(event: MouseEvent): void {
      if (Date.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }

    host.addEventListener('wheel', onWheel, { passive: false });
    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerup', endDrag);
    host.addEventListener('pointercancel', endDrag);
    host.addEventListener('click', onClickCapture, true);

    return () => {
      host.removeEventListener('wheel', onWheel);
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerup', endDrag);
      host.removeEventListener('pointercancel', endDrag);
      host.removeEventListener('click', onClickCapture, true);
      host.classList.remove('is-drag-scrolling');
    };
  }, []);

  return ref;
}