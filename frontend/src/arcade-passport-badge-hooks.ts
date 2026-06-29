import { useSyncExternalStore } from 'react';

import { ARCADE_ALLEY_PUSH_GAME_ID } from './arcade-alley-push-game.js';
import {
  readMemberArcadeAlleyPushPassportStats,
  type MemberArcadeAlleyPushPassportStats,
} from './arcade-alley-push-game-store.js';
import { ARCADE_BRICKED_UP_GAME_ID } from './arcade-bricked-up-game.js';
import {
  readMemberArcadeBrickedUpPassportStats,
  type MemberArcadeBrickedUpPassportStats,
} from './arcade-bricked-up-game-store.js';
import { ARCADE_BUBBLE_GAME_ID } from './arcade-bubble-game.js';
import {
  readMemberArcadeBubblePassportStats,
  type MemberArcadeBubblePassportStats,
} from './arcade-bubble-game-store.js';
import { ARCADE_DROP_WINDOW_GAME_ID } from './arcade-drop-window-game.js';
import {
  readMemberArcadeDropWindowPassportStats,
  type MemberArcadeDropWindowPassportStats,
} from './arcade-drop-window-game-store.js';
import { ARCADE_STASH_DEFENSE_GAME_ID } from './arcade-stash-defense-game.js';
import {
  readMemberArcadeStashDefensePassportStats,
  type MemberArcadeStashDefensePassportStats,
} from './arcade-stash-defense-game-store.js';
import { ARCADE_GOB_MARKET_GAME_ID } from './arcade-gob-market-game.js';
import {
  readMemberArcadeGobMarketPassportStats,
  type MemberArcadeGobMarketPassportStats,
} from './arcade-gob-market-game-store.js';
import { ARCADE_INTEL_STACK_GAME_ID } from './arcade-intel-stack-game.js';
import {
  readMemberArcadeIntelStackPassportStats,
  type MemberArcadeIntelStackPassportStats,
} from './arcade-intel-stack-game-store.js';
import { ARCADE_STEALTH_GOON_GAME_ID } from './arcade-stealth-goon-game.js';
import {
  readMemberArcadeStealthGoonPassportStats,
  type MemberArcadeStealthGoonPassportStats,
} from './arcade-stealth-goon-game-store.js';
import { ARCADE_SKILL_DIFF_MODE } from './arcade-skill-diff.js';
import type { CollectedBadge } from './global-chats.js';

export const ARCADE_PASSPORT_BADGES_KEY = 'nami.arcade-badge-grants';

export type ArcadePassportBadgeGrant = {
  memberId: string;
  badgeId: string;
  badgeLabel: string;
  grantedAtMs: number;
};

export type ArcadePassportBadgeRarity = CollectedBadge['rarity'];

export type ArcadePassportBadgeDefinition = {
  id: string;
  label: string;
  rarity: ArcadePassportBadgeRarity;
  check: (context: ArcadePassportBadgeEvaluationContext) => boolean;
};

export type ArcadePassportBadgeEvaluationContext = {
  memberId: string;
  gameId: string;
  mode: string;
  score: number;
  isPersonalBest: boolean;
  bubble: MemberArcadeBubblePassportStats;
  alley: MemberArcadeAlleyPushPassportStats;
  stash: MemberArcadeStashDefensePassportStats;
  drop: MemberArcadeDropWindowPassportStats;
  bricked: MemberArcadeBrickedUpPassportStats;
  stealth: MemberArcadeStealthGoonPassportStats;
  gob: MemberArcadeGobMarketPassportStats;
  intel: MemberArcadeIntelStackPassportStats;
  totalGamesPlayed: number;
};

