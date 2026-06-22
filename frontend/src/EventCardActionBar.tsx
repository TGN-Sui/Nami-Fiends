import { type ReactElement } from 'react';

import { EventInterestedButton } from './EventInterestedButton.js';
import {
  canManageChannelEvents,
  deleteChannelEvent,
  deleteOfficialEvent,
  moveChannelEvent,
  type StoredEvent,
} from './events-store.js';

type EventCardActionBarProps = {
  event: StoredEvent;
  onView: () => void;
  onEdit?: (event: StoredEvent) => void;
  onDelete?: (eventId: string) => void;
  eventIndex?: number;
  eventCount?: number;
  canManageOfficial?: boolean;
};

export function EventCardActionBar(props: EventCardActionBarProps): ReactElement {
  const isOfficial = props.event.source === 'official';
  const canManageChannel =
    !isOfficial && props.event.channelId ? canManageChannelEvents(props.event.channelId) : false;
  const canManageOfficial = isOfficial && props.canManageOfficial === true;
  const canManage = canManageOfficial || canManageChannel;
  const eventIndex = props.eventIndex ?? 0;
  const eventCount = props.eventCount ?? 1;
  const canMoveUp = canManageChannel && eventIndex > 0;
  const canMoveDown = canManageChannel && eventIndex < eventCount - 1;

  function handleDelete(): void {
    const confirmed = window.confirm(
      'Delete "' + props.event.title + '"? This cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    const deleted = isOfficial
      ? deleteOfficialEvent(props.event.id)
      : props.event.channelId
        ? deleteChannelEvent(props.event.channelId, props.event.id)
        : false;

    if (deleted) {
      props.onDelete?.(props.event.id);
    }
  }

  function handleMove(direction: 'up' | 'down'): void {
    if (!props.event.channelId) {
      return;
    }

    moveChannelEvent(props.event.channelId, props.event.id, direction);
  }

  if (isOfficial) {
    return (
      <div className="event-card-action-bar is-official-event-action-bar">
        <div className="event-card-action-slot event-card-action-slot-interested">
          <EventInterestedButton eventId={props.event.id} layout="inline" />
        </div>

        <button
          className="nami-surface-button event-card-action-slot event-card-action-slot-view"
          onClick={props.onView}
          type="button"
        >
          View Event
        </button>

        {canManageOfficial ? (
          <button
            className="nami-surface-button event-card-action-slot event-card-action-slot-edit"
            onClick={() => props.onEdit?.(props.event)}
            type="button"
          >
            Edit
          </button>
        ) : (
          <span aria-hidden="true" className="event-card-action-slot is-action-slot-spacer" />
        )}

        {canManageOfficial ? (
          <button
            className="nami-surface-button event-card-action-slot event-card-action-slot-delete"
            onClick={handleDelete}
            type="button"
          >
            Delete
          </button>
        ) : (
          <span aria-hidden="true" className="event-card-action-slot is-action-slot-spacer" />
        )}
      </div>
    );
  }

  return (
    <div className="event-card-action-bar is-channel-event-action-bar">
      <div className="event-card-action-slot event-card-action-slot-interested">
        <EventInterestedButton eventId={props.event.id} layout="inline" />
      </div>

      <button
        className="nami-surface-button event-card-action-slot event-card-action-slot-view"
        onClick={props.onView}
        type="button"
      >
        View Event
      </button>

      {canManageChannel ? (
        <button
          aria-label={'Move ' + props.event.title + ' up'}
          className="nami-surface-button event-card-action-slot event-card-action-slot-move"
          disabled={!canMoveUp}
          onClick={() => handleMove('up')}
          title="Move event up"
          type="button"
        >
          ↑
        </button>
      ) : (
        <span aria-hidden="true" className="event-card-action-slot is-action-slot-spacer" />
      )}

      {canManageChannel ? (
        <button
          aria-label={'Move ' + props.event.title + ' down'}
          className="nami-surface-button event-card-action-slot event-card-action-slot-move"
          disabled={!canMoveDown}
          onClick={() => handleMove('down')}
          title="Move event down"
          type="button"
        >
          ↓
        </button>
      ) : (
        <span aria-hidden="true" className="event-card-action-slot is-action-slot-spacer" />
      )}

      {canManageChannel ? (
        <button
          className="nami-surface-button event-card-action-slot event-card-action-slot-edit"
          onClick={() => props.onEdit?.(props.event)}
          type="button"
        >
          Edit
        </button>
      ) : (
        <span aria-hidden="true" className="event-card-action-slot is-action-slot-spacer" />
      )}

      {canManageChannel ? (
        <button
          className="nami-surface-button event-card-action-slot event-card-action-slot-delete"
          onClick={handleDelete}
          type="button"
        >
          Delete
        </button>
      ) : (
        <span aria-hidden="true" className="event-card-action-slot is-action-slot-spacer" />
      )}
    </div>
  );
}