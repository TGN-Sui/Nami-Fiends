import { useEffect, type ReactElement } from 'react';

import { linkMemberSessionAuth } from './member-auth-link-store.js';
import { readMemberSession } from './member-session-store.js';
import { hydrateLinkedMember } from './linked-member-sync.js';
import { refreshEquippedChatOverlaySyncOwner } from './member-cosmetic-equip-retry-queue.js';
import { refreshChatOverlayCatalogSyncOwner } from './chat-overlay-rewards-retry-queue.js';
import {
  hydrateMemberSessionPreferences,
  setSessionPreferencesSyncOwner,
} from './preferences-sync.js';
import { useProtocolOwner } from './wallet.js';

export function MemberSessionSync(): ReactElement | null {
  const { owner, source } = useProtocolOwner();

  useEffect(() => {
    setSessionPreferencesSyncOwner(owner);
    refreshEquippedChatOverlaySyncOwner(owner);
    refreshChatOverlayCatalogSyncOwner(owner);

    if (!owner?.startsWith('0x')) {
      return;
    }

    const session = readMemberSession();

    if (session) {
      linkMemberSessionAuth(session, {
        email: session.email,
        zkLoginAddress: source === 'zklogin' ? owner : null,
        walletAddress: source === 'wallet' || source === 'linked' ? owner : null,
      });
    }

    void Promise.all([
      hydrateMemberSessionPreferences(owner),
      hydrateLinkedMember(owner, source),
    ]);
  }, [owner, source]);

  return null;
}