export type HubSpotlightTarget = 'nami' | 'game' | 'arcade';

export function triggerHubSpotlightBurst(target: HubSpotlightTarget): void {
  document.body.classList.remove(
    'is-hub-spotlight-burst',
    'is-hub-spotlight-nami',
    'is-hub-spotlight-game',
    'is-hub-spotlight-arcade'
  );

  void document.body.offsetWidth;

  const targetClass =
    target === 'nami'
      ? 'is-hub-spotlight-nami'
      : target === 'game'
        ? 'is-hub-spotlight-game'
        : 'is-hub-spotlight-arcade';

  document.body.classList.add('is-hub-spotlight-burst', targetClass);

  window.setTimeout(() => {
    document.body.classList.remove('is-hub-spotlight-burst');
  }, 1180);
}