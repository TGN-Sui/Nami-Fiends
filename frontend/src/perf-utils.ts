export function subscribeRafPointerMove(
  onMove: (event: PointerEvent) => void,
): () => void {
  let frameId = 0;
  let pending: PointerEvent | null = null;

  function flush(): void {
    frameId = 0;

    if (!pending) {
      return;
    }

    const event = pending;
    pending = null;
    onMove(event);
  }

  function onPointerMove(event: PointerEvent): void {
    pending = event;

    if (frameId === 0) {
      frameId = window.requestAnimationFrame(flush);
    }
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });

  return () => {
    if (frameId !== 0) {
      window.cancelAnimationFrame(frameId);
    }

    window.removeEventListener('pointermove', onPointerMove);
  };
}

export function subscribeVisibilityPause(onPauseChange: (paused: boolean) => void): () => void {
  function sync(): void {
    onPauseChange(document.hidden);
  }

  document.addEventListener('visibilitychange', sync);
  sync();

  return () => document.removeEventListener('visibilitychange', sync);
}

export function subscribeIntersectionPause(
  element: HTMLElement | null,
  onPauseChange: (paused: boolean) => void,
  margin = '120px',
): () => void {
  if (!element || typeof IntersectionObserver === 'undefined') {
    onPauseChange(false);
    return () => undefined;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];

      if (entry) {
        onPauseChange(!entry.isIntersecting);
      }
    },
    { rootMargin: margin },
  );

  observer.observe(element);

  return () => observer.disconnect();
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}