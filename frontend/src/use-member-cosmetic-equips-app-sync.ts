import { useEffect } from 'react';

import { startMemberCosmeticEquipsAppSync } from './member-cosmetic-equips-sync.js';

/** Keep member border equips fresh app-wide (polling, cross-tab, focus refresh). */
export function useMemberCosmeticEquipsAppSync(): void {
  useEffect(() => startMemberCosmeticEquipsAppSync(), []);
}