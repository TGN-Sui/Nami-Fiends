import { useEffect, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

import { CalendarEventCards } from './CalendarEventCards.js';
import type { StoredEvent } from './events-store.js';
import { formatDayLabel } from './universal-calendar.js';
import type { NamiChannel } from './uiMockData.js';

export function CalendarDayEventsPopup(props: {
  dayKey: string | null;
  events: StoredEvent[];
  onClose: () => void;
  onOpenChannel?: (channel: NamiChannel) => void;
  onViewEvent: (event: StoredEvent) => void;
  timezone: string;
}): ReactElement | null {
  useEffect(() => {
    if (!props.dayKey) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        props.onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [props.dayKey, props.onClose]);

  if (!props.dayKey) {
    return null;
  }

  return createPortal(
    <div
      aria-labelledby="calendar-day-events-title"
      aria-modal="true"
      className="calendar-day-events-overlay"
      onClick={props.onClose}
      role="dialog"
    >
      <div className="calendar-day-events-dialog" onClick={(event) => event.stopPropagation()}>
        <header className="calendar-day-events-head">
          <div>
            <span className="mini-badge">Day schedule</span>
            <h2 id="calendar-day-events-title">{formatDayLabel(props.dayKey, props.timezone)}</h2>
            <p>
              {props.events.length} event{props.events.length === 1 ? '' : 's'} on this day
            </p>
          </div>
          <button
            aria-label="Close day schedule"
            className="calendar-day-events-close"
            onClick={props.onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="calendar-day-events-scroll">
          <CalendarEventCards
            events={props.events}
            {...(props.onOpenChannel ? { onOpenChannel: props.onOpenChannel } : {})}
            onViewEvent={props.onViewEvent}
            timezone={props.timezone}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}