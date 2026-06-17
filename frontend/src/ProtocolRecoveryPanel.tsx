import type { ReactElement } from 'react';

import { fetchOpenRecoveryRequests } from './protocol.js';
import { ProtocolPanelShell } from './protocol-panel.js';
import { ProtocolQueryStatus, useProtocolIndexerQuery } from './protocol-query.js';
import { useProtocolOwner } from './wallet.js';

export function ProtocolRecoveryPanel(): ReactElement {
  const { owner } = useProtocolOwner();
  const { data: requests, loadState, context } = useProtocolIndexerQuery(
    'recovery-open',
    fetchOpenRecoveryRequests
  );

  const rows = requests ?? [];

  return (
    <ProtocolPanelShell
      context={context}
      description="Live indexed open requests from RecoveryRequested/Resolved events."
      owner={owner}
      requiresIndexer
      requiresOwner={false}
      title="Protocol Recovery Queue"
    >
      <ProtocolQueryStatus
        errorMessage="Could not load recovery projections."
        loadState={loadState}
        loadingMessage="Loading recovery projections…"
      />

      {rows.length === 0 && loadState === 'ready' ? (
        <p className="protocol-hint">No open recovery requests indexed.</p>
      ) : (
        <ul className="protocol-timeline-list">
          {rows.map((request) => (
            <li className="protocol-timeline-item" key={request.id}>
              <strong>{request.id.slice(0, 12)}…</strong>
              <p>
                Passport {request.passport_id.slice(0, 10)}… · requester{' '}
                {request.requester.slice(0, 10)}…
              </p>
            </li>
          ))}
        </ul>
      )}
    </ProtocolPanelShell>
  );
}