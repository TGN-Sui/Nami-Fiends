import { SELF_MEMBER_ID } from './member-access.js';
import {
  readSelfProfileEdits,
  saveSelfProfileEdits,
  type SelfProfileEdits,
} from './member-profile-store.js';
import {
  setLocalEquippedChatOverlay,
  syncEquippedChatOverlayToServer,
} from './member-cosmetic-equips-store.js';
import { readResolvedProtocolOwner } from './protocol-owner-resolve.js';

/** Persist self chat overlay equip locally and sync off-chain to the receiving server. */
export function saveEquippedChatOverlay(overlayId: string, profileEdits?: SelfProfileEdits): void {
  const trimmed = overlayId.trim();
  const edits = profileEdits ?? readSelfProfileEdits();

  saveSelfProfileEdits({
    ...edits,
    chatOverlayDisplay: trimmed,
  });
  setLocalEquippedChatOverlay(SELF_MEMBER_ID, trimmed);

  void syncEquippedChatOverlayToServer(SELF_MEMBER_ID, trimmed, readResolvedProtocolOwner());
}