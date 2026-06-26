import { useChatOverlayCatalogSyncSignal } from './chat-overlay-catalog-sync.js';
import { useMemberCosmeticEquipsSyncSignal } from './member-cosmetic-equips-sync.js';

/** Bump when live cosmetic sync refreshes equips or catalog data. */
export function useChatCosmeticLiveSyncSignal(): number {
  const equipVersion = useMemberCosmeticEquipsSyncSignal();
  const catalogVersion = useChatOverlayCatalogSyncSignal();

  return equipVersion + catalogVersion;
}