export const ARCADE_PASSPORT_BADGE_DEFINITIONS: ArcadePassportBadgeDefinition[] = [
  {
    id: 'goon-pop-debut',
    label: 'Goon Pop Debut',
    rarity: 'common',
    check: ({ gameId, bubble }) =>
      gameId === ARCADE_BUBBLE_GAME_ID &&
      bubble.normalGamesPlayed + bubble.hardGamesPlayed + bubble.skillGamesPlayed >= 1,
  },
  {
    id: 'alley-pass-debut',
    label: 'Alley Pass Debut',
    rarity: 'common',
    check: ({ gameId, alley }) =>
      gameId === ARCADE_ALLEY_PUSH_GAME_ID &&
      alley.streetGamesPlayed + alley.heatGamesPlayed + alley.skillGamesPlayed >= 1,
  },
  {
    id: 'stash-guard-debut',
    label: 'Stash Guard Debut',
    rarity: 'common',
    check: ({ gameId, stash }) =>
      gameId === ARCADE_STASH_DEFENSE_GAME_ID &&
      stash.watchGamesPlayed + stash.siegeGamesPlayed + stash.skillGamesPlayed >= 1,
  },
  {
    id: 'signal-catcher-debut',
    label: 'Signal Catcher Debut',
    rarity: 'common',
    check: ({ gameId, drop }) =>
      gameId === ARCADE_DROP_WINDOW_GAME_ID &&
      drop.cleanGamesPlayed + drop.stormGamesPlayed + drop.skillGamesPlayed >= 1,
  },
  {
    id: 'wall-breaker-debut',
    label: 'Wall Breaker Debut',
    rarity: 'common',
    check: ({ gameId, bricked }) =>
      gameId === ARCADE_BRICKED_UP_GAME_ID &&
      bricked.streetGamesPlayed + bricked.heatGamesPlayed + bricked.skillGamesPlayed >= 1,
  },
  {
    id: 'stealth-chain-debut',
    label: 'Stealth Chain Debut',
    rarity: 'common',
    check: ({ gameId, stealth }) =>
      gameId === ARCADE_STEALTH_GOON_GAME_ID &&
      stealth.lowProfileGamesPlayed + stealth.heatPatrolGamesPlayed + stealth.skillGamesPlayed >= 1,
  },
  {
    id: 'gob-market-debut',
    label: 'Gob Market Debut',
    rarity: 'common',
    check: ({ gameId, gob }) =>
      gameId === ARCADE_GOB_MARKET_GAME_ID &&
      gob.guestListGamesPlayed + gob.vipFloorGamesPlayed + gob.skillGamesPlayed >= 1,
  },
  {
    id: 'intel-stack-debut',
    label: 'Intel Stack Debut',
    rarity: 'common',
    check: ({ gameId, intel }) =>
      gameId === ARCADE_INTEL_STACK_GAME_ID &&
      intel.cleanStackGamesPlayed + intel.surgeStackGamesPlayed + intel.skillGamesPlayed >= 1,
  },
  {
    id: 'skill-diff-survivor',
    label: 'Skill Diff Survivor',
    rarity: 'rare',
    check: ({ mode, score }) => mode === ARCADE_SKILL_DIFF_MODE && score > 0,
  },
  {
    id: 'crew-record',
    label: 'Crew Record',
    rarity: 'epic',
    check: ({ isPersonalBest, score }) => isPersonalBest && score > 0,
  },
  {
    id: 'glow-ghoster',
    label: 'Glow Ghoster',
    rarity: 'rare',
    check: ({ bubble }) => bubble.totalBubblesPopped >= 50,
  },
  {
    id: 'brick-smasher',
    label: 'Brick Smasher',
    rarity: 'rare',
    check: ({ bricked }) => bricked.totalBricksBroken >= 50,
  },
  {
    id: 'squad-linker',
    label: 'Squad Linker',
    rarity: 'rare',
    check: ({ stealth }) => stealth.totalLinksCollected >= 25,
  },
  {
    id: 'list-clearer',
    label: 'List Clearer',
    rarity: 'rare',
    check: ({ gob }) => gob.totalTokensCollected >= 25,
  },
  {
    id: 'signal-architect',
    label: 'Signal Architect',
    rarity: 'rare',
    check: ({ intel }) => intel.totalPerfectStacks >= 12,
  },
  {
    id: 'arcade-regular',
    label: 'Arcade Regular',
    rarity: 'epic',
    check: ({ totalGamesPlayed }) => totalGamesPlayed >= 10,
  },
];

const listeners = new Set<() => void>();
let storeVersion = 0;

function emit(): void {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new CustomEvent('nami-arcade-badge-grants-changed'));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function isValidGrant(entry: unknown): entry is ArcadePassportBadgeGrant {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  const grant = entry as Partial<ArcadePassportBadgeGrant>;

  return (
    typeof grant.memberId === 'string' &&
    typeof grant.badgeId === 'string' &&
    typeof grant.badgeLabel === 'string' &&
    typeof grant.grantedAtMs === 'number'
  );
}

export function readArcadePassportBadgeGrants(): ArcadePassportBadgeGrant[] {
  try {
    const stored = window.localStorage.getItem(ARCADE_PASSPORT_BADGES_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isValidGrant);
  } catch {
    return [];
  }
}

function writeArcadePassportBadgeGrants(grants: ArcadePassportBadgeGrant[]): void {
  window.localStorage.setItem(ARCADE_PASSPORT_BADGES_KEY, JSON.stringify(grants));
  emit();
}

export function readMemberArcadePassportBadgeGrants(memberId: string): ArcadePassportBadgeGrant[] {
  return readArcadePassportBadgeGrants().filter((grant) => grant.memberId === memberId);
}

export function readMemberArcadePassportBadgeLabels(memberId: string): string[] {
  return readMemberArcadePassportBadgeGrants(memberId).map((grant) => grant.badgeLabel);
}

export function hasArcadePassportBadge(memberId: string, badgeId: string): boolean {
  return readMemberArcadePassportBadgeGrants(memberId).some((grant) => grant.badgeId === badgeId);
}

