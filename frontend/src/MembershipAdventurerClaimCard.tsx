import type { ReactElement } from 'react';

import { claimAdventurerMembershipViaX } from './membership-plans-store.js';
import {
  authorizeXAccount,
  isXVerificationMockEnabled,
  unlinkXAccount,
  useXVerificationState,
} from './x-verification-store.js';

type MembershipAdventurerClaimCardProps = {
  onNotice: (message: string) => void;
  onError: (message: string) => void;
};

export function MembershipAdventurerClaimCard(props: MembershipAdventurerClaimCardProps): ReactElement {
  const xState = useXVerificationState();
  const xMockEnabled = isXVerificationMockEnabled();

  function handleAuthorizeX(): void {
    const result = authorizeXAccount();

    if (result.ok) {
      props.onNotice(result.message);
    } else {
      props.onError(result.reason);
    }
  }

  function handleClaimAdventurer(): void {
    const result = claimAdventurerMembershipViaX();

    if (result.ok) {
      props.onNotice(result.message);
    } else {
      props.onError(result.reason);
    }
  }

  function handleUnlinkX(): void {
    const result = unlinkXAccount();

    if (result.ok) {
      props.onNotice(result.message);
    } else {
      props.onError(result.reason);
    }
  }

  return (
    <article className="panel membership-adventurer-claim-card">
      <div className="membership-adventurer-claim-copy">
        <span className="mini-badge">Adventurer alt path</span>
        <h3>Claim with verified X.com</h3>
        <p>
          Adventurer is $3 USDC/month — or free when you link a verified X.com account through the
          official X authorization flow. Links must pass X account verification, not manual entry.
        </p>
      </div>

      <div className="membership-adventurer-claim-status">
        {xState.verified && xState.handle ? (
          <>
            <strong>@{xState.handle}</strong>
            <span>Verified via X authorization</span>
          </>
        ) : (
          <span>No verified X.com account linked yet</span>
        )}
      </div>

      <div className="membership-adventurer-claim-actions">
        {xState.verified ? (
          <>
            <button className="primary-action" onClick={handleClaimAdventurer} type="button">
              Claim Adventurer free
            </button>
            <button className="profile-secondary-link" onClick={handleUnlinkX} type="button">
              Unlink X.com
            </button>
          </>
        ) : xMockEnabled ? (
          <button className="primary-action" onClick={handleAuthorizeX} type="button">
            Authorize with X.com
          </button>
        ) : (
          <p className="protocol-hint">
            X.com OAuth authorization ships with the live receiving server. Use paid Adventurer checkout
            until then.
          </p>
        )}
      </div>
    </article>
  );
}