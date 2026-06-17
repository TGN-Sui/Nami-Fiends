import type { ReactElement } from 'react';

import { fetchActiveModerationRecords } from './protocol.js';
import { ProtocolPanelShell } from './protocol-panel.js';
import { ProtocolQueryStatus, useProtocolIndexerQuery } from './protocol-query.js';
import { useProtocolOwner } from './wallet.js';

const ACTION_LABELS: Record<number, string> = {
  1: 'Warning',
  2: 'Mute',
  3: 'Channel Ban',
  4: 'Black Passport',
};

export function ProtocolModerationRecordsPanel(): ReactElement {
  const { owner } = useProtocolOwner();
  const { data: records, loadState, context } = useProtocolIndexerQuery(
    'moderation-records',
    fetchActiveModerationRecords
  );

  const rows = records ?? [];

  return (
    <ProtocolPanelShell
      context={context}
      description="Live indexed mutes, bans, and black passport actions still in effect."
      owner={owner}
      requiresIndexer
      requiresOwner={false}
      title="Active Moderation Records"
    >
      <ProtocolQueryStatus
        errorMessage="Could not load active moderation records."
        loadState={loadState}
        loadingMessage="Loading active moderation records…"
      />

      {rows.length === 0 && loadState === 'ready' ? (
        <p className="protocol-hint">No active moderation records indexed.</p>
      ) : (
        <ul className="protocol-timeline-list">
          {rows.map((record) => (
            <li className="protocol-timeline-item" key={record.id}>
              <strong>{ACTION_LABELS[record.action_type] ?? `Action ${record.action_type}`}</strong>
              <p>
                Target {record.target_owner.slice(0, 10)}… · passport{' '}
                {record.passport_id.slice(0, 10)}…
                {record.channel_id ? ` · channel ${record.channel_id.slice(0, 8)}…` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </ProtocolPanelShell>
  );
}