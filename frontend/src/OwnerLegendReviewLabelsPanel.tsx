import { useState, type ReactElement } from 'react';

import { LegendReviewMeter } from './LegendReviewMeter.js';
import { isOfficialOwner } from './nami-capabilities.js';
import {
  readOwnerLegendReviewLabels,
  saveOwnerLegendReviewLabels,
  useOwnerLegendReviewLabels,
} from './owner-legend-review-labels-store.js';
import { useProtocolOwner } from './wallet.js';

const TIER_FIELDS = [
  { key: 'tier1' as const, rating: 1, hint: 'Lowest recommendation' },
  { key: 'tier2' as const, rating: 2, hint: 'Below average' },
  { key: 'tier3' as const, rating: 3, hint: 'Middle tier' },
  { key: 'tier4' as const, rating: 4, hint: 'Strong recommendation' },
  { key: 'tier5' as const, rating: 5, hint: 'Top tier / foil bar' },
];

export function OwnerLegendReviewLabelsPanel(props: { embedded?: boolean } = {}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const savedLabels = useOwnerLegendReviewLabels();
  const [draft, setDraft] = useState(() => readOwnerLegendReviewLabels());
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOfficialOwner(owner)) {
    return null;
  }

  function updateTier(key: keyof typeof draft, value: string): void {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSave(): void {
    const next = saveOwnerLegendReviewLabels({
      tier1: draft.tier1,
      tier2: draft.tier2,
      tier3: draft.tier3,
      tier4: draft.tier4,
      tier5: draft.tier5,
    });

    setDraft(next);
    setNotice('Legend review tier labels updated across community reviews.');
  }

  function handleReset(): void {
    const defaults = saveOwnerLegendReviewLabels({
      tier1: 'Skip',
      tier2: 'Mixed',
      tier3: 'Solid',
      tier4: 'Standout',
      tier5: 'Legend',
    });

    setDraft(defaults);
    setNotice('Restored default Legend review tier labels.');
  }

  return (
    <article
      className={
        'panel settings-card settings-compact-card settings-section-wide nami-owner-legend-review-labels' +
        (props.embedded ? ' nami-owner-advanced-embedded-panel' : '')
      }
    >
      <div className="profile-panel-heading">
        <span className="mini-badge">Community Reviews</span>
        <h2>Legend review tiers</h2>
        <p>
          Rename the five horizontal Legend meter labels used on game channel review walls and member
          profile activity rows.
        </p>
      </div>

      <div className="nami-owner-legend-review-labels-form">
        {TIER_FIELDS.map((field) => (
          <label className="onboarding-field" key={field.key}>
            <span>
              Tier {field.rating} · {field.hint}
            </span>
            <input
              maxLength={24}
              onChange={(event) => updateTier(field.key, event.target.value)}
              placeholder={savedLabels[field.key]}
              type="text"
              value={draft[field.key]}
            />
          </label>
        ))}
      </div>

      <div className="nami-owner-legend-review-labels-preview">
        <p>Preview</p>
        <LegendReviewMeter value={4} />
        <LegendReviewMeter value={5} />
      </div>

      <div className="nami-owner-legend-review-labels-actions">
        <button className="onboarding-primary-btn" onClick={handleSave} type="button">
          Save tier labels
        </button>
        <button className="profile-secondary-link" onClick={handleReset} type="button">
          Reset defaults
        </button>
      </div>

      {notice ? <p className="protocol-hint nami-owner-action-notice">{notice}</p> : null}
    </article>
  );
}