import type { ReactElement } from 'react';

import type { GameOnboardingDraft } from './game-onboarding-draft.js';
import {
  computeGameTrustScoreFromDraft,
  GAME_PREAPPROVAL_THRESHOLD,
  type GameTrustScoreBreakdown,
} from './game-trust-score.js';
import { useProtocolOwner } from './wallet.js';

type GameTrustScorePanelProps = {
  draft: GameOnboardingDraft;
  breakdown?: GameTrustScoreBreakdown;
  compact?: boolean;
  showSuggestions?: boolean;
};

export function GameTrustScorePanel(props: GameTrustScorePanelProps): ReactElement {
  const { owner, source } = useProtocolOwner();

  const breakdown =
    props.breakdown ??
    computeGameTrustScoreFromDraft({
      gameTitle: props.draft.gameTitle,
      studioName: props.draft.studioName,
      contactName: props.draft.contactName,
      email: props.draft.email,
      emailVerified: props.draft.emailVerified,
      phone: props.draft.phone,
      phoneVerified: props.draft.phoneVerified,
      websiteUrl: props.draft.websiteUrl,
      storePageUrl: props.draft.storePageUrl,
      trailerUrl: props.draft.trailerUrl,
      officialSocialPlatform: props.draft.officialSocialPlatform,
      officialSocialHandle: props.draft.officialSocialHandle,
      officialSocialVerified: props.draft.officialSocialVerified,
      walletLinked: props.draft.walletLinked || owner !== null,
      walletSource: props.draft.walletLinked ? (source ?? 'demo') : source,
    });

  return (
    <article
      className={
        'game-trust-score-panel panel' +
        (props.compact ? ' is-compact-game-trust-score' : '') +
        ' is-tier-' +
        breakdown.tier
      }
    >
      <div className="game-trust-score-header">
        <div>
          <p className="game-trust-score-eyebrow">Trust Score</p>
          <h3>{breakdown.total}</h3>
        </div>
        <span className={'game-trust-score-tier-chip is-' + breakdown.tier}>{breakdown.tierLabel}</span>
      </div>

      <p className="protocol-hint game-trust-score-summary">
        Higher scores move your ticket higher on the Nami Officials review list. {GAME_PREAPPROVAL_THRESHOLD}%
        or higher unlocks pre-approval and the studio questionnaire.
      </p>

      {breakdown.preapprovalEligible ? (
        <p className="game-trust-score-preapproval-note">Pre-approval eligible at {breakdown.total}%.</p>
      ) : (
        <p className="game-trust-score-preapproval-note is-below-threshold">
          Need {GAME_PREAPPROVAL_THRESHOLD}% for pre-approval. Current score: {breakdown.total}%.
        </p>
      )}

      <div className="game-trust-score-category-grid">
        {breakdown.categories.map((category) => (
          <div className="game-trust-score-category" key={category.id}>
            <span>{category.label}</span>
            <strong>
              {category.points}/{category.maxPoints}
            </strong>
          </div>
        ))}
      </div>

      {props.showSuggestions && breakdown.suggestions.length > 0 ? (
        <ul className="game-trust-score-suggestions">
          {breakdown.suggestions.map((suggestion) => (
            <li key={suggestion}>{suggestion}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}