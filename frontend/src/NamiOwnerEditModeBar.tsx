import { type ReactElement } from 'react';

import {
  discardOwnerAssetDrafts,
  returnToOwnerDashboard,
  saveOwnerAssetDrafts,
  useNamiOwnerEditMode,
} from './nami-owner-edit-mode-store.js';
import { useProtocolOwner } from './wallet.js';

export function NamiOwnerEditModeBar(props: {
  onReturnToDashboard: () => void;
}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const editMode = useNamiOwnerEditMode();

  if (!editMode.active) {
    return null;
  }

  function handleReturn(): void {
    if (editMode.dirty) {
      const shouldLeave = window.confirm('Discard unsaved artwork changes and return to Owner Dashboard?');

      if (!shouldLeave) {
        return;
      }

      discardOwnerAssetDrafts();
    }

    returnToOwnerDashboard();
    props.onReturnToDashboard();
  }

  function handleSave(): void {
    void saveOwnerAssetDrafts(owner);
  }

  return (
    <div className="nami-owner-edit-mode-bar" role="region" aria-label="Owner visual edit mode">
      <div className="nami-owner-edit-mode-copy">
        <strong>Owner Edit Mode</strong>
        <span>Click any highlighted image placeholder to upload artwork.</span>
      </div>

      <div className="nami-owner-edit-mode-actions">
        {editMode.notice ? <p className="nami-owner-edit-mode-notice">{editMode.notice}</p> : null}
        {editMode.error ? <p className="nami-owner-edit-mode-error">{editMode.error}</p> : null}
        <button
          className="profile-secondary-link"
          disabled={!editMode.dirty}
          onClick={discardOwnerAssetDrafts}
          type="button"
        >
          Revert changes
        </button>
        <button className="onboarding-primary-btn" disabled={!editMode.dirty} onClick={handleSave} type="button">
          Save artwork
        </button>
        <button className="nami-surface-button" onClick={handleReturn} type="button">
          Back to Owner Dashboard
        </button>
      </div>
    </div>
  );
}