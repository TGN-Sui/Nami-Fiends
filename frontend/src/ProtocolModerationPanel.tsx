import { useEffect, useState, type ReactElement } from 'react';

import { AppealSealEvidenceActions } from './AppealSealEvidenceActions.js';
import { fetchModerationQueues } from './protocol.js';
import { ProtocolPanelShell } from './protocol-panel.js';
import { ProtocolQueryStatus, useProtocolIndexerQuery } from './protocol-query.js';
import {
  fetchSealPrivacyStatus,
  listSealedEvidence,
  type SealedEvidenceRef,
  type SealPrivacyStatus,
} from './seal-privacy-api.js';
import { useProtocolOwner } from './wallet.js';

export function ProtocolModerationPanel(): ReactElement {
  const { owner } = useProtocolOwner();
  const { data: queues, loadState, context } = useProtocolIndexerQuery(
    'moderation-queues',
    fetchModerationQueues
  );
  const [sealStatus, setSealStatus] = useState<SealPrivacyStatus | null>(null);
  const [sealedEvidence, setSealedEvidence] = useState<SealedEvidenceRef[]>([]);

  const appeals = queues?.appeals ?? [];
  const juryCases = queues?.juryCases ?? [];

  useEffect(() => {
    if (!context.indexer) {
      return;
    }

    let cancelled = false;

    void fetchSealPrivacyStatus()
      .then(async (status) => {
        if (cancelled) {
          return;
        }

        setSealStatus(status);

        if (!owner?.startsWith('0x') || !status?.enabled) {
          setSealedEvidence([]);
          return;
        }

        const items = await listSealedEvidence(owner);

        if (!cancelled) {
          setSealedEvidence(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSealStatus(null);
          setSealedEvidence([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [context.indexer, owner]);

  async function refreshSealedEvidence(): Promise<void> {
    if (!owner?.startsWith('0x') || !sealStatus?.enabled) {
      return;
    }

    const items = await listSealedEvidence(owner);
    setSealedEvidence(items);
  }

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
        Seal private appeal context inline below, then paste the returned <code>seal-…</code> id into
        the on-chain <code>public_reference</code> when opening or updating the appeal.
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
                  <AppealSealEvidenceActions
                    appealId={appeal.id}
                    appellant={appeal.appellant}
                    evidenceItems={sealedEvidence}
                    onEvidenceChanged={refreshSealedEvidence}
                    sealEnabled={Boolean(sealStatus?.enabled)}
                  />
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