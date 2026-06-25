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
let cachedUpdatedAtMs = 0;
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

    const parsed = JSON.parse(stored) as { equips?: Record<string, string>; updatedAtMs?: number };

    cachedUpdatedAtMs =
      typeof parsed.updatedAtMs === 'number' && Number.isFinite(parsed.updatedAtMs)
        ? parsed.updatedAtMs
        : 0;

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

function writeLocalEquips(equips: Record<string, string>, updatedAtMs = Date.now()): void {
  cachedEquips = { ...equips };
  cachedUpdatedAtMs = updatedAtMs;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ equips: cachedEquips, updatedAtMs: cachedUpdatedAtMs })
  );
  dispatchChange();
}

export function readLocalEquipsForSync(): Record<string, string> {
  return readLocalEquips();
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
    const serverUpdatedAtMs =
      typeof projection.updatedAtMs === 'number' && Number.isFinite(projection.updatedAtMs)
        ? projection.updatedAtMs
        : Date.now();

    if (serverUpdatedAtMs <= cachedUpdatedAtMs) {
      return false;
    }

    writeLocalEquips(serverEquips, serverUpdatedAtMs);
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

    writeLocalEquips(
      projection.equips ?? {},
      typeof projection.updatedAtMs === 'number' ? projection.updatedAtMs : Date.now()
    );
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
  cachedUpdatedAtMs = 0;
  equipSyncOwner = null;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}