import type { ReactElement } from 'react';

import { fetchModerationQueues } from './protocol.js';
import { ProtocolPanelShell } from './protocol-panel.js';
import { ProtocolQueryStatus, useProtocolIndexerQuery } from './protocol-query.js';
import { useProtocolOwner } from './wallet.js';

export function ProtocolModerationPanel(): ReactElement {
  const { owner } = useProtocolOwner();
  const { data: queues, loadState, context } = useProtocolIndexerQuery(
    'moderation-queues',
    fetchModerationQueues
  );

  const appeals = queues?.appeals ?? [];
  const juryCases = queues?.juryCases ?? [];

  return (
    <ProtocolPanelShell
      context={context}
      description="Live indexed queues from AppealOpened/Resolved and JuryCase events."
      owner={owner}
      requiresIndexer
      requiresOwner={false}
      title="Protocol Appeals & Jury"
    >
      <ProtocolQueryStatus
        errorMessage="Could not load moderation projections."
        loadState={loadState}
        loadingMessage="Loading moderation projections…"
      />

      <p className="protocol-hint">
        Private appeal evidence uses the Seal privacy lane (<code>/api/privacy/evidence/seal</code>)
        when <code>NAMI_SEAL_PRIVACY_ENABLED</code> is on — see Launch Ops.
      </p>

      <div className="protocol-moderation-grid">
        <section>
          <h3>Open Appeals ({appeals.length})</h3>
          {appeals.length === 0 ? (
            <p className="protocol-hint">No open appeals indexed.</p>
          ) : (
            <ul className="protocol-timeline-list">
              {appeals.map((appeal) => (
                <li className="protocol-timeline-item" key={appeal.id}>
                  <strong>{appeal.id.slice(0, 12)}…</strong>
                  <p>
                    Passport {appeal.passport_id.slice(0, 10)}… · action type{' '}
                    {appeal.moderation_action_type}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3>Open Jury Cases ({juryCases.length})</h3>
          {juryCases.length === 0 ? (
            <p className="protocol-hint">No open jury cases indexed.</p>
          ) : (
            <ul className="protocol-timeline-list">
              {juryCases.map((juryCase) => (
                <li className="protocol-timeline-item" key={juryCase.id}>
                  <strong>{juryCase.id.slice(0, 12)}…</strong>
                  <p>
                    Appeal {juryCase.appeal_id.slice(0, 10)}… · votes{' '}
                    {juryCase.approve_votes}/{juryCase.deny_votes}/{juryCase.modify_votes}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ProtocolPanelShell>
  );
}