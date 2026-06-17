export type HubSpotlightTarget = 'nami' | 'game';

export function triggerHubSpotlightBurst(target: HubSpotlightTarget): void {
  document.body.classList.remove(
    'is-hub-spotlight-burst',
    'is-hub-spotlight-nami',
    'is-hub-spotlight-game'
  );

  void document.body.offsetWidth;

  document.body.classList.add(
    'is-hub-spotlight-burst',
    target === 'nami' ? 'is-hub-spotlight-nami' : 'is-hub-spotlight-game'
  );

  window.setTimeout(() => {
    document.body.classList.remove('is-hub-spotlight-burst');
  }, 1180);
}