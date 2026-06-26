import { assertBorderArtCanvasDimensions } from '../border-art-image-dimensions.js';
import { config } from '../config.js';
import { readJsonFile, writeJsonFile } from '../storage.js';

import {
  publishChatOverlayCatalogAttestation,
  type ChatOverlayCatalogAttestation,
} from './chat-overlay-catalog-attestation.service.js';
import { readUploadedMediaFile, saveBorderArtUpload } from './media-upload.service.js';
import {
  isWalrusBorderArtEnabled,
  publishBorderArtQuilt,
  sha256Hex,
  type BorderArtQuiltPatchInput,
  type WalrusQuiltPatchRef,
} from './walrus-quilt-publisher.service.js';

export type { WalrusQuiltPatchRef } from './walrus-quilt-publisher.service.js';

export type ChatOverlayUnlockCondition =
  | { type: 'tier-min'; tier: 'Adventurer' | 'Pro' | 'Elite' }
  | { type: 'verified' }
  | { type: 'official-grant'; memberIds: string[] };

export type ChatBorderSliceInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type OfficialChatOverlayReward = {
  id: string;
  name: string;
  description: string;
  borderStyle: string;
  motion: 'static' | 'premium-loop';
  accent: 'cyan' | 'gold' | 'violet' | 'mint';
  staticArtUrl: string | null;
  animatedArtUrl: string | null;
  staticArtRef?: WalrusQuiltPatchRef | null;
  animatedArtRef?: WalrusQuiltPatchRef | null;
  artSliceInsets: ChatBorderSliceInsets;
  displayWidths: ChatBorderSliceInsets;
  condition: ChatOverlayUnlockCondition;
  enabled: boolean;
  updatedAtMs: number;
};

export type ChatOverlayRewardsProjection = {
  rewards: OfficialChatOverlayReward[];
  updatedAtMs: number;
  catalogAttestation?: ChatOverlayCatalogAttestation | null;
};

const PROJECTION_PATH = `${config.dataDir}/projections/chat-overlay-rewards.json`;
const DATA_URL_PATTERN = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i;
const MAX_REWARD_COUNT = 32;

const DEFAULT_SLICE: ChatBorderSliceInsets = {
  top: 56,
  right: 32,
  bottom: 24,
  left: 32,
};

const DEFAULT_DISPLAY: ChatBorderSliceInsets = {
  top: 28,
  right: 16,
  bottom: 12,
  left: 16,
};

type ArtSlotDraft = {
  url: string | null;
  ref: WalrusQuiltPatchRef | null;
  stagedPatch: BorderArtQuiltPatchInput | null;
  renderUpload: {
    owner: string;
    rewardId: string;
    artKind: 'static' | 'animated';
    contentType: string;
    dataBase64: string;
  } | null;
};

function emptyProjection(): ChatOverlayRewardsProjection {
  return {
    rewards: [],
    updatedAtMs: Date.now(),
    catalogAttestation: null,
  };
}

function normalizeCatalogAttestation(value: unknown): ChatOverlayCatalogAttestation | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const quiltBlobId = typeof record.quiltBlobId === 'string' ? record.quiltBlobId.trim() : '';
  const contentRootHash =
    typeof record.contentRootHash === 'string' ? record.contentRootHash.trim() : '';
  const catalogVersionMs =
    typeof record.catalogVersionMs === 'number' && Number.isFinite(record.catalogVersionMs)
      ? record.catalogVersionMs
      : null;
  const patchCount =
    typeof record.patchCount === 'number' && Number.isFinite(record.patchCount)
      ? record.patchCount
      : null;
  const publishedAtMs =
    typeof record.publishedAtMs === 'number' && Number.isFinite(record.publishedAtMs)
      ? record.publishedAtMs
      : Date.now();
  const status =
    record.status === 'on-chain' ||
    record.status === 'pending-package' ||
    record.status === 'skipped'
      ? record.status
      : null;

  if (!quiltBlobId || !contentRootHash || catalogVersionMs === null || patchCount === null || !status) {
    return null;
  }

  return {
    quiltBlobId,
    catalogVersionMs,
    contentRootHash,
    patchCount,
    txDigest: typeof record.txDigest === 'string' ? record.txDigest : null,
    publishedAtMs,
    status,
    ...(typeof record.detail === 'string' ? { detail: record.detail } : {}),
  };
}

