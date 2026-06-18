import { useEffect, useRef, type RefObject } from 'react';

const DRAG_START_THRESHOLD_PX = 4;
const CLICK_SUPPRESS_MS = 280;
const MOMENTUM_MIN_VELOCITY = 0.02;
const MOMENTUM_FRICTION = 0.91;
const WHEEL_SMOOTH_FACTOR = 0.24;

type DragState = {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  dragging: boolean;
};

function clampScrollLeft(host: HTMLElement, value: number): number {
  const maxScroll = Math.max(0, host.scrollWidth - host.clientWidth);

  return Math.max(0, Math.min(value, maxScroll));
}

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
    let scrollVelocity = 0;
    let lastScrollLeft = host.scrollLeft;
    let lastScrollSampleAt = performance.now();
    let momentumFrame: number | null = null;
    let wheelFrame: number | null = null;
    let wheelTarget = host.scrollLeft;

    function canScrollHorizontally(): boolean {
      return host.scrollWidth > host.clientWidth;
    }

    function stopMomentum(): void {
      if (momentumFrame !== null) {
        window.cancelAnimationFrame(momentumFrame);
        momentumFrame = null;
      }
    }

    function stopWheelAnimation(): void {
      if (wheelFrame !== null) {
        window.cancelAnimationFrame(wheelFrame);
        wheelFrame = null;
      }
    }

    function sampleScrollVelocity(): void {
      const now = performance.now();
      const elapsed = now - lastScrollSampleAt;

      if (elapsed > 0) {
        scrollVelocity = (host.scrollLeft - lastScrollLeft) / elapsed;
      }

      lastScrollLeft = host.scrollLeft;
      lastScrollSampleAt = now;
    }

    function runMomentum(): void {
      stopMomentum();

      if (Math.abs(scrollVelocity) < MOMENTUM_MIN_VELOCITY) {
        return;
      }

      let velocity = scrollVelocity * 16;

      const step = () => {
        const nextScrollLeft = clampScrollLeft(host, host.scrollLeft + velocity);
        const hitEdge = nextScrollLeft !== host.scrollLeft + velocity;

        host.scrollLeft = nextScrollLeft;
        velocity *= MOMENTUM_FRICTION;

        if (hitEdge || Math.abs(velocity) < 0.35) {
          momentumFrame = null;
          return;
        }

        momentumFrame = window.requestAnimationFrame(step);
      };

      momentumFrame = window.requestAnimationFrame(step);
    }

    function animateWheelScroll(): void {
      const delta = wheelTarget - host.scrollLeft;

      if (Math.abs(delta) < 0.5) {
        host.scrollLeft = wheelTarget;
        wheelFrame = null;
        return;
      }

      host.scrollLeft += delta * WHEEL_SMOOTH_FACTOR;
      sampleScrollVelocity();
      wheelFrame = window.requestAnimationFrame(animateWheelScroll);
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

      stopMomentum();
      wheelTarget = clampScrollLeft(host, (wheelFrame === null ? host.scrollLeft : wheelTarget) + delta);

      if (wheelFrame === null) {
        wheelFrame = window.requestAnimationFrame(animateWheelScroll);
      }

      event.preventDefault();
    }

    function onPointerDown(event: PointerEvent): void {
      if (event.button !== 0 || !canScrollHorizontally()) {
        return;
      }

      stopMomentum();
      stopWheelAnimation();
      wheelTarget = host.scrollLeft;
      scrollVelocity = 0;
      lastScrollLeft = host.scrollLeft;
      lastScrollSampleAt = performance.now();

      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: host.scrollLeft,
        dragging: false,
      };
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

        if (!host.hasPointerCapture(event.pointerId)) {
          host.setPointerCapture(event.pointerId);
        }
      }

      host.scrollLeft = clampScrollLeft(host, dragState.startScrollLeft - deltaX);
      sampleScrollVelocity();
      event.preventDefault();
    }

    function endDrag(event: PointerEvent): void {
      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      if (dragState.dragging) {
        suppressClickUntil = Date.now() + CLICK_SUPPRESS_MS;
        runMomentum();
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
      stopMomentum();
      stopWheelAnimation();
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