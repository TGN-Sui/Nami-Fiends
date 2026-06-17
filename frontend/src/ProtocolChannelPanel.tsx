import type { ReactElement } from 'react';

import { fetchChannelCards } from './protocol.js';
import { ProtocolPanelShell } from './protocol-panel.js';
import { ProtocolQueryStatus, useProtocolQuery } from './protocol-query.js';

export function ProtocolChannelPanel(): ReactElement {
  const { data: channels, loadState, owner, context } = useProtocolQuery(
    'channels',
    fetchChannelCards,
    { requiresIndexer: true }
  );

  const cards = channels ?? [];

  return (
    <ProtocolPanelShell
      context={context}
      description="Indexed channel ownership enriched with on-chain reads (read-only)."
      owner={owner}
      requiresIndexer
      title="Protocol Channels"
    >
      <ProtocolQueryStatus
        errorMessage="Could not load channel cards."
        loadState={loadState}
        loadingMessage="Loading indexed channels…"
      />

      {cards.length === 0 && loadState === 'ready' ? (
        <p className="protocol-hint">No indexed channels found for this owner.</p>
      ) : null}

      {cards.length > 0 ? (
        <ul className="protocol-timeline-list">
          {cards.map((channel) => (
            <li className="protocol-timeline-item" key={channel.id}>
              <strong>{channel.title}</strong>
              <p>
                {channel.subtitle} · {channel.isVerified ? 'Verified' : 'Unverified'} ·{' '}
                {channel.source}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </ProtocolPanelShell>
  );
}