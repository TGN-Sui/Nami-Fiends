import { useEffect, useState, type ReactElement } from 'react';

import {
  readSelfProfileEdits,
  saveSelfProfileEdits,
  useSelfProfileEdits,
} from './member-profile-store.js';

export function MemberDailyStatusSettingsField(): ReactElement {
  const savedProfile = useSelfProfileEdits();
  const [draft, setDraft] = useState(savedProfile.dailyStatus);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setDraft(savedProfile.dailyStatus);
  }, [savedProfile.dailyStatus]);

  function saveStatus(): void {
    saveSelfProfileEdits({
      ...readSelfProfileEdits(),
      dailyStatus: draft.trim(),
    });
    setSavedNotice(true);
  }

  return (
    <article className="panel settings-card settings-compact-card member-daily-status-settings">
      <div className="profile-panel-heading">
        <h2>Daily Status</h2>
        <p>Short note shown on your profile showcase. Only you can edit this.</p>
      </div>

      <label className="profile-edit-field">
        <span>Status message</span>
        <textarea
          maxLength={160}
          onChange={(event) => {
            setDraft(event.target.value);
            setSavedNotice(false);
          }}
          placeholder="What are you playing, building, or looking for today?"
          rows={3}
          value={draft}
        />
      </label>

      <div className="member-daily-status-settings-actions">
        <button className="nami-surface-button is-primary-surface-button" onClick={saveStatus} type="button">
          Save status
        </button>
        {savedNotice ? <span className="member-daily-status-saved-note">Saved</span> : null}
      </div>
    </article>
  );
}

export function MemberDailyStatusQuickEdit(props: {
  onOpenSettings?: () => void;
}): ReactElement {
  const savedProfile = useSelfProfileEdits();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(savedProfile.dailyStatus);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setDraft(savedProfile.dailyStatus);
  }, [savedProfile.dailyStatus]);

  function saveStatus(): void {
    saveSelfProfileEdits({
      ...readSelfProfileEdits(),
      dailyStatus: draft.trim(),
    });
    setSavedNotice(true);
    setOpen(false);
  }

  return (
    <div className="member-daily-status-quick-edit">
      <button
        className="nami-surface-button member-daily-status-quick-button"
        onClick={() => {
          setOpen((value) => !value);
          setSavedNotice(false);
        }}
        type="button"
      >
        Update status
      </button>

      {open ? (
        <div className="member-daily-status-quick-popover panel">
          <label className="profile-edit-field">
            <span>Daily status</span>
            <textarea
              autoFocus
              maxLength={160}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Share what you're up to today."
              rows={3}
              value={draft}
            />
          </label>
          <div className="member-daily-status-quick-actions">
            <button className="nami-surface-button is-primary-surface-button" onClick={saveStatus} type="button">
              Save
            </button>
            {props.onOpenSettings ? (
              <button className="profile-secondary-link" onClick={props.onOpenSettings} type="button">
                Open Settings
              </button>
            ) : null}
            <button className="profile-secondary-link" onClick={() => setOpen(false)} type="button">
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {savedNotice ? <span className="member-daily-status-saved-note">Status updated</span> : null}
    </div>
  );
}