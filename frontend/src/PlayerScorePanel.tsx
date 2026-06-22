import type { ReactElement } from 'react';

import type { OnboardingDraft } from './onboarding-draft.js';
import { computePlayerScoreFromDraft, type PlayerScoreBreakdown } from './player-score.js';
import { usePlayerScoreSnapshot } from './use-player-score.js';

type PlayerScorePanelProps = {
  draft?: OnboardingDraft;
  breakdown?: PlayerScoreBreakdown | null;
  issuedScore?: number | null;
  compact?: boolean;
  showSuggestions?: boolean;
};

export function PlayerScorePanel(props: PlayerScorePanelProps): ReactElement {
  const liveScore = usePlayerScoreSnapshot();

  const breakdown =
    props.breakdown ??
    (props.draft
      ? computePlayerScoreFromDraft({
          displayName: props.draft.displayName,
          email: props.draft.email,
          quizAnswers: props.draft.quizAnswers,
          socialXVerified: props.draft.socialXVerified,
          socialTwitchVerified: props.draft.socialTwitchVerified,
          optionalPlatformLinks: props.draft.optionalPlatformLinks,
        })
      : liveScore);

  if (!breakdown) {
    return (
      <article className="player-score-panel panel">
        <p className="protocol-hint">Complete signup to receive your Player Score.</p>
      </article>
    );
  }

  return (
    <article
      className={
        'player-score-panel panel' +
        (props.compact ? ' is-compact-player-score' : '') +
        ' is-tier-' +
        breakdown.tier
      }
    >
      <div className="player-score-header">
        <div>
          <p className="player-score-eyebrow">Player Score</p>
          <h3>{breakdown.total}</h3>
        </div>
        <span className={'player-score-tier-chip is-' + breakdown.tier}>{breakdown.tierLabel}</span>
      </div>

      <p className="protocol-hint player-score-summary">
        Proves you are a real gamer. Link socials and game platforms in Settings to raise your score.
      </p>

      {typeof props.issuedScore === 'number' ? (
        <p className="protocol-hint player-score-issued-copy">
          Issued at passport signup: {props.issuedScore}. Current score updates as you add proofs.
        </p>
      ) : null}

      <div className="player-score-category-grid">
        {breakdown.categories.map((category) => {
          const width = Math.max(8, (category.points / category.maxPoints) * 100);

          return (
            <div className="player-score-category-row" key={category.id}>
              <div className="player-score-category-copy">
                <strong>{category.label}</strong>
                <span>
                  {category.points}/{category.maxPoints}
                </span>
              </div>
              <div className="player-score-category-track" aria-hidden="true">
                <span className="player-score-category-fill" style={{ width: width + '%' }} />
              </div>
            </div>
          );
        })}
      </div>

      {props.showSuggestions !== false && breakdown.suggestions.length > 0 ? (
        <ul className="player-score-suggestions">
          {breakdown.suggestions.map((suggestion) => (
            <li key={suggestion}>{suggestion}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}