export function buildDefaultChatOverlayRewards(now = Date.now()): OfficialChatOverlayReward[] {
  return [
    {
      id: 'overlay-signal-glow',
      name: 'Signal Glow',
      description: 'Verified members earn a soft cyan glow on chat bubbles.',
      borderStyle: 'signal-glow',
      motion: 'static',
      accent: 'cyan',
      staticArtUrl: null,
      animatedArtUrl: null,
      artSliceInsets: { ...DEFAULT_SLICE },
      displayWidths: { ...DEFAULT_DISPLAY },
      condition: { type: 'verified' },
      enabled: true,
      updatedAtMs: now,
    },
    {
      id: 'overlay-wave-frame',
      name: 'Wave Frame',
      description: 'Pro members unlock a gradient wave frame around chat bubbles.',
      borderStyle: 'wave-frame',
      motion: 'static',
      accent: 'violet',
      staticArtUrl: null,
      animatedArtUrl: null,
      artSliceInsets: { ...DEFAULT_SLICE },
      displayWidths: { ...DEFAULT_DISPLAY },
      condition: { type: 'tier-min', tier: 'Pro' },
      enabled: true,
      updatedAtMs: now,
    },
    {
      id: 'overlay-pulse-ring',
      name: 'Pulse Ring',
      description: 'Elite members get a premium looping ring highlight.',
      borderStyle: 'pulse-ring',
      motion: 'premium-loop',
      accent: 'gold',
      staticArtUrl: null,
      animatedArtUrl: null,
      artSliceInsets: { ...DEFAULT_SLICE },
      displayWidths: { ...DEFAULT_DISPLAY },
      condition: { type: 'tier-min', tier: 'Elite' },
      enabled: true,
      updatedAtMs: now,
    },
    {
      id: 'overlay-genesis-spark',
      name: 'Genesis Spark',
      description: 'Official grant overlay for launch partners and event winners.',
      borderStyle: 'genesis-spark',
      motion: 'premium-loop',
      accent: 'mint',
      staticArtUrl: null,
      animatedArtUrl: null,
      artSliceInsets: { ...DEFAULT_SLICE },
      displayWidths: { ...DEFAULT_DISPLAY },
      condition: { type: 'official-grant', memberIds: [] },
      enabled: true,
      updatedAtMs: now,
    },
  ];
}

function safeRewardId(rewardId: string): string | null {
  const trimmed = rewardId.trim();

  if (!trimmed || trimmed !== trimmed.replace(/[^a-zA-Z0-9._-]/g, '')) {
    return null;
  }

  return trimmed;
}

function normalizeWalrusQuiltPatchRef(value: unknown): WalrusQuiltPatchRef | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (record.kind !== 'walrus-quilt-patch') {
    return null;
  }

  const quiltBlobId = typeof record.quiltBlobId === 'string' ? record.quiltBlobId.trim() : '';
  const patchId = typeof record.patchId === 'string' ? record.patchId.trim() : '';
  const aggregatorBase =
    typeof record.aggregatorBase === 'string' ? record.aggregatorBase.trim() : '';
  const contentHash = typeof record.contentHash === 'string' ? record.contentHash.trim() : '';
  const contentType = typeof record.contentType === 'string' ? record.contentType.trim() : '';
  const rewardId = typeof record.rewardId === 'string' ? record.rewardId.trim() : '';
  const artKind = record.artKind === 'animated' ? 'animated' : record.artKind === 'static' ? 'static' : null;
  const catalogVersionMs =
    typeof record.catalogVersionMs === 'number' && Number.isFinite(record.catalogVersionMs)
      ? record.catalogVersionMs
      : null;

  if (
    !quiltBlobId ||
    !patchId ||
    !aggregatorBase ||
    !contentHash ||
    !contentType ||
    !rewardId ||
    !artKind ||
    catalogVersionMs === null
  ) {
    return null;
  }

  return {
    kind: 'walrus-quilt-patch',
    quiltBlobId,
    patchId,
    aggregatorBase,
    contentHash,
    contentType,
    rewardId,
    artKind,
    catalogVersionMs,
  };
}

function normalizeSliceInsets(
  value: unknown,
  fallback: ChatBorderSliceInsets
): ChatBorderSliceInsets {
  if (!value || typeof value !== 'object') {
    return { ...fallback };
  }

  const record = value as Record<string, unknown>;

  return {
    top: typeof record.top === 'number' && Number.isFinite(record.top) ? record.top : fallback.top,
    right:
      typeof record.right === 'number' && Number.isFinite(record.right)
        ? record.right
        : fallback.right,
    bottom:
      typeof record.bottom === 'number' && Number.isFinite(record.bottom)
        ? record.bottom
        : fallback.bottom,
    left:
      typeof record.left === 'number' && Number.isFinite(record.left) ? record.left : fallback.left,
  };
}

