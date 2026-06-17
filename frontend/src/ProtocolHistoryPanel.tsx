import type { ReactElement } from 'react';

import { ProtocolPanelShell } from './protocol-panel.js';
import { ProtocolQueryStatus, useOwnerHistoryQuery } from './protocol-query.js';

export function ProtocolHistoryPanel(): ReactElement {
  const { data: history, loadState, owner, context } = useOwnerHistoryQuery();
  const badgeHistory = history?.badgeHistory ?? [];
  const boostHistory = history?.boostHistory ?? [];

  return (
    <ProtocolPanelShell
      context={context}
      description="Indexed BadgeMinted/BadgeIssuedByIssuer and BoostUsed events."
      owner={owner}
      requiresIndexer
      title="Badge & Boost History"
    >
      <ProtocolQueryStatus
        errorMessage="Could not load indexed badge and boost history."
        loadState={loadState}
        loadingMessage="Loading indexed badge and boost history…"
      />

      <div className="protocol-moderation-grid">
        <section>
          <h3>Badge Events ({badgeHistory.length})</h3>
          {badgeHistory.length === 0 ? (
            <p className="protocol-hint">No badge history indexed.</p>
          ) : (
            <ul className="protocol-timeline-list">
              {badgeHistory.map((entry) => (
                <li className="protocol-timeline-item" key={entry.id}>
                  <strong>Type {entry.badge_type}</strong>
                  <p>
                    {entry.source === 1 ? 'Minted' : 'Issuer'} ·{' '}
                    {entry.points !== null ? `${entry.points} pts` : 'issuer grant'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3>Boost Usage ({boostHistory.length})</h3>
          {boostHistory.length === 0 ? (
            <p className="protocol-hint">No boost history indexed.</p>
          ) : (
            <ul className="protocol-timeline-list">
              {boostHistory.map((entry) => (
                <li className="protocol-timeline-item" key={entry.id}>
                  <strong>Power {entry.power}</strong>
                  <p>
                    Channel {entry.channel_id.slice(0, 10)}… · week {entry.week_id} · tier{' '}
                    {entry.tier}
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