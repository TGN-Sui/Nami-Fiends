import { useState, type ReactElement } from 'react';

import {
  isEventInterested,
  readInterestedCount,
  toggleEventInterest,
  useEventsStore,
} from './events-store.js';

export function EventInterestedButton(props: { eventId: string }): ReactElement {
  useEventsStore();
  const [notice, setNotice] = useState('');
  const interested = isEventInterested(props.eventId);
  const interestedCount = readInterestedCount(props.eventId);

  function handleToggle(): void {
    const nextInterested = toggleEventInterest(props.eventId);

    setNotice(
      nextInterested
        ? 'Interested — we will notify you in your timezone before this event starts.'
        : 'Removed from your interested list.'
    );

    window.setTimeout(() => setNotice(''), 3200);
  }

  return (
    <div className="event-interested-actions">
      <button
        aria-pressed={interested}
        className={
          'nami-surface-button event-interested-button' + (interested ? ' is-active-view' : '')
        }
        onClick={handleToggle}
        type="button"
      >
        {interested ? 'Interested ✓' : 'Interested'}
      </button>
      <span className="event-interested-count">{interestedCount.toLocaleString()} interested</span>
      {notice ? (
        <p aria-live="polite" className="event-interested-notice" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}