function normalizeCondition(value: unknown): ChatOverlayUnlockCondition {
  if (!value || typeof value !== 'object') {
    return { type: 'verified' };
  }

  const record = value as Record<string, unknown>;

  if (record.type === 'tier-min') {
    const tier =
      record.tier === 'Elite' || record.tier === 'Pro' || record.tier === 'Adventurer'
        ? record.tier
        : 'Adventurer';

    return { type: 'tier-min', tier };
  }

  if (record.type === 'official-grant') {
    return {
      type: 'official-grant',
      memberIds: Array.isArray(record.memberIds)
        ? record.memberIds.filter((entry): entry is string => typeof entry === 'string')
        : [],
    };
  }

  return { type: 'verified' };
}

function normalizeAccent(value: unknown): OfficialChatOverlayReward['accent'] {
  if (value === 'gold' || value === 'violet' || value === 'mint') {
    return value;
  }

  return 'cyan';
}

function normalizeMotion(value: unknown): OfficialChatOverlayReward['motion'] {
  return value === 'premium-loop' ? 'premium-loop' : 'static';
}

function normalizeReward(value: unknown): OfficialChatOverlayReward | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = safeRewardId(typeof record.id === 'string' ? record.id : '');

  if (!id) {
    return null;
  }

  return {
    id,
    name: typeof record.name === 'string' && record.name.trim() ? record.name.trim() : 'Untitled overlay',
    description: typeof record.description === 'string' ? record.description.trim() : '',
    borderStyle:
      typeof record.borderStyle === 'string' && record.borderStyle.trim()
        ? record.borderStyle.trim()
        : 'signal-glow',
    motion: normalizeMotion(record.motion),
    accent: normalizeAccent(record.accent),
    staticArtUrl:
      typeof record.staticArtUrl === 'string' && record.staticArtUrl.trim()
        ? record.staticArtUrl.trim()
        : null,
    animatedArtUrl:
      typeof record.animatedArtUrl === 'string' && record.animatedArtUrl.trim()
        ? record.animatedArtUrl.trim()
        : null,
    staticArtRef: normalizeWalrusQuiltPatchRef(record.staticArtRef),
    animatedArtRef: normalizeWalrusQuiltPatchRef(record.animatedArtRef),
    artSliceInsets: normalizeSliceInsets(record.artSliceInsets, DEFAULT_SLICE),
    displayWidths: normalizeSliceInsets(record.displayWidths, DEFAULT_DISPLAY),
    condition: normalizeCondition(record.condition),
    enabled: record.enabled !== false,
    updatedAtMs:
      typeof record.updatedAtMs === 'number' && Number.isFinite(record.updatedAtMs)
        ? record.updatedAtMs
        : Date.now(),
  };
}

function sanitizeRewards(value: unknown): OfficialChatOverlayReward[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeReward(entry))
    .filter((entry): entry is OfficialChatOverlayReward => entry !== null)
    .slice(0, MAX_REWARD_COUNT);
}

async function readProjection(): Promise<ChatOverlayRewardsProjection> {
  const stored = await readJsonFile<ChatOverlayRewardsProjection>(PROJECTION_PATH, emptyProjection());
  const rewards = sanitizeRewards(stored.rewards);

  if (rewards.length > 0) {
    return {
      rewards,
      updatedAtMs: typeof stored.updatedAtMs === 'number' ? stored.updatedAtMs : Date.now(),
      catalogAttestation: normalizeCatalogAttestation(stored.catalogAttestation),
    };
  }

  const seeded: ChatOverlayRewardsProjection = {
    rewards: buildDefaultChatOverlayRewards(),
    updatedAtMs: Date.now(),
  };

  await writeProjection(seeded);
  return seeded;
}

async function writeProjection(projection: ChatOverlayRewardsProjection): Promise<void> {
  await writeJsonFile(PROJECTION_PATH, {
    rewards: projection.rewards,
    updatedAtMs: Date.now(),
    ...(projection.catalogAttestation ? { catalogAttestation: projection.catalogAttestation } : {}),
  });
}