export function grantArcadePassportBadge(
  memberId: string,
  badgeId: string,
  badgeLabel: string,
  grantedAtMs = Date.now(),
): { ok: true } | { ok: false; reason: 'already-owned' } {
  if (hasArcadePassportBadge(memberId, badgeId)) {
    return { ok: false, reason: 'already-owned' };
  }

  writeArcadePassportBadgeGrants([
    ...readArcadePassportBadgeGrants(),
    { memberId, badgeId, badgeLabel, grantedAtMs },
  ]);

  return { ok: true };
}

function countGamesPlayed(stats: {
  normalGamesPlayed?: number;
  hardGamesPlayed?: number;
  skillGamesPlayed?: number;
  streetGamesPlayed?: number;
  heatGamesPlayed?: number;
  watchGamesPlayed?: number;
  siegeGamesPlayed?: number;
  cleanGamesPlayed?: number;
  stormGamesPlayed?: number;
  lowProfileGamesPlayed?: number;
  heatPatrolGamesPlayed?: number;
  guestListGamesPlayed?: number;
  vipFloorGamesPlayed?: number;
  cleanStackGamesPlayed?: number;
  surgeStackGamesPlayed?: number;
}): number {
  return (
    (stats.normalGamesPlayed ?? 0) +
    (stats.hardGamesPlayed ?? 0) +
    (stats.skillGamesPlayed ?? 0) +
    (stats.streetGamesPlayed ?? 0) +
    (stats.heatGamesPlayed ?? 0) +
    (stats.watchGamesPlayed ?? 0) +
    (stats.siegeGamesPlayed ?? 0) +
    (stats.cleanGamesPlayed ?? 0) +
    (stats.stormGamesPlayed ?? 0) +
    (stats.lowProfileGamesPlayed ?? 0) +
    (stats.heatPatrolGamesPlayed ?? 0) +
    (stats.guestListGamesPlayed ?? 0) +
    (stats.vipFloorGamesPlayed ?? 0) +
    (stats.cleanStackGamesPlayed ?? 0) +
    (stats.surgeStackGamesPlayed ?? 0)
  );
}

export function readArcadePassportBadgeEvaluationContext(
  memberId: string,
  gameId: string,
  mode: string,
  score: number,
  isPersonalBest: boolean,
): ArcadePassportBadgeEvaluationContext {
  const bubble = readMemberArcadeBubblePassportStats(memberId);
  const alley = readMemberArcadeAlleyPushPassportStats(memberId);
  const stash = readMemberArcadeStashDefensePassportStats(memberId);
  const drop = readMemberArcadeDropWindowPassportStats(memberId);
  const bricked = readMemberArcadeBrickedUpPassportStats(memberId);
  const stealth = readMemberArcadeStealthGoonPassportStats(memberId);
  const gob = readMemberArcadeGobMarketPassportStats(memberId);
  const intel = readMemberArcadeIntelStackPassportStats(memberId);

  return {
    memberId,
    gameId,
    mode,
    score,
    isPersonalBest,
    bubble,
    alley,
    stash,
    drop,
    bricked,
    stealth,
    gob,
    intel,
    totalGamesPlayed:
      countGamesPlayed(bubble) +
      countGamesPlayed(alley) +
      countGamesPlayed(stash) +
      countGamesPlayed(drop) +
      countGamesPlayed(bricked) +
      countGamesPlayed(stealth) +
      countGamesPlayed(gob) +
      countGamesPlayed(intel),
  };
}

export function evaluateArcadePassportBadges(
  context: ArcadePassportBadgeEvaluationContext,
): ArcadePassportBadgeDefinition[] {
  return ARCADE_PASSPORT_BADGE_DEFINITIONS.filter(
    (definition) => definition.check(context) && !hasArcadePassportBadge(context.memberId, definition.id),
  );
}

export function applyArcadePassportBadgesAfterRun(input: {
  memberId: string;
  gameId: string;
  mode: string;
  score: number;
  isPersonalBest: boolean;
}): ArcadePassportBadgeGrant[] {
  const context = readArcadePassportBadgeEvaluationContext(
    input.memberId,
    input.gameId,
    input.mode,
    input.score,
    input.isPersonalBest,
  );
  const newlyEarned: ArcadePassportBadgeGrant[] = [];

  for (const definition of evaluateArcadePassportBadges(context)) {
    const grant = grantArcadePassportBadge(input.memberId, definition.id, definition.label);

    if (grant.ok) {
      newlyEarned.push({
        memberId: input.memberId,
        badgeId: definition.id,
        badgeLabel: definition.label,
        grantedAtMs: Date.now(),
      });
    }
  }

  return newlyEarned;
}

export function useArcadePassportBadgeGrants(): ArcadePassportBadgeGrant[] {
  return useSyncExternalStore(subscribe, readArcadePassportBadgeGrants, readArcadePassportBadgeGrants);
}

export function resetArcadePassportBadgeGrantsForTests(): void {
  try {
    window.localStorage.removeItem(ARCADE_PASSPORT_BADGES_KEY);
  } catch {
    // Ignore restricted storage environments.
  }

  storeVersion = 0;
}