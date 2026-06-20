import { useState, type ReactElement } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';
import { saveOwnerPassportLabels, useOwnerPassportLabels } from './owner-passport-labels-store.js';
import { useProtocolOwner } from './wallet.js';

export function OwnerPassportLabelsPanel(): ReactElement | null {
  const { owner } = useProtocolOwner();
  const labels = useOwnerPassportLabels();
  const [primaryLabel, setPrimaryLabel] = useState(labels.primaryLabel);
  const [secondaryLabel, setSecondaryLabel] = useState(labels.secondaryLabel);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOfficialOwner(owner)) {
    return null;
  }

  function handleSave(): void {
    const saved = saveOwnerPassportLabels({
      primaryLabel,
      secondaryLabel,
    });

    setPrimaryLabel(saved.primaryLabel);
    setSecondaryLabel(saved.secondaryLabel);
    setNotice('Nami Passport labels updated.');
  }

  function handleReset(): void {
    setPrimaryLabel('Nami CEO');
    setSecondaryLabel('Nami Fiend');
    saveOwnerPassportLabels({
      primaryLabel: 'Nami CEO',
      secondaryLabel: 'Nami Fiend',
    });
    setNotice('Restored default owner passport labels.');
  }

  return (
    <article className="panel settings-card settings-compact-card settings-section-wide nami-owner-passport-labels">
      <div className="profile-panel-heading">
        <span className="mini-badge">Owner Passport</span>
        <h2>Nami Passport Labels</h2>
        <p>
          Your official owner passport uses editable Nami labels instead of player scores, ranks, or
          membership tiers.
        </p>
      </div>

      <div className="nami-owner-passport-labels-form">
        <label className="onboarding-field">
          <span>Primary label</span>
          <input
            onChange={(event) => setPrimaryLabel(event.target.value)}
            placeholder="Nami CEO"
            type="text"
            value={primaryLabel}
          />
        </label>
        <label className="onboarding-field">
          <span>Secondary label</span>
          <input
            onChange={(event) => setSecondaryLabel(event.target.value)}
            placeholder="Nami Fiend"
            type="text"
            value={secondaryLabel}
          />
        </label>
      </div>

      <div className="nami-owner-passport-labels-preview">
        <span className="mini-badge">{primaryLabel.trim() || 'Nami CEO'}</span>
        <strong>{secondaryLabel.trim() || 'Nami Fiend'}</strong>
        <p>Shown on your passport card and profile. Not tied to reputation or membership.</p>
      </div>

      <div className="nami-owner-passport-labels-actions">
        <button className="onboarding-primary-btn" onClick={handleSave} type="button">
          Save labels
        </button>
        <button className="profile-secondary-link" onClick={handleReset} type="button">
          Reset defaults
        </button>
      </div>

      {notice ? <p className="protocol-hint nami-owner-action-notice">{notice}</p> : null}
    </article>
  );
}