function decodeDataUrl(value: string): { contentType: string; bytes: Buffer } | null {
  const match = value.trim().match(DATA_URL_PATTERN);
  const contentType = match?.[1];
  const dataBase64 = match?.[2];

  if (!contentType || !dataBase64) {
    return null;
  }

  return {
    contentType,
    bytes: Buffer.from(dataBase64, 'base64'),
  };
}

function prepareArtSlot(input: {
  owner: string;
  rewardId: string;
  artKind: 'static' | 'animated';
  value: string | null;
  existingUrl: string | null;
  existingRef: WalrusQuiltPatchRef | null;
  catalogVersionMs: number;
}): ArtSlotDraft {
  if (!input.value) {
    return {
      url: null,
      ref: null,
      stagedPatch: null,
      renderUpload: null,
    };
  }

  const trimmed = input.value.trim();

  if (!trimmed) {
    return {
      url: null,
      ref: null,
      stagedPatch: null,
      renderUpload: null,
    };
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const preserveRef =
      input.existingUrl?.trim() === trimmed && input.existingRef ? input.existingRef : input.existingRef;

    return {
      url: trimmed,
      ref: preserveRef ?? null,
      stagedPatch: null,
      renderUpload: null,
    };
  }

  const decoded = decodeDataUrl(trimmed);

  if (!decoded) {
    throw new Error('invalid_art_value');
  }

  if (decoded.bytes.byteLength === 0) {
    throw new Error('invalid_file_size');
  }

  assertBorderArtCanvasDimensions(decoded.bytes, decoded.contentType);

  if (isWalrusBorderArtEnabled() || config.walrus.borderArtRequired) {
    return {
      url: null,
      ref: null,
      stagedPatch: {
        rewardId: input.rewardId,
        artKind: input.artKind,
        contentType: decoded.contentType,
        bytes: decoded.bytes,
        contentHash: sha256Hex(decoded.bytes),
        owner: input.owner,
        catalogVersionMs: input.catalogVersionMs,
      },
      renderUpload: null,
    };
  }

  return {
    url: null,
    ref: null,
    stagedPatch: null,
    renderUpload: {
      owner: input.owner,
      rewardId: input.rewardId,
      artKind: input.artKind,
      contentType: decoded.contentType,
      dataBase64: decoded.bytes.toString('base64'),
    },
  };
}

function patchKey(rewardId: string, artKind: 'static' | 'animated'): string {
  return rewardId + ':' + artKind;
}

async function finalizeArtSlot(draft: ArtSlotDraft): Promise<{
  url: string | null;
  ref: WalrusQuiltPatchRef | null;
}> {
  if (draft.renderUpload) {
    const uploaded = await saveBorderArtUpload(draft.renderUpload);

    return {
      url: uploaded.url,
      ref: null,
    };
  }

  return {
    url: draft.url,
    ref: draft.ref,
  };
}

export async function getChatOverlayRewardsCatalog(): Promise<ChatOverlayRewardsProjection> {
  return readProjection();
}

export type BorderArtCatalogQuiltSnapshot = {
  quiltBlobId: string | null;
  catalogVersionMs: number | null;
  patchCount: number;
  lastPublishMs: number | null;
  attestationStatus: ChatOverlayCatalogAttestation['status'] | null;
  attestationTxDigest: string | null;
};

export async function readBorderArtCatalogQuiltSnapshot(): Promise<BorderArtCatalogQuiltSnapshot> {
  const projection = await readProjection();
  let quiltBlobId: string | null = null;
  let catalogVersionMs: number | null = null;
  let patchCount = 0;
  let lastPublishMs: number | null =
    typeof projection.updatedAtMs === 'number' ? projection.updatedAtMs : null;

  for (const reward of projection.rewards) {
    for (const ref of [reward.staticArtRef, reward.animatedArtRef]) {
      if (!ref?.patchId) {
        continue;
      }

      patchCount += 1;

      if (catalogVersionMs === null || ref.catalogVersionMs >= catalogVersionMs) {
        catalogVersionMs = ref.catalogVersionMs;
        quiltBlobId = ref.quiltBlobId;
      }
    }
  }

  const attestation = normalizeCatalogAttestation(projection.catalogAttestation);

  return {
    quiltBlobId,
    catalogVersionMs,
    patchCount,
    lastPublishMs,
    attestationStatus: attestation?.status ?? null,
    attestationTxDigest: attestation?.txDigest ?? null,
  };
}

