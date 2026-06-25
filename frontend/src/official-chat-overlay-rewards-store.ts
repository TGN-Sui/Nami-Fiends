import { useSyncExternalStore } from 'react';

import {
  CHAT_BORDER_ART_SLICE_DEFAULTS,
  CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS,
  normalizeChatBorderSliceInsets,
  type ChatBorderSliceInsets,
} from './chat-border-art-specs.js';

export const CHAT_OVERLAY_BORDER_STYLES = [
  'signal-glow',
  'wave-frame',
  'pulse-ring',
  'genesis-spark',
] as const;

export type ChatOverlayBorderStyle = (typeof CHAT_OVERLAY_BORDER_STYLES)[number];

const LEGACY_SLOT_TO_BORDER_STYLE: Record<string, ChatOverlayBorderStyle> = {
  'bottom-right': 'signal-glow',
  'top-left': 'wave-frame',
  'top-right': 'pulse-ring',
  'bottom-left': 'genesis-spark',
};

export type ChatOverlayMotion = 'static' | 'premium-loop';

export type ChatOverlayUnlockCondition =
  | { type: 'tier-min'; tier: 'Adventurer' | 'Pro' | 'Elite' }
  | { type: 'verified' }
  | { type: 'official-grant'; memberIds: string[] };

export type OfficialChatOverlayReward = {
  id: string;
  name: string;
  description: string;
  borderStyle: ChatOverlayBorderStyle;
  motion: ChatOverlayMotion;
  accent: 'cyan' | 'gold' | 'violet' | 'mint';
  staticArtUrl: string | null;
  animatedArtUrl: string | null;
  artSliceInsets: ChatBorderSliceInsets;
  displayWidths: ChatBorderSliceInsets;
  condition: ChatOverlayUnlockCondition;
  enabled: boolean;
  updatedAtMs: number;
};

const STORAGE_KEY = 'nami.official.chat-overlay-rewards';

const DEFAULT_REWARDS: OfficialChatOverlayReward[] = [
  {
    id: 'overlay-signal-glow',
    name: 'Signal Glow',
    description: 'Verified members earn a soft cyan glow on chat bubbles.',
    borderStyle: 'signal-glow',
    motion: 'static',
    accent: 'cyan',
    staticArtUrl: null,
    animatedArtUrl: null,
    artSliceInsets: { ...CHAT_BORDER_ART_SLICE_DEFAULTS },
    displayWidths: { ...CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS },
    condition: { type: 'verified' },
    enabled: true,
    updatedAtMs: 0,
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
    artSliceInsets: { ...CHAT_BORDER_ART_SLICE_DEFAULTS },
    displayWidths: { ...CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS },
    condition: { type: 'tier-min', tier: 'Pro' },
    enabled: true,
    updatedAtMs: 0,
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
    artSliceInsets: { ...CHAT_BORDER_ART_SLICE_DEFAULTS },
    displayWidths: { ...CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS },
    condition: { type: 'tier-min', tier: 'Elite' },
    enabled: true,
    updatedAtMs: 0,
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
    artSliceInsets: { ...CHAT_BORDER_ART_SLICE_DEFAULTS },
    displayWidths: { ...CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS },
    condition: { type: 'official-grant', memberIds: [] },
    enabled: true,
    updatedAtMs: 0,
  },
];

let cachedRewards: OfficialChatOverlayReward[] | null = null;

function dispatchChange(): void {
  cachedRewards = null;
  window.dispatchEvent(new CustomEvent('nami-official-chat-overlay-rewards-changed'));
}

function normalizeBorderStyle(
  value: string | undefined,
  legacySlot?: string
): ChatOverlayBorderStyle {
  if (value && CHAT_OVERLAY_BORDER_STYLES.includes(value as ChatOverlayBorderStyle)) {
    return value as ChatOverlayBorderStyle;
  }

  if (legacySlot && legacySlot in LEGACY_SLOT_TO_BORDER_STYLE) {
    return LEGACY_SLOT_TO_BORDER_STYLE[legacySlot]!;
  }

  return 'signal-glow';
}

function normalizeMotion(value: string | undefined): ChatOverlayMotion {
  return value === 'premium-loop' ? 'premium-loop' : 'static';
}

function normalizeAccent(value: string | undefined): OfficialChatOverlayReward['accent'] {
  if (value === 'gold' || value === 'violet' || value === 'mint') {
    return value;
  }

  return 'cyan';
}

