import { config } from '../config.js';
import { getChatOverlayRewardsCatalog } from './chat-overlay-rewards.service.js';
import { readJsonFile, writeJsonFile } from '../storage.js';

export type MemberCosmeticEquipsProjection = {
  /** memberId → equipped chat overlay reward id (empty string = default bubble). */
  equips: Record<string, string>;
  updatedAtMs: number;
};

const PROJECTION_PATH = `${config.dataDir}/projections/member-cosmetic-equips.json`;
const MAX_MEMBER_ID_LENGTH = 64;
const MAX_OVERLAY_ID_LENGTH = 96;

function emptyProjection(): MemberCosmeticEquipsProjection {
  return {
    equips: {},
    updatedAtMs: Date.now(),
  };
}

function safeMemberId(memberId: string): string | null {
  const trimmed = memberId.trim();

  if (
    !trimmed ||
    trimmed.length > MAX_MEMBER_ID_LENGTH ||
    trimmed !== trimmed.replace(/[^a-zA-Z0-9._-]/g, '')
  ) {
    return null;
  }

  return trimmed;
}

function normalizeOverlayId(overlayId: string): string {
  const trimmed = overlayId.trim();

  if (!trimmed) {
    return '';
  }

  if (trimmed.length > MAX_OVERLAY_ID_LENGTH) {
    throw new Error('invalid_overlay_id');
  }

  if (trimmed !== trimmed.replace(/[^a-zA-Z0-9._-]/g, '')) {
    throw new Error('invalid_overlay_id');
  }

  return trimmed;
}

async function assertOverlayEquipAllowed(overlayId: string): Promise<void> {
  if (!overlayId) {
    return;
  }

  const catalog = await getChatOverlayRewardsCatalog();
  const reward = catalog.rewards.find((entry) => entry.id === overlayId);

  if (!reward) {
    throw new Error('overlay_not_found');
  }

  if (!reward.enabled) {
    throw new Error('overlay_disabled');
  }
}

function sanitizeEquips(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([memberId, overlayId]) => {
      const safeId = safeMemberId(memberId);

      if (!safeId || typeof overlayId !== 'string') {
        return [];
      }

      try {
        const normalized = normalizeOverlayId(overlayId);

        return normalized ? [[safeId, normalized]] : [];
      } catch {
        return [];
      }
    })
  );
}

async function readProjection(): Promise<MemberCosmeticEquipsProjection> {
  const stored = await readJsonFile<MemberCosmeticEquipsProjection>(
    PROJECTION_PATH,
    emptyProjection()
  );

  return {
    equips: sanitizeEquips(stored.equips),
    updatedAtMs: typeof stored.updatedAtMs === 'number' ? stored.updatedAtMs : Date.now(),
  };
}

async function writeProjection(projection: MemberCosmeticEquipsProjection): Promise<void> {
  await writeJsonFile(PROJECTION_PATH, {
    equips: projection.equips,
    updatedAtMs: Date.now(),
  });
}

export async function getMemberCosmeticEquips(): Promise<MemberCosmeticEquipsProjection> {
  return readProjection();
}

export async function getEquippedChatOverlayForMember(memberId: string): Promise<string> {
  const safeId = safeMemberId(memberId);

  if (!safeId) {
    return '';
  }

  const projection = await readProjection();

  return projection.equips[safeId] ?? '';
}

export async function syncMemberCosmeticEquip(input: {
  memberId: string;
  chatOverlayDisplay: string;
}): Promise<MemberCosmeticEquipsProjection> {
  const memberId = safeMemberId(input.memberId);

  if (!memberId) {
    throw new Error('invalid_member_id');
  }

  const overlayId = normalizeOverlayId(input.chatOverlayDisplay);

  await assertOverlayEquipAllowed(overlayId);

  const projection = await readProjection();
  const nextEquips = { ...projection.equips };

  if (!overlayId) {
    delete nextEquips[memberId];
  } else {
    nextEquips[memberId] = overlayId;
  }

  const next: MemberCosmeticEquipsProjection = {
    equips: nextEquips,
    updatedAtMs: Date.now(),
  };

  await writeProjection(next);
  return next;
}