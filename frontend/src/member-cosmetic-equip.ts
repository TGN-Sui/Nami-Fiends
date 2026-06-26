import { canEditProfileCosmetics, getSelfMember, SELF_MEMBER_ID } from './member-access.js';
import { overlayRewardUnlockedForMember } from './chat-overlay-rewards.js';
import { enqueueEquippedChatOverlaySync } from './member-cosmetic-equip-retry-queue.js';
import {
  readMemberCosmeticEquipSyncOwner,
  setLocalEquippedChatOverlay,
} from './member-cosmetic-equips-store.js';
import { pushNamiToast } from './nami-toast-store.js';
import { readOfficialChatOverlayRewards } from './official-chat-overlay-rewards-store.js';
import { readResolvedProtocolOwner } from './protocol-owner-resolve.js';
import type { NamiMember } from './uiMockData.js';

function resolveEquipSyncOwner(): string | null {
  return readResolvedProtocolOwner() ?? readMemberCosmeticEquipSyncOwner();
}

export type EquipChatOverlayError =
  | 'cosmetics_locked'
  | 'overlay_not_found'
  | 'overlay_disabled'
  | 'overlay_not_unlocked';

export type EquipChatOverlayResult = { ok: true } | { ok: false; error: EquipChatOverlayError };

export function equipChatOverlayErrorMessage(error: EquipChatOverlayError): string {
  if (error === 'cosmetics_locked') {
    return 'Chat border cosmetics are locked for your passport signal. Verify your passport to equip borders.';
  }

  if (error === 'overlay_not_found') {
    return 'That chat border is no longer in the reward catalog.';
  }

  if (error === 'overlay_disabled') {
    return 'That chat border reward is disabled and cannot be equipped.';
  }

  return 'You have not unlocked that chat border yet.';
}

export function validateEquippedChatOverlay(
  overlayId: string,
  member: NamiMember = getSelfMember()
): EquipChatOverlayResult {
  if (!canEditProfileCosmetics(member)) {
    return { ok: false, error: 'cosmetics_locked' };
  }

  const trimmed = overlayId.trim();

  if (!trimmed) {
    return { ok: true };
  }

  const reward = readOfficialChatOverlayRewards().find((entry) => entry.id === trimmed);

  if (!reward) {
    return { ok: false, error: 'overlay_not_found' };
  }

  if (!reward.enabled) {
    return { ok: false, error: 'overlay_disabled' };
  }

  if (!overlayRewardUnlockedForMember(member, reward)) {
    return { ok: false, error: 'overlay_not_unlocked' };
  }

  return { ok: true };
}

/** Persist self chat overlay equip locally and queue off-chain server sync. */
export function saveEquippedChatOverlay(overlayId: string): boolean {
  const validation = validateEquippedChatOverlay(overlayId);

  if (!validation.ok) {
    pushNamiToast(equipChatOverlayErrorMessage(validation.error), 'error');
    return false;
  }

  const trimmed = overlayId.trim();

  setLocalEquippedChatOverlay(SELF_MEMBER_ID, trimmed);
  enqueueEquippedChatOverlaySync(SELF_MEMBER_ID, trimmed, resolveEquipSyncOwner());
  return true;
}