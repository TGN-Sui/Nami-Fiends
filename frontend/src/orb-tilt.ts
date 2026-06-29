import type { PointerEvent as ReactPointerEvent } from 'react';

export function applyOrbTilt(element: HTMLElement, clientX: number, clientY: number): void {
  const rect = element.getBoundingClientRect();
  const pointerX = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  const pointerY = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);

  element.classList.add('is-orb-tilting');
  element.style.setProperty('--orb-glare-x', (pointerX * 100).toFixed(2) + '%');
  element.style.setProperty('--orb-glare-y', (pointerY * 100).toFixed(2) + '%');
  element.style.setProperty('--orb-glare-opacity', '0.84');
}

export function resetOrbTilt(element: HTMLElement): void {
  element.classList.remove('is-orb-tilting');
  element.style.setProperty('--orb-glare-x', '38%');
  element.style.setProperty('--orb-glare-y', '30%');
  element.style.setProperty('--orb-glare-opacity', '0');
}

export const orbTiltHandlers = {
  onPointerEnter(event: ReactPointerEvent<HTMLElement>): void {
    applyOrbTilt(event.currentTarget, event.clientX, event.clientY);
  },
  onPointerMove(event: ReactPointerEvent<HTMLElement>): void {
    applyOrbTilt(event.currentTarget, event.clientX, event.clientY);
  },
  onPointerLeave(event: ReactPointerEvent<HTMLElement>): void {
    resetOrbTilt(event.currentTarget);
  },
};