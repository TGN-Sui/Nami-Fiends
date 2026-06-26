import { useEffect } from 'react';

import { startChatOverlayCatalogPolling, useChatOverlayCatalogSyncSignal } from './chat-overlay-catalog-sync.js';
import { useMemberCosmeticEquipsSyncSignal } from './member-cosmetic-equips-sync.js';

/** Keep border art catalog fresh while a chat surface is mounted. */
export function useChatCosmeticLiveSync(): void {
  useEffect(() => startChatOverlayCatalogPolling(), []);
}

/** Bump when live cosmetic sync refreshes equips or catalog data. */
export function useChatCosmeticLiveSyncSignal(): number {
  const equipVersion = useMemberCosmeticEquipsSyncSignal();
  const catalogVersion = useChatOverlayCatalogSyncSignal();

  return equipVersion + catalogVersion;
}