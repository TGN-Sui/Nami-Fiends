import { useState, type ReactElement } from 'react';

import { replayTutorialFromSettings } from './tutorial-queue.js';

export function TutorialReplaySettingsCard(props: {
  owner: string | null;
  onNavigateHub?: () => void;
}): ReactElement | null {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!props.owner?.startsWith('0x')) {
    return null;
  }

  async function handleReplay(): Promise<void> {
    setBusy(true);
    setError('');

    try {
      await replayTutorialFromSettings(props.owner!, props.onNavigateHub);
    } catch {
      setError('Could not restart the tour. Confirm your wallet signature and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="panel settings-card settings-compact-card settings-section-wide">
      <div className="profile-panel-heading">
        <span className="mini-badge">Realm guide</span>
        <h2>Replay tutorial</h2>
        <p>
          Walk through the 4-step Nami Hub tour again. Super banners are skipped during replay so you
          land straight in the guide.
        </p>
      </div>
      <button
        className="nami-surface-button is-primary-surface-button"
        disabled={busy}
        onClick={() => void handleReplay()}
        type="button"
      >
        {busy ? 'Starting…' : 'Replay realm guide'}
      </button>
      {error ? <p className="channel-owner-tool-notice is-error">{error}</p> : null}
    </article>
  );
}