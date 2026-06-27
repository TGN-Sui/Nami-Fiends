import { useEffect, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

import { UniversalCalendarPanel } from './UniversalCalendarPanel.js';
import type { StoredEvent } from './events-store.js';
import {
  closeUniversalCalendarOverlay,
  useUniversalCalendarOverlayOpen,
} from './universal-calendar-overlay-store.js';
import type { NamiChannel } from './uiMockData.js';

export function UniversalCalendarOverlay(props: {
  onOpenChannel?: (channel: NamiChannel) => void;
  onViewEvent: (event: StoredEvent) => void;
}): ReactElement | null {
  const open = useUniversalCalendarOverlayOpen();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        closeUniversalCalendarOverlay();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      aria-labelledby="universal-calendar-overlay-title"
      aria-modal="true"
      className="universal-calendar-overlay"
      onClick={() => closeUniversalCalendarOverlay()}
      role="dialog"
    >
      <div className="universal-calendar-overlay-dialog" onClick={(event) => event.stopPropagation()}>
        <header className="universal-calendar-overlay-head">
          <div>
            <span className="mini-badge">Discovery</span>
            <h2 id="universal-calendar-overlay-title">Universal calendar</h2>
            <p>Official Nami and game channel owner schedules across the platform.</p>
          </div>
          <button
            aria-label="Close universal calendar"
            className="universal-calendar-overlay-close"
            onClick={() => closeUniversalCalendarOverlay()}
            type="button"
          >
            ×
          </button>
        </header>

        <UniversalCalendarPanel
          layout="overlay"
          onViewEvent={(event) => {
            closeUniversalCalendarOverlay();
            props.onViewEvent(event);
          }}
          scope="universal"
          {...(props.onOpenChannel
            ? {
                onOpenChannel: (channel) => {
                  closeUniversalCalendarOverlay();
                  props.onOpenChannel?.(channel);
                },
              }
            : {})}
        />
      </div>
    </div>,
    document.body
  );
}