import { useSyncExternalStore } from 'react';

import {
  fetchMemberCosmeticEquips,
  isMemberCosmeticEquipsApiAvailable,
  syncMemberCosmeticEquipToBackend,
} from './member-cosmetic-equips-api.js';
import { SELF_MEMBER_ID } from './member-access.js';
import { readSelfProfileEdits } from './member-profile-store.js';

const STORAGE_KEY = 'nami.member.cosmetic-equips';

let cachedEquips: Record<string, string> | null = null;
let equipSyncOwner: string | null = null;

function dispatchChange(): void {
  cachedEquips = null;
  window.dispatchEvent(new CustomEvent('nami-member-cosmetic-equips-changed'));
}

export function setMemberCosmeticEquipSyncOwner(owner: string | null): void {
  equipSyncOwner = owner?.startsWith('0x') ? owner : null;
}

function readLocalEquips(): Record<string, string> {
  if (cachedEquips) {
    return cachedEquips;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      cachedEquips = {};
      return cachedEquips;
    }

    const parsed = JSON.parse(stored) as { equips?: Record<string, string> };

    cachedEquips =
      parsed.equips && typeof parsed.equips === 'object' && !Array.isArray(parsed.equips)
        ? Object.fromEntries(
            Object.entries(parsed.equips).filter(
              ([memberId, overlayId]) =>
                typeof memberId === 'string' &&
                memberId.trim().length > 0 &&
                typeof overlayId === 'string' &&
                overlayId.trim().length > 0
            )
          )
        : {};

    return cachedEquips;
  } catch {
    cachedEquips = {};
    return cachedEquips;
  }
}

function writeLocalEquips(equips: Record<string, string>): void {
  cachedEquips = { ...equips };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ equips: cachedEquips }));
  dispatchChange();
}

export function readEquippedChatOverlayIdForMember(memberId: string): string {
  const trimmedMemberId = memberId.trim();

  if (!trimmedMemberId) {
    return '';
  }

  const equips = readLocalEquips();
  const equipped = equips[trimmedMemberId]?.trim() ?? '';

  if (equipped) {
    return equipped;
  }

  if (trimmedMemberId === SELF_MEMBER_ID) {
    return readSelfProfileEdits().chatOverlayDisplay.trim();
  }

  return '';
}

export function setLocalEquippedChatOverlay(memberId: string, overlayId: string): void {
  const equips = readLocalEquips();
  const trimmedOverlay = overlayId.trim();

  if (!trimmedOverlay) {
    const { [memberId]: _removed, ...rest } = equips;
    writeLocalEquips(rest);
    return;
  }

  writeLocalEquips({
    ...equips,
    [memberId]: trimmedOverlay,
  });
}

export async function hydrateMemberCosmeticEquipsFromServer(): Promise<boolean> {
  if (!isMemberCosmeticEquipsApiAvailable()) {
    return false;
  }

  try {
    const projection = await fetchMemberCosmeticEquips();
    const serverEquips = projection.equips ?? {};

    if (Object.keys(serverEquips).length === 0) {
      return false;
    }

    writeLocalEquips(serverEquips);
    return true;
  } catch {
    return false;
  }
}

export async function syncEquippedChatOverlayToServer(
  memberId: string,
  overlayId: string,
  owner: string | null = equipSyncOwner
): Promise<boolean> {
  setLocalEquippedChatOverlay(memberId, overlayId);

  if (!isMemberCosmeticEquipsApiAvailable() || !owner?.startsWith('0x')) {
    return false;
  }

  try {
    const projection = await syncMemberCosmeticEquipToBackend({
      memberId,
      chatOverlayDisplay: overlayId,
      ownerOverride: owner,
    });

    writeLocalEquips(projection.equips ?? {});
    return true;
  } catch {
    return false;
  }
}

function subscribe(listener: () => void): () => void {
  function onChange(): void {
    cachedEquips = null;
    listener();
  }

  window.addEventListener('nami-member-cosmetic-equips-changed', onChange);
  window.addEventListener('nami-self-profile-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-member-cosmetic-equips-changed', onChange);
    window.removeEventListener('nami-self-profile-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useMemberCosmeticEquips(): Record<string, string> {
  return useSyncExternalStore(subscribe, readLocalEquips, readLocalEquips);
}

export function resetMemberCosmeticEquipsForTests(): void {
  cachedEquips = null;
  equipSyncOwner = null;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}