export function updateGameCardTilt(element: HTMLElement, clientX: number, clientY: number): void {
  const rect = element.getBoundingClientRect();
  const pointerX = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  const pointerY = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);

  element.style.setProperty('--game-card-tilt-x', ((pointerX - 0.5) * 11).toFixed(2) + 'deg');
  element.style.setProperty('--game-card-tilt-y', ((0.5 - pointerY) * 9).toFixed(2) + 'deg');
  element.style.setProperty('--game-card-foil-x', (pointerX * 100).toFixed(2) + '%');
  element.style.setProperty('--game-card-foil-y', (pointerY * 100).toFixed(2) + '%');
}

export function resetGameCardTilt(element: HTMLElement): void {
  element.style.setProperty('--game-card-tilt-x', '0deg');
  element.style.setProperty('--game-card-tilt-y', '0deg');
  element.style.setProperty('--game-card-foil-x', '50%');
  element.style.setProperty('--game-card-foil-y', '18%');
}