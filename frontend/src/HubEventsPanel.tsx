import { type ReactElement } from 'react';

import { officialNamiHubEvents, type NamiEvent } from './events-data.js';

export function HubEventsPanel(props: {
  onViewEvent: (event: NamiEvent) => void;
}): ReactElement {
  return (
    <article className="panel nami-hub-events-panel">
      <div className="profile-panel-heading">
        <h2>Official Nami Events</h2>
        <p>Cross-community events hosted by Nami. Subscribe from My Events.</p>
      </div>

      <div className="channel-event-grid">
        {officialNamiHubEvents.map((event) => (
          <article className="channel-event-card panel" key={event.id}>
            <div>
              <span className="mini-badge">{event.status}</span>
              <h2>{event.title}</h2>
              <p>{event.dateLabel}</p>
            </div>
            <p>{event.description}</p>
            <div className="channel-event-meta-row">
              <span>Official</span>
              <strong>{event.seats}</strong>
            </div>
            <button className="primary-action" onClick={() => props.onViewEvent(event)} type="button">
              View Event
            </button>
          </article>
        ))}
      </div>
    </article>
  );
}