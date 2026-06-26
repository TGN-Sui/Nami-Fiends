import { config } from '../config.js';
import { readJsonFile, writeJsonFile } from '../storage.js';

import { saveBorderArtUpload } from './media-upload.service.js';

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
  artSliceInsets: ChatBorderSliceInsets;
  displayWidths: ChatBorderSliceInsets;
  condition: ChatOverlayUnlockCondition;
  enabled: boolean;
  updatedAtMs: number;
};

export type ChatOverlayRewardsProjection = {
  rewards: OfficialChatOverlayReward[];
  updatedAtMs: number;
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

function emptyProjection(): ChatOverlayRewardsProjection {
  return {
    rewards: [],
    updatedAtMs: Date.now(),
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
  });
}

async function resolveArtUrl(
  owner: string,
  rewardId: string,
  artKind: 'static' | 'animated',
  value: string | null
): Promise<string | null> {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const match = trimmed.match(DATA_URL_PATTERN);
  const contentType = match?.[1];
  const dataBase64 = match?.[2];

  if (!contentType || !dataBase64) {
    throw new Error('invalid_art_value');
  }

  const uploaded = await saveBorderArtUpload({
    owner,
    rewardId,
    artKind,
    contentType,
    dataBase64,
  });

  return uploaded.url;
}

export async function getChatOverlayRewardsCatalog(): Promise<ChatOverlayRewardsProjection> {
  return readProjection();
}

export async function syncChatOverlayRewardsCatalog(input: {
  owner: string;
  rewards: unknown[];
}): Promise<ChatOverlayRewardsProjection> {
  const normalized = sanitizeRewards(input.rewards);
  const resolvedRewards: OfficialChatOverlayReward[] = [];

  for (const reward of normalized) {
    resolvedRewards.push({
      ...reward,
      staticArtUrl: await resolveArtUrl(input.owner, reward.id, 'static', reward.staticArtUrl),
      animatedArtUrl: await resolveArtUrl(
        input.owner,
        reward.id,
        'animated',
        reward.animatedArtUrl
      ),
      updatedAtMs: Date.now(),
    });
  }

  const projection: ChatOverlayRewardsProjection = {
    rewards: resolvedRewards,
    updatedAtMs: Date.now(),
  };

  await writeProjection(projection);
  return projection;
}