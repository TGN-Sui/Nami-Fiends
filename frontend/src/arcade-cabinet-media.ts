import {
  OFFICIAL_ARCADE_CABINETS,
  readArcadeCabinetById,
  type ArcadeCabinetDefinition,
} from './arcade-cabinets.js';
export type ArcadeCabinetMediaKind = 'intro' | 'stage' | 'viewport';

/** Public fallback path for cabinet walk-up intro or stage loop (never game-scoped). */
export function readArcadeCabinetPublicMediaUrl(
  cabinetId: string,
  kind: Extract<ArcadeCabinetMediaKind, 'intro' | 'stage'>,
): string {
  return `/arcade/cabinets/${cabinetId}/${kind === 'intro' ? 'intro.mp4' : 'stage.mp4'}`;
}

export function arcadeCabinetMediaSlotId(
  cabinetId: string,
  kind: ArcadeCabinetMediaKind,
): string {
  return `arcade-cabinet-${cabinetId}-${kind}`;
}

export function parseArcadeCabinetMediaSlotId(
  slotId: string,
): { cabinetId: string; kind: ArcadeCabinetMediaKind } | null {
  const match = /^arcade-cabinet-(.+)-(intro|stage|viewport)$/.exec(slotId);

  if (!match) {
    return null;
  }

  return {
    cabinetId: match[1]!,
    kind: match[2] as ArcadeCabinetMediaKind,
  };
}

export function isArcadeCabinetMediaSlotId(slotId: string): boolean {
  return parseArcadeCabinetMediaSlotId(slotId) !== null;
}

export function arcadeCabinetMediaStorageKey(
  cabinetId: string,
  kind: ArcadeCabinetMediaKind,
): string {
  return `nami.owner.arcade-cabinet.${cabinetId}.${kind}`;
}

export function readArcadeCabinetDefaultMediaUrl(
  cabinet: ArcadeCabinetDefinition,
  kind: ArcadeCabinetMediaKind,
): string {
  if (kind === 'intro') {
    return readArcadeCabinetPublicMediaUrl(cabinet.id, 'intro');
  }

  if (kind === 'stage') {
    return readArcadeCabinetPublicMediaUrl(cabinet.id, 'stage');
  }

  return cabinet.stageFallbackUrl;
}

export function readArcadeCabinetByMediaSlot(slotId: string): ArcadeCabinetDefinition | null {
  const parsed = parseArcadeCabinetMediaSlotId(slotId);

  if (!parsed) {
    return null;
  }

  return readArcadeCabinetById(parsed.cabinetId);
}