import { useEffect, useState, type ReactElement } from 'react';

import { isDemoWalletOnboardingEnabled } from './app-config.js';
import { recoverySettingsHint } from './onboarding-recovery.js';
import {
  isValidNodename,
  nodenameValidationMessage,
  normalizeNodename,
} from './onboarding-draft.js';
import {
  buildClaimNodename,
  FIEND_CLAIM_HANDLE_PREFIX,
  nodenameSuffixFromFull,
} from './member-public-chat.js';
import { useMemberSession } from './member-session-store.js';
import {
  submitNodenameClaim,
  useNamiAdminStore,
  type ClaimMethod,
} from './nami-admin-store.js';
import { PassportClaimFulfillmentCard } from './PassportClaimFulfillmentCard.js';
import { useProtocolOwner } from './wallet.js';

function resolveClaimMethod(
  source: 'wallet' | 'zklogin' | 'linked' | 'demo' | null,
  demoClaimEnabled: boolean
): ClaimMethod {
  if (source === 'zklogin') {
    return 'zklogin';
  }

  if (source === 'demo' && demoClaimEnabled) {
    return 'demo';
  }

  return 'wallet';
}

export function PassportClaimSettingsPanel(): ReactElement {
  const session = useMemberSession();
  const { owner, source } = useProtocolOwner();
  const { userClaimStatus } = useNamiAdminStore();

  const [preferredName, setPreferredName] = useState(() => session?.displayName ?? '');
  const [nodenameSuffix, setNodenameSuffix] = useState(() =>
    nodenameSuffixFromFull(userClaimStatus.nodename)
  );
  const claimNodename = buildClaimNodename(nodenameSuffix);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimNotice, setClaimNotice] = useState<string | null>(null);

  const nodenameError = nodenameValidationMessage(claimNodename);
  const demoClaimEnabled = isDemoWalletOnboardingEnabled();
  const claimPending = userClaimStatus.status === 'pending';
  const claimApproved = userClaimStatus.status === 'approved';
  const claimRejected = userClaimStatus.status === 'rejected';
  const preferredNameValid = preferredName.trim().length >= 2;

  useEffect(() => {
    if (userClaimStatus.nodename) {
      setNodenameSuffix(nodenameSuffixFromFull(userClaimStatus.nodename));
    }
  }, [userClaimStatus.nodename]);

  useEffect(() => {
    if (session?.displayName && !preferredName.trim()) {
      setPreferredName(session.displayName);
    }
  }, [preferredName, session?.displayName]);

  function handleSubmitClaim(): void {
    setClaimError(null);
    setClaimNotice(null);

    if (!session) {
      setClaimError('Complete signup with display name and email before claiming your passport.');
      return;
    }

    if (!preferredNameValid) {
      setClaimError('Enter a preferred name (at least 2 characters).');
      return;
    }

    if (!isValidNodename(claimNodename)) {
      setClaimError(nodenameError ?? 'Choose a valid nodename handle.');
      return;
    }

    if (claimPending || claimApproved) {
      return;
    }

    submitNodenameClaim({
      email: session.email,
      displayName: session.displayName,
      preferredName: preferredName.trim(),
      nodename: normalizeNodename(claimNodename),
      archetype: session.archetype,
      archetypeLabel: session.archetypeLabel,
      flavorBadgeId: session.flavorBadgeId,
      submitterAddress: owner,
      method: resolveClaimMethod(source, demoClaimEnabled),
    });

    setClaimNotice(
      'Passport claim submitted. A Nami Official will review your preferred name and handle.'
    );
  }

  return (
    <article className="panel settings-card passport-claim-settings-card">
      <div className="profile-panel-heading">
        <h2>Passport Claim</h2>
        <p>
          Set your preferred name and @fiend handle, then submit one ticket for review. Approval
          automatically queues SuiNS subname provisioning — no manual SuiNS console step.
        </p>
      </div>

      {!session ? (
        <p className="settings-account-hint">
          Finish Enter Nami signup first so your email is on file for claim review.
        </p>
      ) : null}

      <div className="passport-claim-status-strip">
        <div>
          <span>Claim status</span>
          <strong className={'passport-claim-status-' + userClaimStatus.status}>
            {claimPending
              ? 'Pending review'
              : claimApproved
                ? 'Approved'
                : claimRejected
                  ? 'Rejected'
                  : 'Not submitted'}
          </strong>
        </div>
        {owner ? (
          <div>
            <span>Connected wallet</span>
            <strong>{owner.slice(0, 10)}…{owner.slice(-6)}</strong>
          </div>
        ) : null}
      </div>

      <label className="onboarding-field">
        <span>Preferred name</span>
        <input
          disabled={claimPending || claimApproved}
          maxLength={32}
          onChange={(event) => setPreferredName(event.target.value)}
          placeholder="How you want to appear on your passport"
          type="text"
          value={preferredName}
        />
        <small className="protocol-hint">
          Shown on your passport card and owner review ticket. You can change display copy later;
          this is what officials approve.
        </small>
      </label>

      <label className="onboarding-field passport-claim-handle-field">
        <span>Nodename handle</span>
        <div className="passport-claim-handle-input-row">
          <span aria-hidden="true" className="passport-claim-handle-prefix">
            @{FIEND_CLAIM_HANDLE_PREFIX}
          </span>
          <input
            aria-label="Nodename suffix after @fiend"
            disabled={claimPending || claimApproved}
            maxLength={19}
            onChange={(event) => setNodenameSuffix(event.target.value)}
            placeholder="your_handle"
            type="text"
            value={nodenameSuffix}
          />
        </div>
        {nodenameError && nodenameSuffix.trim() !== '' ? (
          <small className="onboarding-field-error">{nodenameError}</small>
        ) : (
          <small className="protocol-hint">
            Permanent @fiend handle. SuiNS subname provisioning runs automatically after approval.
          </small>
        )}
      </label>

      {session ? (
        <div className="passport-claim-member-summary">
          <span>{session.email}</span>
          <span>
            {session.archetypeLabel} · {session.flavorBadgeId}
          </span>
        </div>
      ) : null}

      {claimError ? <p className="onboarding-field-error">{claimError}</p> : null}
      {claimNotice ? <p className="protocol-hint">{claimNotice}</p> : null}
      <p className="protocol-hint">{recoverySettingsHint()}</p>

      {claimApproved ? <PassportClaimFulfillmentCard /> : null}

      {claimRejected ? (
        <p className="protocol-hint">
          Your claim was not approved. Adjust your preferred name or handle and submit again.
        </p>
      ) : null}

      <button
        className="onboarding-primary-btn passport-claim-submit-btn"
        disabled={
          !session ||
          claimPending ||
          claimApproved ||
          !preferredNameValid ||
          !isValidNodename(claimNodename)
        }
        onClick={handleSubmitClaim}
        type="button"
      >
        {claimPending ? 'Pending review' : claimApproved ? 'Approved' : 'Submit passport claim'}
      </button>
    </article>
  );
}