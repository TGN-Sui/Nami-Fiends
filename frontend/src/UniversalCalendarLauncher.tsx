import type { ReactElement } from 'react';

import { openUniversalCalendarOverlay } from './universal-calendar-overlay-store.js';

export function UniversalCalendarLauncher(): ReactElement {
  return (
    <button
      aria-label="Open universal calendar"
      className="universal-calendar-launcher"
      onClick={() => openUniversalCalendarOverlay()}
      title="Universal calendar"
      type="button"
    >
      <svg aria-hidden="true" className="universal-calendar-launcher-icon" viewBox="0 0 24 24">
        <rect height="17" rx="2" width="18" x="3" y="4.5" />
        <path d="M3 9.5h18" />
        <path d="M8 3.5v3" />
        <path d="M16 3.5v3" />
        <circle cx="8.5" cy="14" fill="currentColor" r="1.1" />
        <circle cx="12" cy="14" fill="currentColor" r="1.1" />
        <circle cx="15.5" cy="14" fill="currentColor" r="1.1" />
      </svg>
    </button>
  );
}