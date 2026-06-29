import { useMemo, useState, type ReactElement } from 'react';

import { isDemoSimulationEnabled } from './app-config.js';
import { EventInterestedButton } from './EventInterestedButton.js';
import { HubUpcomingEventsStrip } from './HubUpcomingEventsStrip.js';
import {
  canEditOfficialEvent,
  createOfficialEvent,
  formatEventTimeInTimezone,
  getOfficialHubEvents,
  isEventLive,
  isEventStartingSoon,
  readViewerTimezone,
  simulateLiveInterestedEventPopup,
  simulateStartingSoonInterestedEvent,
  updateStoredEvent,
  deleteOfficialEvent,
  useEventsStore,
  type StoredEvent,
} from './events-store.js';
import { useSelfMember } from './member-avatar-store.js';
import type { NamiChannel } from './uiMockData.js';

function officialEventStatusLabel(event: StoredEvent): string {
  if (isEventLive(event)) {
    return 'Live';
  }

  if (isEventStartingSoon(event)) {
    return 'Soon';
  }

  return event.status;
}

function HubOfficialEventCard(props: {
  canManageOfficial: boolean;
  event: StoredEvent;
  onEdit: (event: StoredEvent) => void;
  onView: () => void;
}): ReactElement {
  const live = isEventLive(props.event);
  const soon = isEventStartingSoon(props.event);

  return (
    <article
      className={
        'nami-hub-official-card' +
        (live ? ' is-event-live-importance' : soon ? ' is-event-soon-importance' : '')
      }
    >
      <div className="nami-hub-official-card-main">
        <span className="nami-hub-official-badge">Official Nami</span>
        <div className="nami-hub-official-card-copy">
          <strong>{props.event.title}</strong>
          <time dateTime={props.event.startsAtUtc}>
            {formatEventTimeInTimezone(props.event.startsAtUtc)}
          </time>
        </div>
        <span className="nami-hub-official-status-pill">{officialEventStatusLabel(props.event)}</span>
      </div>

      <div className="nami-hub-official-card-actions">
        <EventInterestedButton eventId={props.event.id} layout="inline" />
        <button className="nami-hub-3d-button" onClick={props.onView} type="button">
          View
        </button>
        {props.canManageOfficial ? (
          <>
            <button
              className="nami-hub-3d-button is-hub-3d-button-secondary"
              onClick={() => props.onEdit(props.event)}
              type="button"
            >
              Edit
            </button>
            <button
              className="nami-hub-3d-button is-hub-3d-button-ghost"
              onClick={() => {
                if (window.confirm('Delete "' + props.event.title + '"?')) {
                  deleteOfficialEvent(props.event.id);
                }
              }}
              type="button"
            >
              Delete
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

export function HubEventsPanel(props: {
  onOpenCalendar?: () => void;
  onOpenChannel?: (channel: NamiChannel) => void;
  onViewEvent: (event: StoredEvent) => void;
}): ReactElement {
  const { revision: eventsRevision } = useEventsStore();
  const selfMember = useSelfMember();
  const canManageOfficial = canEditOfficialEvent(selfMember);
  const [showCreate, setShowCreate] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [startsAtLocal, setStartsAtLocal] = useState('');
  const [notice, setNotice] = useState('');

  const officialEvents = useMemo(() => getOfficialHubEvents(), [eventsRevision]);
  const timezone = readViewerTimezone();

  function resetForm(): void {
    setTitle('');
    setDescription('');
    setBody('');
    setStartsAtLocal('');
    setEditingEventId(null);
    setShowCreate(false);
  }

  function loadForEdit(event: StoredEvent): void {
    setEditingEventId(event.id);
    setTitle(event.title);
    setDescription(event.description);
    setBody(event.body);
    const local = new Date(event.startsAtUtc);
    const offset = local.getTimezoneOffset() * 60_000;
    setStartsAtLocal(new Date(local.getTime() - offset).toISOString().slice(0, 16));
    setShowCreate(true);
  }

  function handleSubmit(): void {
    if (!canManageOfficial) {
      setNotice('Only Nami officials can create or edit official Nami events.');
      return;
    }

    if (!title.trim() || !startsAtLocal) {
      setNotice('Add a title and start time.');
      return;
    }

    const startsAtUtc = new Date(startsAtLocal).toISOString();

    if (editingEventId) {
      const updated = updateStoredEvent(editingEventId, {
        title,
        description,
        body,
        startsAtUtc,
        status: 'Official',
      });

      setNotice(updated ? 'Official event updated.' : 'Could not update this official event.');
    } else {
      const created = createOfficialEvent({
        title,
        description,
        body: body.trim() || description.trim(),
        startsAtUtc,
      });

      setNotice(
        created
          ? 'Official event published.'
          : 'Only Nami officials can publish official events.'
      );
    }

    resetForm();
  }

  return (
    <article className="panel nami-hub-events-panel">
      <header className="nami-hub-events-panel-top">
        <div className="nami-hub-events-panel-heading">
          <h2>Events</h2>
          <p>Official Nami hosts up top · universal feed scrolls below · {timezone}</p>
        </div>
        {canManageOfficial ? (
          <button
            className="nami-hub-3d-button is-hub-3d-button-compact"
            onClick={() => {
              resetForm();
              setShowCreate((value) => !value);
            }}
            type="button"
          >
            {showCreate ? 'Close' : 'New official'}
          </button>
        ) : null}
      </header>

      {showCreate && canManageOfficial ? (
        <div className="nami-hub-official-editor panel">
          <h3>{editingEventId ? 'Edit official event' : 'New official event'}</h3>
          <div className="nami-hub-official-editor-grid">
            <label>
              <span>Title</span>
              <input onChange={(event) => setTitle(event.target.value)} type="text" value={title} />
            </label>
            <label>
              <span>Starts at</span>
              <input
                onChange={(event) => setStartsAtLocal(event.target.value)}
                type="datetime-local"
                value={startsAtLocal}
              />
            </label>
            <label className="is-hub-editor-wide">
              <span>Short description</span>
              <input
                onChange={(event) => setDescription(event.target.value)}
                type="text"
                value={description}
              />
            </label>
          </div>
          <button className="nami-hub-3d-button is-hub-3d-button-primary" onClick={handleSubmit} type="button">
            {editingEventId ? 'Save' : 'Publish'}
          </button>
        </div>
      ) : null}

      {notice ? <p className="nami-hub-events-notice">{notice}</p> : null}

      <section className="nami-hub-events-official-zone">
        <header className="nami-hub-events-official-head">
          <h3>Official Nami</h3>
          <span className="nami-hub-events-official-count">{officialEvents.length} scheduled</span>
        </header>

        {officialEvents.length === 0 ? (
          <p className="nami-hub-official-empty">No official Nami events scheduled yet.</p>
        ) : (
          <div className="nami-hub-official-list">
            {officialEvents.map((event) => (
              <HubOfficialEventCard
                canManageOfficial={canManageOfficial}
                event={event}
                key={event.id}
                onEdit={loadForEdit}
                onView={() => props.onViewEvent(event)}
              />
            ))}
          </div>
        )}
      </section>

      <HubUpcomingEventsStrip
        {...(props.onOpenChannel ? { onOpenChannel: props.onOpenChannel } : {})}
        onViewEvent={props.onViewEvent}
      />

      {isDemoSimulationEnabled() ? (
        <div className="event-demo-sim-actions">
          <button
            className="nami-hub-3d-button is-hub-3d-button-compact"
            onClick={() => {
              const simulated = simulateLiveInterestedEventPopup();
              setNotice(
                simulated.length > 0
                  ? 'Live popup simulated.'
                  : 'Could not simulate live popup.'
              );
            }}
            type="button"
          >
            Simulate live popup
          </button>
          <button
            className="profile-secondary-link"
            onClick={() => {
              const simulated = simulateStartingSoonInterestedEvent();
              setNotice(simulated ? 'Starting-soon reminder simulated.' : 'Could not simulate.');
            }}
            type="button"
          >
            Simulate starting-soon
          </button>
        </div>
      ) : null}
    </article>
  );
}