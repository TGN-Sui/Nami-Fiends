import { useEffect } from 'react';

import { startEquippedChatOverlayRetryLoop } from './member-cosmetic-equip-retry-queue.js';
import { startMemberCosmeticEquipsAppSync } from './member-cosmetic-equips-sync.js';

/** Keep member border equips fresh app-wide (polling, cross-tab, focus refresh, retry queue). */
export function useMemberCosmeticEquipsAppSync(): void {
  useEffect(() => {
    const stopEquipSync = startMemberCosmeticEquipsAppSync();
    const stopRetryLoop = startEquippedChatOverlayRetryLoop();

    return () => {
      stopEquipSync();
      stopRetryLoop();
    };
  }, []);
}