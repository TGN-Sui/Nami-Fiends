import type { ReactElement } from 'react';

import { fetchConductView } from './protocol.js';
import { ProtocolPanelShell } from './protocol-panel.js';
import { ProtocolQueryStatus, useProtocolQuery } from './protocol-query.js';

export function ProtocolConductPanel(): ReactElement {
  const { data: view, loadState, owner, context } = useProtocolQuery(
    'conduct',
    fetchConductView
  );

  return (
    <ProtocolPanelShell
      context={context}
      description="On-chain ConductStatus read (read-only)."
      owner={owner}
      title="Conduct Signal"
    >
      <ProtocolQueryStatus
        errorMessage="Could not load conduct status."
        loadState={loadState}
        loadingMessage="Loading conduct status…"
      />

      {!view?.conduct && loadState === 'ready' ? (
        <p className="protocol-hint">No owned ConductStatus object found.</p>
      ) : null}

      {view?.conduct ? (
        <div className="passport-wallet-grid passport-wallet-grid-refined">
          <span>Signal</span>
          <strong>{view.conduct.signalLabel}</strong>
          <span>Passport</span>
          <strong>{view.conduct.passportId.slice(0, 12)}…</strong>
          <span>Reason Code</span>
          <strong>{view.conduct.reasonCode}</strong>
          <span>Expires</span>
          <strong>
            {view.conduct.expiresAtMs > 0 ? view.conduct.expiresAtMs : 'No active expiry'}
          </strong>
        </div>
      ) : null}
    </ProtocolPanelShell>
  );
}