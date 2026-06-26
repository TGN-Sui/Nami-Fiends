import { useSyncExternalStore } from 'react';

import type { MemberCosmeticEquipSyncError } from './member-cosmetic-equip-sync-errors.js';
import {
  fetchMemberCosmeticEquips,
  isMemberCosmeticEquipsApiAvailable,
  MemberCosmeticEquipsApiError,
  syncMemberCosmeticEquipToBackend,
} from './member-cosmetic-equips-api.js';
import { SELF_MEMBER_ID } from './member-access.js';

export const MEMBER_COSMETIC_EQUIPS_STORAGE_KEY = 'nami.member.cosmetic-equips';
const LEGACY_PROFILE_STORAGE_KEY = 'nami.self.profile';

export type MemberCosmeticEquipSyncResult =
  | { ok: true }
  | { ok: false; error: MemberCosmeticEquipSyncError };

function mapEquipSyncError(error: unknown): MemberCosmeticEquipSyncError {
  if (error instanceof MemberCosmeticEquipsApiError) {
    return error.code;
  }

  return 'request_failed';
}

let cachedEquips: Record<string, string> | null = null;
let cachedUpdatedAtMs = 0;
let equipSyncOwner: string | null = null;
let legacySelfEquipMigrated = false;

function readLegacyProfileChatOverlayId(): string {
  try {
    const stored = window.localStorage.getItem(LEGACY_PROFILE_STORAGE_KEY);

    if (!stored) {
      return '';
    }

    const parsed = JSON.parse(stored) as { chatOverlayDisplay?: unknown };

    return typeof parsed.chatOverlayDisplay === 'string' ? parsed.chatOverlayDisplay.trim() : '';
  } catch {
    return '';
  }
}

function ensureLegacySelfEquipMigrated(equips: Record<string, string>): Record<string, string> {
  if (legacySelfEquipMigrated || equips[SELF_MEMBER_ID]?.trim()) {
    legacySelfEquipMigrated = true;
    return equips;
  }

  const legacyOverlayId = readLegacyProfileChatOverlayId();
  legacySelfEquipMigrated = true;

  if (!legacyOverlayId) {
    return equips;
  }

  const next = {
    ...equips,
    [SELF_MEMBER_ID]: legacyOverlayId,
  };

  writeLocalEquips(next, cachedUpdatedAtMs || Date.now());
  return next;
}

function dispatchChange(): void {
  cachedEquips = null;
  window.dispatchEvent(new CustomEvent('nami-member-cosmetic-equips-changed'));
}

export function setMemberCosmeticEquipSyncOwner(owner: string | null): void {
  equipSyncOwner = owner?.startsWith('0x') ? owner : null;
}

export function readMemberCosmeticEquipSyncOwner(): string | null {
  return equipSyncOwner;
}

function readLocalEquips(): Record<string, string> {
  if (cachedEquips) {
    return cachedEquips;
  }

  try {
    const stored = window.localStorage.getItem(MEMBER_COSMETIC_EQUIPS_STORAGE_KEY);

    if (!stored) {
      cachedEquips = ensureLegacySelfEquipMigrated({});
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

    cachedEquips = ensureLegacySelfEquipMigrated(cachedEquips);
    return cachedEquips;
  } catch {
    cachedEquips = ensureLegacySelfEquipMigrated({});
    return cachedEquips;
  }
}

function writeLocalEquips(equips: Record<string, string>, updatedAtMs = Date.now()): void {
  cachedEquips = { ...equips };
  cachedUpdatedAtMs = updatedAtMs;
  window.localStorage.setItem(
    MEMBER_COSMETIC_EQUIPS_STORAGE_KEY,
    JSON.stringify({ equips: cachedEquips, updatedAtMs: cachedUpdatedAtMs })
  );
  dispatchChange();
}

export function readLocalEquipsForSync(): Record<string, string> {
  return readLocalEquips();
}

export function readMemberCosmeticEquipsUpdatedAtMs(): number {
  readLocalEquips();

  return cachedUpdatedAtMs;
}

/** Drop in-memory equip cache so the next read reflects localStorage (e.g. another tab). */
export function invalidateMemberCosmeticEquipsCache(): void {
  cachedEquips = null;
}

export function readEquippedChatOverlayIdForMember(memberId: string): string {
  const trimmedMemberId = memberId.trim();

  if (!trimmedMemberId) {
    return '';
  }

  const equips = readLocalEquips();
  return equips[trimmedMemberId]?.trim() ?? '';
}

export function readEquippedChatOverlayIdForSelf(): string {
  return readEquippedChatOverlayIdForMember(SELF_MEMBER_ID);
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
): Promise<MemberCosmeticEquipSyncResult> {
  if (!isMemberCosmeticEquipsApiAvailable()) {
    return { ok: false, error: 'api_unavailable' };
  }

  if (!owner?.startsWith('0x')) {
    return { ok: false, error: 'no_owner' };
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
    return { ok: true };
  } catch (error) {
    return { ok: false, error: mapEquipSyncError(error) };
  }
}

function subscribe(listener: () => void): () => void {
  function onChange(): void {
    cachedEquips = null;
    listener();
  }

  window.addEventListener('nami-member-cosmetic-equips-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-member-cosmetic-equips-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useMemberCosmeticEquips(): Record<string, string> {
  return useSyncExternalStore(subscribe, readLocalEquips, readLocalEquips);
}

export function useEquippedChatOverlayIdForMember(memberId: string): string {
  const equips = useMemberCosmeticEquips();

  return equips[memberId]?.trim() ?? '';
}

export function useSelfEquippedChatOverlayId(): string {
  return useEquippedChatOverlayIdForMember(SELF_MEMBER_ID);
}

export function resetMemberCosmeticEquipsForTests(): void {
  cachedEquips = null;
  cachedUpdatedAtMs = 0;
  equipSyncOwner = null;
  legacySelfEquipMigrated = false;

  try {
    window.localStorage.removeItem(MEMBER_COSMETIC_EQUIPS_STORAGE_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}