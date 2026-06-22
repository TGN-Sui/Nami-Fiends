import { useMemo, useState, type ReactElement } from 'react';

import { isDemoSimulationEnabled } from './app-config.js';
import { EventCardActionBar } from './EventCardActionBar.js';
import {
  canEditOfficialEvent,
  createOfficialEvent,
  formatEventTimeInTimezone,
  getOfficialHubEvents,
  isEventLive,
  isEventStartingSoon,
  readViewerTimezone,
  saveViewerTimezone,
  simulateLiveInterestedEventPopup,
  simulateStartingSoonInterestedEvent,
  updateStoredEvent,
  useEventsStore,
  type StoredEvent,
} from './events-store.js';
import { useSelfMember } from './member-avatar-store.js';

function officialEventStatusLabel(event: StoredEvent): string {
  if (isEventLive(event)) {
    return 'Live now';
  }

  if (isEventStartingSoon(event)) {
    return 'Starting soon';
  }

  return event.status;
}

export function HubEventsPanel(props: {
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
          ? 'Official event published. Subscribed members were notified.'
          : 'Only Nami officials can publish official events.'
      );
    }

    resetForm();
  }

  function handleDelete(eventId: string): void {
    if (editingEventId === eventId) {
      resetForm();
    }

    setNotice('Official event deleted.');
  }

  return (
    <article className="panel nami-hub-events-panel">
      <div className="profile-panel-heading is-hub-panel-heading nami-hub-events-panel-heading">
        <div className="is-hub-panel-heading-copy">
          <h2>Official Nami Events</h2>
          <p>Cross-community events hosted by Nami. Times display in your timezone.</p>
          <small className="event-timezone-note">Your timezone: {readViewerTimezone()}</small>
        </div>
        {canManageOfficial ? (
          <button
            className="nami-surface-button"
            onClick={() => {
              resetForm();
              setShowCreate((value) => !value);
            }}
            type="button"
          >
            {showCreate ? 'Close editor' : 'Create official event'}
          </button>
        ) : null}
      </div>

      <label className="event-timezone-field">
        <span>Event timezone</span>
        <input
          onChange={(event) => saveViewerTimezone(event.target.value)}
          placeholder="America/Los_Angeles"
          type="text"
          value={readViewerTimezone()}
        />
      </label>

      {showCreate && canManageOfficial ? (
        <div className="event-creator-form panel official-event-creator-form">
          <h3>{editingEventId ? 'Edit official event' : 'New official event'}</h3>
          <label>
            <span>Title</span>
            <input onChange={(event) => setTitle(event.target.value)} type="text" value={title} />
          </label>
          <label>
            <span>Description</span>
            <input
              onChange={(event) => setDescription(event.target.value)}
              type="text"
              value={description}
            />
          </label>
          <label>
            <span>Details</span>
            <textarea onChange={(event) => setBody(event.target.value)} rows={3} value={body} />
          </label>
          <label>
            <span>Starts at (your local time)</span>
            <input
              onChange={(event) => setStartsAtLocal(event.target.value)}
              type="datetime-local"
              value={startsAtLocal}
            />
          </label>
          <button className="nami-surface-button is-primary-surface-button" onClick={handleSubmit} type="button">
            {editingEventId ? 'Save official event' : 'Publish official event'}
          </button>
        </div>
      ) : null}

      {notice ? <p className="event-creator-notice">{notice}</p> : null}

      {officialEvents.length === 0 ? (
        <article className="panel official-events-empty-state">
          <strong>No official events scheduled</strong>
          <p>Cross-community Nami events will appear here when published.</p>
        </article>
      ) : (
        <div className="official-events-list">
          {officialEvents.map((event, eventIndex) => (
            <article
              className={
                'official-event-card panel' +
                (isEventLive(event)
                  ? ' is-event-live-importance'
                  : isEventStartingSoon(event)
                    ? ' is-event-soon-importance'
                    : '')
              }
              key={event.id}
            >
              <div className="official-event-card-top">
                <span className="mini-badge">Official Nami</span>
                <span className="official-event-status-pill">{officialEventStatusLabel(event)}</span>
              </div>

              <div className="official-event-card-copy">
                <h3>{event.title}</h3>
                <time dateTime={event.startsAtUtc}>{formatEventTimeInTimezone(event.startsAtUtc)}</time>
                <p>{event.description}</p>
              </div>

              <div className="official-event-meta-row">
                <span>Cross-community</span>
                <strong>{event.seats}</strong>
              </div>

              <EventCardActionBar
                canManageOfficial={canManageOfficial}
                event={event}
                eventCount={officialEvents.length}
                eventIndex={eventIndex}
                onDelete={handleDelete}
                onEdit={loadForEdit}
                onView={() => props.onViewEvent(event)}
              />
            </article>
          ))}
        </div>
      )}

      {!canManageOfficial ? (
        <p className="protocol-hint">Official Nami events can only be created or edited by Nami officials.</p>
      ) : null}

      {isDemoSimulationEnabled() ? (
        <div className="event-demo-sim-actions">
          <button
            className="nami-surface-button"
            onClick={() => {
              const simulated = simulateLiveInterestedEventPopup();

              setNotice(
                simulated.length > 0
                  ? 'Live event popup simulated for ' +
                    simulated.map((event) => event.title).join(' and ') +
                    '.'
                  : 'Could not simulate the live event popup.'
              );
            }}
            type="button"
          >
            Simulate live event popup (demo)
          </button>
          <button
            className="profile-secondary-link"
            onClick={() => {
              const simulated = simulateStartingSoonInterestedEvent();

              setNotice(
                simulated
                  ? '"' +
                    simulated.title +
                    '" is starting soon — check event notifications in 30s sync.'
                  : 'Could not simulate the starting-soon reminder.'
              );
            }}
            type="button"
          >
            Simulate starting-soon reminder (demo)
          </button>
        </div>
      ) : null}
    </article>
  );
}