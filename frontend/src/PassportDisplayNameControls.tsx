import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';

import {
  checkDisplayNameAvailability,
  resolveMemberDisplayName,
  saveMemberDisplayName,
  useDisplayNameChangeEligibility,
  useMemberDisplayNameHistory,
  type DisplayNameHistoryEntry,
} from './member-display-name-store.js';
import { isSelfMember } from './surface-preferences.js';
import type { NamiMember } from './uiMockData.js';

function formatHistoryDate(changedAtMs: number): string {
  return new Date(changedAtMs).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function PassportDisplayNameEditor(props: {
  member: NamiMember;
  fallbackName: string;
}): ReactElement | null {
  const isSelf = isSelfMember(props.member.id);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayName = resolveMemberDisplayName(props.member.id, props.fallbackName);
  const changeEligibility = useDisplayNameChangeEligibility(props.member.id, props.member);

  const availability = useMemo(() => {
    if (!editing || !draftName.trim()) {
      return null;
    }

    return checkDisplayNameAvailability(draftName, props.member.id);
  }, [draftName, editing, props.member.id]);

  useEffect(() => {
    if (!editing) {
      setDraftName(displayName);
    }
  }, [displayName, editing]);

  if (!isSelf) {
    return <h2 className="passport-display-name-heading">{displayName}</h2>;
  }

  function stopCardActivation(event: MouseEvent | KeyboardEvent): void {
    event.stopPropagation();
  }

  function beginEdit(): void {
    if (!changeEligibility.allowed) {
      setError(changeEligibility.reason);
      setNotice(null);
      return;
    }

    setDraftName(displayName);
    setEditing(true);
    setNotice(null);
    setError(null);
  }

  function cancelEdit(): void {
    setEditing(false);
    setDraftName(displayName);
    setError(null);
    setNotice(null);
  }

  function handleSave(): void {
    const result = saveMemberDisplayName(draftName, props.member.id);

    if (!result.ok) {
      setError(result.message);
      setNotice(null);
      return;
    }

    setEditing(false);
    setError(null);
    setNotice(result.message);
  }

  if (!editing) {
    return (
      <div className="passport-display-name-editor" onClick={stopCardActivation} onKeyDown={stopCardActivation}>
        <h2 className="passport-display-name-heading">{displayName}</h2>
        {changeEligibility.allowed ? (
          <button className="nami-surface-button passport-display-name-edit-button" onClick={beginEdit} type="button">
            Edit name
          </button>
        ) : (
          <p className="protocol-hint passport-display-name-cooldown">{changeEligibility.reason}</p>
        )}
        {notice ? <p className="protocol-hint passport-display-name-notice">{notice}</p> : null}
        {error && !editing ? <p className="onboarding-field-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="passport-display-name-editor is-editing" onClick={stopCardActivation} onKeyDown={stopCardActivation}>
      <label className="passport-display-name-field">
        <span>Passport display name</span>
        <input
          autoFocus
          maxLength={32}
          onChange={(event) => {
            setDraftName(event.target.value);
            setError(null);
            setNotice(null);
          }}
          type="text"
          value={draftName}
        />
      </label>
      {availability ? (
        <p
          className={
            availability.available ? 'protocol-hint passport-display-name-availability' : 'onboarding-field-error'
          }
        >
          {availability.available ? 'Name is available.' : availability.reason}
        </p>
      ) : null}
      <div className="passport-display-name-editor-actions">
        <button
          className="onboarding-primary-btn"
          disabled={!availability?.available}
          onClick={handleSave}
          type="button"
        >
          Save
        </button>
        <button className="profile-secondary-link" onClick={cancelEdit} type="button">
          Cancel
        </button>
      </div>
      {error ? <p className="onboarding-field-error">{error}</p> : null}
    </div>
  );
}

function PassportNameHistoryPopout(props: {
  member: NamiMember;
  history: DisplayNameHistoryEntry[];
  currentName: string;
  onClose: () => void;
}): ReactElement {
  const close = useCallback((): void => {
    props.onClose();
  }, [props.onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: globalThis.KeyboardEvent): void {
      if (event.key === 'Escape') {
        close();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [close]);

  return createPortal(
    <div
      aria-labelledby={'passport-name-history-title-' + props.member.id}
      aria-modal={true}
      className="passport-name-history-popout-host"
      role="dialog"
    >
      <button
        aria-label="Close name history"
        className="passport-name-history-popout-backdrop"
        onClick={close}
        type="button"
      />

      <article className="passport-name-history-popout panel">
        <div className="passport-name-history-popout-header">
          <div className="passport-name-history-panel-heading">
            <strong id={'passport-name-history-title-' + props.member.id}>
              {props.member.name} name history
            </strong>
            <span>Previous passport display names</span>
          </div>
          <button
            aria-label="Close name history"
            className="nami-surface-button passport-name-history-popout-close"
            onClick={close}
            type="button"
          >
            Close
          </button>
        </div>

        {props.history.length > 0 ? (
          <ol className="passport-name-history-list">
            {props.history.map((entry, index) => {
              const isCurrent = index === 0 && normalizeNamesEqual(entry.name, props.currentName);

              return (
                <li className="passport-name-history-row" key={entry.name + '-' + entry.changedAtMs}>
                  <span className="passport-name-history-value">
                    {entry.name}
                    {isCurrent ? <em className="passport-name-history-current">Current</em> : null}
                  </span>
                  <time dateTime={new Date(entry.changedAtMs).toISOString()}>
                    {formatHistoryDate(entry.changedAtMs)}
                  </time>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="protocol-hint">No previous display names recorded.</p>
        )}
      </article>
    </div>,
    document.body
  );
}

export function PassportNameHistoryButton(props: {
  member: NamiMember;
  fallbackName: string;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const history = useMemberDisplayNameHistory(props.member.id, props.fallbackName);
  const currentName = resolveMemberDisplayName(props.member.id, props.fallbackName);

  function stopCardActivation(event: MouseEvent | KeyboardEvent): void {
    event.stopPropagation();
  }

  return (
    <div className="passport-name-history-controls" onClick={stopCardActivation} onKeyDown={stopCardActivation}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="nami-surface-button passport-name-history-button"
        onClick={() => setOpen(true)}
        type="button"
      >
        Name history
      </button>

      {open ? (
        <PassportNameHistoryPopout
          currentName={currentName}
          history={history}
          member={props.member}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function normalizeNamesEqual(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}