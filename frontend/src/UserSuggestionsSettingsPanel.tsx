import { useMemo, useState, type ReactElement } from 'react';

import { getSelfMember } from './member-access.js';
import { readMemberSession } from './member-session-store.js';
import {
  listUserSuggestionsForSubmitter,
  submitUserSuggestion,
  useUserSuggestions,
} from './nami-user-suggestions-store.js';

function formatSubmittedAt(submittedAtMs: number): string {
  return new Date(submittedAtMs).toLocaleString();
}

export function UserSuggestionsSettingsPanel(): ReactElement {
  const suggestions = useUserSuggestions();
  const session = readMemberSession();
  const selfMember = getSelfMember();
  const submitterEmail = session?.email ?? '';

  const [body, setBody] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mySuggestions = useMemo(
    () => listUserSuggestionsForSubmitter(submitterEmail),
    [submitterEmail, suggestions],
  );

  function handleSubmit(): void {
    setNotice(null);
    setError(null);

    const result = submitUserSuggestion(body);

    if (!result.ok) {
      setError(result.reason);
      return;
    }

    setBody('');
    setNotice('Suggestion sent to Nami Officials. Thank you for helping shape Nami.');
  }

  return (
    <article className="panel settings-card settings-compact-card settings-section-wide user-suggestions-settings-panel">
      <div className="profile-panel-heading">
        <h2>Suggestions for Nami Officials</h2>
        <p>
          Share product ideas, UX feedback, or platform requests. Submissions go directly to the
          Nami Officials review queue.
        </p>
      </div>

      <label className="onboarding-field">
        <span>Your suggestion</span>
        <textarea
          onChange={(event) => setBody(event.target.value)}
          placeholder="Tell Nami Officials what would make the platform better for you..."
          rows={5}
          value={body}
        />
      </label>

      <p className="protocol-hint">
        Submitting as {selfMember.name}
        {submitterEmail ? ' · ' + submitterEmail : ''}.
      </p>

      <button
        className="nami-surface-button is-primary-surface-button"
        disabled={body.trim().length < 10}
        onClick={handleSubmit}
        type="button"
      >
        Send to Nami Officials
      </button>

      {notice ? <p className="channel-owner-tool-notice is-success">{notice}</p> : null}
      {error ? <p className="onboarding-field-error">{error}</p> : null}

      {mySuggestions.length > 0 ? (
        <div className="user-suggestions-history">
          <h3>Your recent submissions</h3>
          <ol className="user-suggestions-history-list">
            {mySuggestions.slice(0, 5).map((entry) => (
              <li className="user-suggestions-history-card" key={entry.id}>
                <p>{entry.body}</p>
                <span>
                  {formatSubmittedAt(entry.submittedAtMs)} · {entry.status}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </article>
  );
}