import type { ReactElement } from 'react';

import { fetchProfileView } from './protocol.js';
import { ProtocolPanelShell } from './protocol-panel.js';
import { ProtocolQueryStatus, useProtocolQuery } from './protocol-query.js';

export function ProtocolProfilePanel(): ReactElement {
  const { data: profileView, loadState, owner, context } = useProtocolQuery(
    'profile',
    fetchProfileView
  );

  const hasLiveData = Boolean(
    profileView?.profile || profileView?.projection || profileView?.passport
  );

  return (
    <ProtocolPanelShell
      context={context}
      description="On-chain Profile object plus indexed ProfileCreated/Updated projection."
      owner={owner}
      title="Protocol Profile"
    >
      <ProtocolQueryStatus
        errorMessage="Could not load protocol profile data."
        loadState={loadState}
        loadingMessage="Loading profile and passport enrichment…"
      />

      {!hasLiveData && loadState === 'ready' ? (
        <p className="protocol-hint">No owned Profile object or indexed profile found.</p>
      ) : null}

      {hasLiveData ? (
        <div className="passport-wallet-grid passport-wallet-grid-refined">
          <span>Profile ID</span>
          <strong>{profileView?.profile?.objectId ?? profileView?.projection?.id ?? '—'}</strong>
          <span>Display Name</span>
          <strong>{profileView?.profile?.displayName?.trim() || '—'}</strong>
          <span>Visibility</span>
          <strong>
            {profileView?.profile?.isPublic ?? profileView?.projection?.is_public
              ? 'Public'
              : 'Private'}
          </strong>
          <span>Passport Tier</span>
          <strong>
            {profileView?.passport?.membershipTierLabel ??
              (profileView?.snapshotTier !== null && profileView?.snapshotTier !== undefined
                ? `Tier ${profileView.snapshotTier}`
                : '—')}
          </strong>
          <span>Timeline Entries</span>
          <strong>{profileView?.timelineEntryCount ?? 0}</strong>
        </div>
      ) : null}
    </ProtocolPanelShell>
  );
}