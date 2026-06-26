import type { ReactElement } from 'react';

import { dismissNamiToast, useNamiToasts } from './nami-toast-store.js';

export function NamiToastStack(): ReactElement | null {
  const toasts = useNamiToasts();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div aria-live="polite" className="nami-toast-stack" role="status">
      {toasts.map((toast) => (
        <div
          className={'nami-toast is-tone-' + toast.tone}
          key={toast.id}
          role="alert"
        >
          <p>{toast.message}</p>
          <button
            aria-label="Dismiss notification"
            className="nami-toast-dismiss"
            onClick={() => dismissNamiToast(toast.id)}
            type="button"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}