import { useEffect, useState, type ReactElement } from 'react';

import { isDemoSimulationEnabled } from './app-config.js';
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
import { getOnboardingMethodLabel, type OnboardingMethod } from './onboarding.js';
import { useMemberSession } from './member-session-store.js';
import {
  submitNodenameClaim,
  useNamiAdminStore,
  type ClaimMethod,
} from './nami-admin-store.js';
import { useProtocolOwner, WalletConnectControl, ZkLoginConnectControl } from './wallet.js';
import { zkLoginStatusMessage } from './zklogin.js';

export function PassportClaimSettingsPanel(): ReactElement {
  const session = useMemberSession();
  const { owner, source } = useProtocolOwner();
  const { userClaimStatus } = useNamiAdminStore();

  const [method, setMethod] = useState<OnboardingMethod>('zklogin');
  const [nodenameSuffix, setNodenameSuffix] = useState(() =>
    nodenameSuffixFromFull(userClaimStatus.nodename)
  );
  const claimNodename = buildClaimNodename(nodenameSuffix);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimNotice, setClaimNotice] = useState<string | null>(null);

  const nodenameError = nodenameValidationMessage(claimNodename);
  const demoClaimEnabled = isDemoSimulationEnabled();
  const claimPending = userClaimStatus.status === 'pending';
  const claimApproved = userClaimStatus.status === 'approved';
  const claimRejected = userClaimStatus.status === 'rejected';

  useEffect(() => {
    if (userClaimStatus.nodename) {
      setNodenameSuffix(nodenameSuffixFromFull(userClaimStatus.nodename));
    }
  }, [userClaimStatus.nodename]);

  useEffect(() => {
    if (!demoClaimEnabled && method === 'demo') {
      setMethod('zklogin');
    }
  }, [demoClaimEnabled, method]);

  useEffect(() => {
    if (source === 'wallet') {
      setMethod('wallet');
    } else if (source === 'zklogin') {
      setMethod('zklogin');
    } else if (source === 'demo' && demoClaimEnabled) {
      setMethod('demo');
    }
  }, [demoClaimEnabled, source]);

  function resolveClaimMethod(): ClaimMethod {
    if (method === 'zklogin') {
      return 'zklogin';
    }

    if (method === 'demo') {
      return 'demo';
    }

    return 'wallet';
  }

  function handleSubmitClaim(): void {
    setClaimError(null);
    setClaimNotice(null);

    if (!session) {
      setClaimError('Complete signup with display name and email before claiming a nodename.');
      return;
    }

    if (!isValidNodename(claimNodename)) {
      setClaimError(nodenameError ?? 'Choose a valid nodename.');
      return;
    }

    if (claimPending) {
      return;
    }

    submitNodenameClaim({
      email: session.email,
      displayName: session.displayName,
      nodename: normalizeNodename(claimNodename),
      archetype: session.archetype,
      archetypeLabel: session.archetypeLabel,
      flavorBadgeId: session.flavorBadgeId,
      submitterAddress: owner,
      method: resolveClaimMethod(),
    });

    setClaimNotice(
      'Claim submitted for Nami Official review. You will be notified when your nodename is approved.'
    );
  }

  return (
    <article className="panel settings-card passport-claim-settings-card">
      <div className="profile-panel-heading">
        <h2>Passport Claim</h2>
        <p>
          Choose your permanent @fiend nodename and submit for Nami Official approval. zkLogin is
          the default identity path — wallet signing follows once enter_nami is deployed.
        </p>
      </div>

      {!session ? (
        <p className="settings-account-hint">
          Finish Enter Nami signup first so your email and display name are on file for claim review.
        </p>
      ) : null}

      <div className="method-toggle passport-claim-method-toggle" aria-label="Claim method">
        <button
          className={method === 'zklogin' ? 'active' : ''}
          onClick={() => setMethod('zklogin')}
          type="button"
        >
          zkLogin
        </button>
        <button
          className={method === 'wallet' ? 'active' : ''}
          onClick={() => setMethod('wallet')}
          type="button"
        >
          Wallet
        </button>
        {demoClaimEnabled ? (
          <button
            className={method === 'demo' ? 'active' : ''}
            onClick={() => setMethod('demo')}
            type="button"
          >
            Demo
          </button>
        ) : null}
      </div>

      <div className="passport-claim-status-strip">
        <div>
          <span>Method</span>
          <strong>{getOnboardingMethodLabel(method)}</strong>
        </div>
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
      </div>

      {method === 'wallet' ? (
        <div className="onboarding-wallet-connect">
          <WalletConnectControl />
        </div>
      ) : null}

      {method === 'zklogin' ? (
        <div className="onboarding-zklogin-block">
          <p className="protocol-hint">{zkLoginStatusMessage()}</p>
          <ZkLoginConnectControl />
        </div>
      ) : null}

      <label className="onboarding-field passport-claim-handle-field">
        <span>Nodename</span>
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
            @{FIEND_CLAIM_HANDLE_PREFIX} is reserved for every claim. Add your unique suffix after it.
          </small>
        )}
      </label>

      {session ? (
        <div className="passport-claim-member-summary">
          <span>{session.displayName}</span>
          <span>{session.email}</span>
          <span>
            {session.archetypeLabel} · {session.flavorBadgeId}
          </span>
        </div>
      ) : null}

      {claimError ? <p className="onboarding-field-error">{claimError}</p> : null}
      {claimNotice ? <p className="protocol-hint">{claimNotice}</p> : null}
      {claimApproved ? (
        <p className="protocol-hint passport-claim-approved-note">
          Your nodename claim was approved. On-chain minting will attach once enter_nami is live.
        </p>
      ) : null}

      <button
        className="onboarding-primary-btn passport-claim-submit-btn"
        disabled={
          !session ||
          claimPending ||
          claimApproved ||
          !isValidNodename(claimNodename)
        }
        onClick={handleSubmitClaim}
        type="button"
      >
        {claimPending ? 'Pending' : claimApproved ? 'Approved' : 'Submit claim for review'}
      </button>
    </article>
  );
}