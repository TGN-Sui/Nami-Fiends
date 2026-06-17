import type { ReactElement } from 'react';

import { fetchCustomizationView } from './protocol.js';
import { ProtocolPanelShell } from './protocol-panel.js';
import { ProtocolQueryStatus, useProtocolQuery } from './protocol-query.js';

export function ProtocolCustomizationPanel(): ReactElement {
  const { data: view, loadState, owner, context } = useProtocolQuery(
    'customization',
    fetchCustomizationView
  );

  return (
    <ProtocolPanelShell
      context={context}
      description="On-chain title display and cosmetic loadout reads."
      owner={owner}
      title="Titles & Cosmetics"
    >
      <ProtocolQueryStatus
        errorMessage="Could not load customization objects."
        loadState={loadState}
        loadingMessage="Loading titles and cosmetics…"
      />

      {!view?.titleDisplay && !view?.cosmeticLoadout && loadState === 'ready' ? (
        <p className="protocol-hint">No owned TitleDisplay or CosmeticLoadout found.</p>
      ) : null}

      {view?.titleDisplay || view?.cosmeticLoadout ? (
        <div className="passport-wallet-grid passport-wallet-grid-refined">
          <span>Equipped Title Type</span>
          <strong>{view.titleDisplay?.equippedTitleType ?? '—'}</strong>
          <span>Title Display ID</span>
          <strong>{view.titleDisplay?.objectId ?? '—'}</strong>
          <span>Profile Frame</span>
          <strong>{view.cosmeticLoadout?.profileFrameCode ?? '—'}</strong>
          <span>Passport Theme</span>
          <strong>{view.cosmeticLoadout?.passportThemeCode ?? '—'}</strong>
        </div>
      ) : null}
    </ProtocolPanelShell>
  );
}