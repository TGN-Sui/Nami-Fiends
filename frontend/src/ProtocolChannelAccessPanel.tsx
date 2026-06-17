import type { ReactElement } from 'react';

import { fetchChannelAccessPolicies } from './protocol.js';
import { ProtocolPanelShell } from './protocol-panel.js';
import { ProtocolQueryStatus, useProtocolQuery } from './protocol-query.js';

export function ProtocolChannelAccessPanel(): ReactElement {
  const { data: policies, loadState, owner, context } = useProtocolQuery(
    'channel-access',
    fetchChannelAccessPolicies
  );

  const rows = policies ?? [];

  return (
    <ProtocolPanelShell
      context={context}
      description="Indexed access rules enriched with on-chain policy objects."
      owner={owner}
      title="Channel Access Policies"
    >
      <ProtocolQueryStatus
        errorMessage="Could not load channel access policies."
        loadState={loadState}
        loadingMessage="Loading channel access policies…"
      />

      {rows.length === 0 && loadState === 'ready' ? (
        <p className="protocol-hint">No channel access policies found for this owner.</p>
      ) : null}

      {rows.length > 0 ? (
        <ul className="protocol-timeline-list">
          {rows.map((policy) => {
            const minimumTier =
              policy.projection?.minimum_tier ?? policy.onChain?.minimumTier ?? 0;
            const minimumReputation =
              policy.projection?.minimum_reputation ?? policy.onChain?.minimumReputation ?? 0;
            const allowNpc =
              policy.projection?.allow_npc_chat ?? policy.onChain?.allowNpcChat ?? false;

            return (
              <li className="protocol-timeline-item" key={policy.channelId}>
                <strong>Channel {policy.channelId.slice(0, 12)}…</strong>
                <p>
                  Min tier {minimumTier} · min rep {minimumReputation} · NPC chat{' '}
                  {allowNpc ? 'allowed' : 'restricted'} · {policy.source}
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}
    </ProtocolPanelShell>
  );
}