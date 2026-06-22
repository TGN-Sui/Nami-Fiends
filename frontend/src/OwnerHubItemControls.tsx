import { type ReactElement } from 'react';

export function OwnerHubItemControls(props: {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  removeLabel?: string;
}): ReactElement {
  return (
    <div
      className="owner-hub-item-controls"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      role="group"
    >
      <button
        aria-label="Move up"
        className="nami-surface-button owner-hub-move-button"
        disabled={!props.canMoveUp}
        onClick={props.onMoveUp}
        title="Move up"
        type="button"
      >
        ↑
      </button>
      <button
        aria-label="Move down"
        className="nami-surface-button owner-hub-move-button"
        disabled={!props.canMoveDown}
        onClick={props.onMoveDown}
        title="Move down"
        type="button"
      >
        ↓
      </button>
      <button
        className="profile-secondary-link owner-hub-remove-button"
        onClick={props.onRemove}
        type="button"
      >
        {props.removeLabel ?? 'Remove'}
      </button>
    </div>
  );
}