function normalizeCondition(value: Partial<ChatOverlayUnlockCondition> | undefined): ChatOverlayUnlockCondition {
  if (value?.type === 'tier-min') {
    const tier =
      value.tier === 'Elite' || value.tier === 'Pro' || value.tier === 'Adventurer'
        ? value.tier
        : 'Adventurer';

    return { type: 'tier-min', tier };
  }

  if (value?.type === 'official-grant') {
    return {
      type: 'official-grant',
      memberIds: Array.isArray(value.memberIds)
        ? value.memberIds.filter((entry): entry is string => typeof entry === 'string')
        : [],
    };
  }

  return { type: 'verified' };
}

function normalizeReward(value: Partial<OfficialChatOverlayReward>): OfficialChatOverlayReward | null {
  const id = value.id?.trim();

  if (!id) {
    return null;
  }

  return {
    id,
    name: value.name?.trim() || 'Untitled overlay',
    description: value.description?.trim() || '',
    borderStyle: normalizeBorderStyle(
      value.borderStyle,
      typeof (value as { slot?: string }).slot === 'string'
        ? (value as { slot?: string }).slot
        : undefined
    ),
    motion: normalizeMotion(value.motion),
    accent: normalizeAccent(value.accent),
    staticArtUrl: typeof value.staticArtUrl === 'string' && value.staticArtUrl.trim() ? value.staticArtUrl : null,
    animatedArtUrl:
      typeof value.animatedArtUrl === 'string' && value.animatedArtUrl.trim()
        ? value.animatedArtUrl
        : null,
    artSliceInsets: normalizeChatBorderSliceInsets(
      value.artSliceInsets,
      CHAT_BORDER_ART_SLICE_DEFAULTS
    ),
    displayWidths: normalizeChatBorderSliceInsets(
      value.displayWidths,
      CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS
    ),
    condition: normalizeCondition(value.condition),
    enabled: value.enabled !== false,
    updatedAtMs: typeof value.updatedAtMs === 'number' ? value.updatedAtMs : Date.now(),
  };
}

export function readOfficialChatOverlayRewards(): OfficialChatOverlayReward[] {
  if (cachedRewards) {
    return cachedRewards;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      cachedRewards = DEFAULT_REWARDS.map((reward) => ({ ...reward }));
      return cachedRewards;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      cachedRewards = DEFAULT_REWARDS.map((reward) => ({ ...reward }));
      return cachedRewards;
    }

    const normalized = parsed
      .map((entry) => normalizeReward(entry as Partial<OfficialChatOverlayReward>))
      .filter((entry): entry is OfficialChatOverlayReward => entry !== null);

    cachedRewards = normalized.length > 0 ? normalized : DEFAULT_REWARDS.map((reward) => ({ ...reward }));
    return cachedRewards;
  } catch {
    cachedRewards = DEFAULT_REWARDS.map((reward) => ({ ...reward }));
    return cachedRewards;
  }
}

export function saveOfficialChatOverlayRewards(
  rewards: OfficialChatOverlayReward[]
): OfficialChatOverlayReward[] {
  const next = rewards
    .map((reward) =>
      normalizeReward({
        ...reward,
        updatedAtMs: Date.now(),
      })
    )
    .filter((entry): entry is OfficialChatOverlayReward => entry !== null);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cachedRewards = next;
  dispatchChange();

  return next;
}

export function upsertOfficialChatOverlayReward(
  reward: Omit<OfficialChatOverlayReward, 'updatedAtMs'> & { updatedAtMs?: number }
): OfficialChatOverlayReward {
  const normalized = normalizeReward({
    ...reward,
    updatedAtMs: reward.updatedAtMs ?? Date.now(),
  });

  if (!normalized) {
    throw new Error('Invalid overlay reward');
  }

  const rewards = readOfficialChatOverlayRewards();
  const index = rewards.findIndex((entry) => entry.id === normalized.id);
  const next =
    index >= 0
      ? rewards.map((entry, entryIndex) => (entryIndex === index ? normalized : entry))
      : [...rewards, normalized];

  saveOfficialChatOverlayRewards(next);
  return normalized;
}

export function removeOfficialChatOverlayReward(rewardId: string): void {
  saveOfficialChatOverlayRewards(readOfficialChatOverlayRewards().filter((entry) => entry.id !== rewardId));
}

function subscribe(listener: () => void): () => void {
  function onChange(): void {
    cachedRewards = null;
    listener();
  }

  window.addEventListener('nami-official-chat-overlay-rewards-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-official-chat-overlay-rewards-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useOfficialChatOverlayRewards(): OfficialChatOverlayReward[] {
  return useSyncExternalStore(subscribe, readOfficialChatOverlayRewards, readOfficialChatOverlayRewards);
}

export function resetOfficialChatOverlayRewardsForTests(): void {
  cachedRewards = null;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}