const LEGACY_BORDER_ART_URL_PATTERN =
  /\/api\/media\/files\/(0x[a-f0-9]+)\/([^/?#]+)/i;

export function isLegacyRenderBorderArtUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) {
    return false;
  }

  const trimmed = url.trim();

  return (
    LEGACY_BORDER_ART_URL_PATTERN.test(trimmed) && /border-art-/i.test(trimmed)
  );
}

function bytesToDataUrl(contentType: string, bytes: Buffer): string {
  return 'data:' + contentType + ';base64,' + bytes.toString('base64');
}

export async function loadLegacyBorderArtBytes(
  url: string
): Promise<{ contentType: string; bytes: Buffer } | null> {
  const trimmed = url.trim();
  const match = trimmed.match(LEGACY_BORDER_ART_URL_PATTERN);

  if (match?.[1] && match[2]) {
    const file = await readUploadedMediaFile(match[1], decodeURIComponent(match[2]));

    if (file) {
      return {
        contentType: file.contentType,
        bytes: file.buffer,
      };
    }
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return null;
  }

  try {
    const response = await fetch(trimmed);

    if (!response.ok) {
      return null;
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? 'application/octet-stream';

    return {
      contentType,
      bytes,
    };
  } catch {
    return null;
  }
}

export type BorderArtMigrationSlotReport = {
  rewardId: string;
  artKind: 'static' | 'animated';
  status: 'skipped' | 'migrated' | 'missing' | 'failed';
  detail?: string;
};

export type BorderArtMigrationReport = {
  owner: string;
  catalogVersionMs: number;
  migratedCount: number;
  slots: BorderArtMigrationSlotReport[];
};

export async function migrateChatOverlayRewardsToWalrus(
  owner: string
): Promise<{ catalog: ChatOverlayRewardsProjection; report: BorderArtMigrationReport }> {
  if (!owner.startsWith('0x')) {
    throw new Error('invalid_owner');
  }

  if (!isWalrusBorderArtEnabled()) {
    throw new Error('walrus_not_configured');
  }

  const projection = await readProjection();
  const catalogVersionMs = Date.now();
  const slots: BorderArtMigrationSlotReport[] = [];
  const rewardsForSync: OfficialChatOverlayReward[] = [];

  for (const reward of projection.rewards) {
    const nextReward: OfficialChatOverlayReward = { ...reward };

    for (const artKind of ['static', 'animated'] as const) {
      const ref = artKind === 'static' ? reward.staticArtRef : reward.animatedArtRef;
      const url = artKind === 'static' ? reward.staticArtUrl : reward.animatedArtUrl;

      if (ref?.patchId) {
        slots.push({
          rewardId: reward.id,
          artKind,
          status: 'skipped',
          detail: 'already on Walrus',
        });
        continue;
      }

      if (!url?.trim()) {
        slots.push({
          rewardId: reward.id,
          artKind,
          status: 'skipped',
          detail: 'no art',
        });
        continue;
      }

      if (isWalrusAggregatorUrl(url)) {
        slots.push({
          rewardId: reward.id,
          artKind,
          status: 'skipped',
          detail: 'aggregator URL already set',
        });
        continue;
      }

      const loaded = await loadLegacyBorderArtBytes(url);

      if (!loaded || loaded.bytes.byteLength === 0) {
        slots.push({
          rewardId: reward.id,
          artKind,
          status: 'missing',
          detail: 'could not load legacy bytes',
        });
        continue;
      }

      try {
        assertBorderArtCanvasDimensions(loaded.bytes, loaded.contentType);
        const dataUrl = bytesToDataUrl(loaded.contentType, loaded.bytes);

        if (artKind === 'static') {
          nextReward.staticArtUrl = dataUrl;
        } else {
          nextReward.animatedArtUrl = dataUrl;
        }

        slots.push({
          rewardId: reward.id,
          artKind,
          status: 'migrated',
        });
      } catch (error) {
        slots.push({
          rewardId: reward.id,
          artKind,
          status: 'failed',
          detail: error instanceof Error ? error.message : 'invalid_art_dimensions',
        });
      }
    }

    rewardsForSync.push(nextReward);
  }

  const catalog = await syncChatOverlayRewardsCatalog({
    owner,
    rewards: rewardsForSync,
  });

  return {
    catalog,
    report: {
      owner,
      catalogVersionMs,
      migratedCount: slots.filter((slot) => slot.status === 'migrated').length,
      slots,
    },
  };
}

function isWalrusAggregatorUrl(url: string): boolean {
  const trimmed = url.trim();

  return (
    /\/v1\/blobs\/by-quilt-patch-id\//i.test(trimmed) ||
    /aggregator\.walrus/i.test(trimmed) ||
    /\.walrus\.space/i.test(trimmed)
  );
}

export async function syncChatOverlayRewardsCatalog(input: {
  owner: string;
  rewards: unknown[];
}): Promise<ChatOverlayRewardsProjection> {
  const existingProjection = await readProjection();
  const existingById = new Map(existingProjection.rewards.map((reward) => [reward.id, reward]));
  const normalized = sanitizeRewards(input.rewards);
  const catalogVersionMs = Date.now();

  const drafts: Array<{
    reward: OfficialChatOverlayReward;
    staticDraft: ArtSlotDraft;
    animatedDraft: ArtSlotDraft;
  }> = [];

  const stagedPatches: BorderArtQuiltPatchInput[] = [];

  for (const reward of normalized) {
    const existing = existingById.get(reward.id);

    const staticDraft = prepareArtSlot({
      owner: input.owner,
      rewardId: reward.id,
      artKind: 'static',
      value: reward.staticArtUrl,
      existingUrl: existing?.staticArtUrl ?? null,
      existingRef: reward.staticArtRef ?? existing?.staticArtRef ?? null,
      catalogVersionMs,
    });
    const animatedDraft = prepareArtSlot({
      owner: input.owner,
      rewardId: reward.id,
      artKind: 'animated',
      value: reward.animatedArtUrl,
      existingUrl: existing?.animatedArtUrl ?? null,
      existingRef: reward.animatedArtRef ?? existing?.animatedArtRef ?? null,
      catalogVersionMs,
    });

    if (staticDraft.stagedPatch) {
      stagedPatches.push(staticDraft.stagedPatch);
    }

    if (animatedDraft.stagedPatch) {
      stagedPatches.push(animatedDraft.stagedPatch);
    }

    drafts.push({ reward, staticDraft, animatedDraft });
  }

  const publishedByKey = new Map<string, { url: string; ref: WalrusQuiltPatchRef }>();
  let publishedQuiltBlobId: string | null = null;

  if (stagedPatches.length > 0) {
    if (config.walrus.borderArtRequired && !isWalrusBorderArtEnabled()) {
      throw new Error('quilt_publish_failed');
    }

    if (isWalrusBorderArtEnabled()) {
      const publishResult = await publishBorderArtQuilt(stagedPatches, config.walrus);
      publishedQuiltBlobId = publishResult.quiltBlobId;

      for (const patch of publishResult.patches) {
        publishedByKey.set(patchKey(patch.rewardId, patch.artKind), {
          url: patch.aggregatorUrl,
          ref: patch.ref,
        });
      }
    }
  }

  const resolvedRewards: OfficialChatOverlayReward[] = [];

  for (const entry of drafts) {
    const staticResolved = entry.staticDraft.stagedPatch
      ? (publishedByKey.get(patchKey(entry.reward.id, 'static')) ?? null)
      : await finalizeArtSlot(entry.staticDraft);
    const animatedResolved = entry.animatedDraft.stagedPatch
      ? (publishedByKey.get(patchKey(entry.reward.id, 'animated')) ?? null)
      : await finalizeArtSlot(entry.animatedDraft);

    if (entry.staticDraft.stagedPatch && !staticResolved) {
      throw new Error('quilt_publish_failed');
    }

    if (entry.animatedDraft.stagedPatch && !animatedResolved) {
      throw new Error('quilt_publish_failed');
    }

    resolvedRewards.push({
      ...entry.reward,
      staticArtUrl: staticResolved?.url ?? null,
      animatedArtUrl: animatedResolved?.url ?? null,
      staticArtRef: staticResolved?.ref ?? null,
      animatedArtRef: animatedResolved?.ref ?? null,
      updatedAtMs: Date.now(),
    });
  }

  let catalogAttestation = existingProjection.catalogAttestation ?? null;

  if (publishedQuiltBlobId) {
    catalogAttestation = await publishChatOverlayCatalogAttestation({
      owner: input.owner,
      catalogVersionMs,
      quiltBlobId: publishedQuiltBlobId,
      rewards: resolvedRewards,
    });
  }

  const projection: ChatOverlayRewardsProjection = {
    rewards: resolvedRewards,
    updatedAtMs: Date.now(),
    catalogAttestation,
  };

  await writeProjection(projection);
  return projection;
}