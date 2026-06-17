import type { ReactElement } from 'react';

import { fetchIdentityView } from './protocol.js';
import { ProtocolPanelShell } from './protocol-panel.js';
import { ProtocolQueryStatus, useProtocolQuery } from './protocol-query.js';

export function ProtocolIdentityPanel(): ReactElement {
  const { data: view, loadState, owner, context } = useProtocolQuery(
    'identity',
    fetchIdentityView
  );

  return (
    <ProtocolPanelShell
      context={context}
      description="On-chain Identity object read (read-only)."
      owner={owner}
      title="Identity Anchor"
    >
      <ProtocolQueryStatus
        errorMessage="Could not load identity."
        loadState={loadState}
        loadingMessage="Loading identity…"
      />

      {!view?.identity && loadState === 'ready' ? (
        <p className="protocol-hint">No owned Identity object found.</p>
      ) : null}

      {view?.identity ? (
        <div className="passport-wallet-grid passport-wallet-grid-refined">
          <span>Identity ID</span>
          <strong>{view.identity.objectId}</strong>
          <span>Trust Tier</span>
          <strong>{view.identity.trustTier}</strong>
          <span>Verification Level</span>
          <strong>{view.identity.verificationLevel}</strong>
          <span>Linked Passport</span>
          <strong>{view.identity.passportId ?? 'Not linked'}</strong>
        </div>
      ) : null}
    </ProtocolPanelShell>
  );
}