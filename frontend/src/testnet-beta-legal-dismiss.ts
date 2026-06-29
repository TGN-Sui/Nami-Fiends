const DISMISS_STORAGE_KEY = 'nami.testnet-beta-legal-dismissed';

export function readTestnetBetaLegalDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveTestnetBetaLegalDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, 'true');
  } catch {
    // Ignore restricted storage environments.
  }

  window.dispatchEvent(new CustomEvent('nami-testnet-beta-legal-dismissed'));
}

export function subscribeTestnetBetaLegalDismissed(onStoreChange: () => void): () => void {
  function handleChange(): void {
    onStoreChange();
  }

  window.addEventListener('nami-testnet-beta-legal-dismissed', handleChange);
  window.addEventListener('storage', handleChange);

  return () => {
    window.removeEventListener('nami-testnet-beta-legal-dismissed', handleChange);
    window.removeEventListener('storage', handleChange);
  };
}