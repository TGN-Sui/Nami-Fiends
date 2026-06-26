import type { ReactElement } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';
import {
  readOfficialChatOverlayRewards,
  useChatOverlayCatalogAttestation,
} from './official-chat-overlay-rewards-store.js';
import { resolveProtocolConnectionState } from './protocol-availability.js';
import { useProtocolOwner } from './wallet.js';

type ProtocolStatusBarProps = {
  className?: string;
};

function catalogHasWalrusPatchRefs(): boolean {
  return readOfficialChatOverlayRewards().some(
    (reward) => reward.staticArtRef?.patchId || reward.animatedArtRef?.patchId
  );
}

export function ProtocolStatusBar(props: ProtocolStatusBarProps = {}): ReactElement {
  const { owner, source, context } = useProtocolOwner();
  const catalogAttestation = useChatOverlayCatalogAttestation();
  const connection = resolveProtocolConnectionState(context, owner, source);
  const rootClassName =
    'protocol-status-bar is-protocol-site-footer' + (props.className ? ' ' + props.className : '');

  const officialView = isOfficialOwner(owner);
  const walrusCatalogLive =
    officialView &&
    ((catalogAttestation?.patchCount ?? 0) > 0 ||
      Boolean(catalogAttestation?.quiltBlobId) ||
      catalogHasWalrusPatchRefs());

  const showOnChainBadge = officialView && catalogAttestation?.status === 'on-chain';
  const showWalrusBadge = officialView && walrusCatalogLive && !showOnChainBadge;

  return (
    <div className={rootClassName}>
      <span className="mini-badge">{connection.badge}</span>
      {showOnChainBadge ? (
        <span className="mini-badge protocol-status-bar-catalog-verified">
          Catalog verified on-chain
        </span>
      ) : null}
      {showWalrusBadge ? (
        <span className="mini-badge protocol-status-bar-catalog-walrus">
          Border art catalog on Walrus
        </span>
      ) : null}
      <p>{connection.detail}</p>
    </div>
  );
}