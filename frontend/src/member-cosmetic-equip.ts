import { SELF_MEMBER_ID } from './member-access.js';
import { enqueueEquippedChatOverlaySync } from './member-cosmetic-equip-retry-queue.js';
import {
  readMemberCosmeticEquipSyncOwner,
  setLocalEquippedChatOverlay,
} from './member-cosmetic-equips-store.js';
import {
  readSelfProfileEdits,
  saveSelfProfileEdits,
  type SelfProfileEdits,
} from './member-profile-store.js';
import { readResolvedProtocolOwner } from './protocol-owner-resolve.js';

function resolveEquipSyncOwner(): string | null {
  return readResolvedProtocolOwner() ?? readMemberCosmeticEquipSyncOwner();
}

/** Persist self chat overlay equip locally and queue off-chain server sync. */
export function saveEquippedChatOverlay(overlayId: string, profileEdits?: SelfProfileEdits): void {
  const trimmed = overlayId.trim();
  const edits = profileEdits ?? readSelfProfileEdits();

  saveSelfProfileEdits({
    ...edits,
    chatOverlayDisplay: trimmed,
  });
  setLocalEquippedChatOverlay(SELF_MEMBER_ID, trimmed);
  enqueueEquippedChatOverlaySync(SELF_MEMBER_ID, trimmed, resolveEquipSyncOwner());
}