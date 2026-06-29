import { ARCADE_ALLEY_PUSH_GAME_ID } from './arcade-alley-push-game.js';
import { readArcadeAlleyPushHighScore } from './arcade-alley-push-game-store.js';
import { ARCADE_BRICKED_UP_GAME_ID } from './arcade-bricked-up-game.js';
import { readArcadeBrickedUpHighScore } from './arcade-bricked-up-game-store.js';
import { ARCADE_DROP_WINDOW_GAME_ID } from './arcade-drop-window-game.js';
import { readArcadeDropWindowHighScore } from './arcade-drop-window-game-store.js';

import { ARCADE_STASH_DEFENSE_GAME_ID } from './arcade-stash-defense-game.js';
import { readArcadeStashDefenseHighScore } from './arcade-stash-defense-game-store.js';
import { ARCADE_GOB_MARKET_GAME_ID } from './arcade-gob-market-game.js';
import { readArcadeGobMarketHighScore } from './arcade-gob-market-game-store.js';
import { ARCADE_INTEL_STACK_GAME_ID } from './arcade-intel-stack-game.js';
import { readArcadeIntelStackHighScore } from './arcade-intel-stack-game-store.js';
import { ARCADE_STEALTH_GOON_GAME_ID } from './arcade-stealth-goon-game.js';
import { readArcadeStealthGoonHighScore } from './arcade-stealth-goon-game-store.js';
import { ARCADE_BUBBLE_GAME_ID } from './arcade-bubble-game.js';
import { readArcadeBubbleHighScore } from './arcade-bubble-game-store.js';
import type { ArcadeCabinetStageFit } from './arcade-cabinet-stage-fit.js';
import { memberFeatureTier } from './member-access.js';
import type { NamiMember } from './uiMockData.js';
import { DEFAULT_ARCADE_STAGE_BACKGROUND_URL } from './arcade-stage-background.js';

export type ArcadeCabinetTier = 1 | 2 | 3;

export type ArcadeCabinetRequiredMembership = 'Adventurer' | 'Pro' | 'Elite';

export type ArcadeCabinetAccess = 'live' | 'locked' | 'offline';

export type ArcadeCabinetDefinition = {
  id: string;
  gameId: string | null;
  title: string;
  tagline: string;
  releaseLabel: string;
  genre: string;
  cabinetTier: ArcadeCabinetTier;
  requiredMembership: ArcadeCabinetRequiredMembership;
  cabinetAccent: string;
  cabinetGlow: string;
  /** CRT interior fallback when no per-cabinet viewport upload exists. */
  stageFallbackUrl: string;
  stageFit?: Partial<ArcadeCabinetStageFit>;
};

export type ArcadeCabinetView = ArcadeCabinetDefinition & {
  access: ArcadeCabinetAccess;
  highScoreLabel: string;
  accessLabel: string;
};

const MEMBERSHIP_RANK: Record<NamiMember['tier'], number> = {
  NPC: 0,
  Adventurer: 1,
  Pro: 2,
  Elite: 3,
};

const REQUIRED_MEMBERSHIP_RANK: Record<ArcadeCabinetRequiredMembership, number> = {
  Adventurer: 1,
  Pro: 2,
  Elite: 3,
};

export const OFFICIAL_ARCADE_CABINETS: ArcadeCabinetDefinition[] = [
  {
    id: 'goon-pop',
    gameId: ARCADE_BUBBLE_GAME_ID,
    title: 'Goon Pop',
    tagline: 'Pop the glow before it ghosts.',
    releaseLabel: 'Official cabinet · 60 second run',
    genre: 'Action / Arcade',
    cabinetTier: 1,
    requiredMembership: 'Adventurer',
    cabinetAccent: '#75d7ff',
    cabinetGlow: 'rgba(117, 215, 255, 0.52)',
    stageFallbackUrl: DEFAULT_ARCADE_STAGE_BACKGROUND_URL,
    stageFit: {
      scaleX: 1.6,
      scaleY: 1.49,
      offsetX: '3.5%',
      offsetY: '3.5%',
      width: 'min(998px, 85vw)',
    },
  },
  {
    id: 'alley-push',
    gameId: ARCADE_ALLEY_PUSH_GAME_ID,
    title: 'Alley Push',
    tagline: 'Five lanes. One crew pass.',
    releaseLabel: 'Tier 1 cabinet · Alley run',
    genre: 'Cross / Dodge',
    cabinetTier: 1,
    requiredMembership: 'Adventurer',
    cabinetAccent: '#8dffb2',
    cabinetGlow: 'rgba(141, 255, 178, 0.48)',
    stageFallbackUrl: DEFAULT_ARCADE_STAGE_BACKGROUND_URL,
    stageFit: {
      scaleX: 1.6,
      scaleY: 1.49,
      offsetX: '3.5%',
      offsetY: '1.5%',
      width: 'min(998px, 85vw)',
    },
  },
  {
    id: 'stash-defense',
    gameId: ARCADE_STASH_DEFENSE_GAME_ID,
    title: 'Stash Defense',
    tagline: 'Hold the stash. Eat together.',
    releaseLabel: 'Tier 2 cabinet · Defense run',
    genre: 'Defense',
    cabinetTier: 2,
    requiredMembership: 'Pro',
    cabinetAccent: '#ff8da8',
    cabinetGlow: 'rgba(255, 141, 168, 0.46)',
    stageFallbackUrl: DEFAULT_ARCADE_STAGE_BACKGROUND_URL,
    stageFit: {
      scaleX: 1.54,
      scaleY: 1.46,
      offsetX: '3.5%',
      offsetY: '1.5%',
      width: 'min(998px, 85vw)',
    },
  },
  {
    id: 'drop-window',
    gameId: ARCADE_DROP_WINDOW_GAME_ID,
    title: 'Drop Window',
    tagline: 'Real drop only. Kill the static.',
    releaseLabel: 'Tier 2 cabinet · Reaction run',
    genre: 'Reaction',
    cabinetTier: 2,
    requiredMembership: 'Pro',
    cabinetAccent: '#ffd36e',
    cabinetGlow: 'rgba(255, 211, 110, 0.44)',
    stageFallbackUrl: DEFAULT_ARCADE_STAGE_BACKGROUND_URL,
    stageFit: {
      scaleX: 1.52,
      scaleY: 1.44,
      offsetX: '3.5%',
      offsetY: '3.5%',
      width: 'min(998px, 85vw)',
    },
  },
  {
    id: 'hawkeye-gallery',
    gameId: ARCADE_BRICKED_UP_GAME_ID,
    title: 'Bricked Up',
    tagline: 'Break the wall. Bank the G.',
    releaseLabel: 'Tier 2 cabinet · Brick breaker',
    genre: 'Brick Breaker',
    cabinetTier: 2,
    requiredMembership: 'Pro',
    cabinetAccent: '#c8ffd8',
    cabinetGlow: 'rgba(200, 255, 216, 0.42)',
    stageFallbackUrl: DEFAULT_ARCADE_STAGE_BACKGROUND_URL,
    stageFit: {
      scaleX: 1.52,
      scaleY: 1.469,
      offsetX: '3.5%',
      offsetY: '-2.5%',
      width: 'min(998px, 85vw)',
    },
  },
  {
    id: 'stealth-goon',
    gameId: ARCADE_STEALTH_GOON_GAME_ID,
    title: 'Stealth Goon',
    tagline: 'Off-grid. On crew.',
    releaseLabel: 'Tier 2 cabinet · Squad chain',
    genre: 'Snake / Squad',
    cabinetTier: 2,
    requiredMembership: 'Pro',
    cabinetAccent: '#9f8cff',
    cabinetGlow: 'rgba(159, 140, 255, 0.44)',
    stageFallbackUrl: DEFAULT_ARCADE_STAGE_BACKGROUND_URL,
    stageFit: {
      scaleX: 1.52,
      scaleY: 1.44,
      offsetX: '3.5%',
      offsetY: '3.5%',
      width: 'min(998px, 85vw)',
    },
  },
  {
    id: 'squid-market',
    gameId: ARCADE_GOB_MARKET_GAME_ID,
    title: 'Gob Market',
    tagline: 'Are you on the list?',
    releaseLabel: 'Tier 3 cabinet · Maze run',
    genre: 'Maze / Collect',
    cabinetTier: 3,
    requiredMembership: 'Elite',
    cabinetAccent: '#ff3152',
    cabinetGlow: 'rgba(255, 49, 82, 0.5)',
    stageFallbackUrl: DEFAULT_ARCADE_STAGE_BACKGROUND_URL,
    stageFit: {
      scaleX: 1.52,
      scaleY: 1.44,
      offsetX: '3.5%',
      offsetY: '3.5%',
      width: 'min(998px, 85vw)',
    },
  },
  {
    id: 'intel-stack',
    gameId: ARCADE_INTEL_STACK_GAME_ID,
    title: 'Intel Stack',
    tagline: 'Stack before the signal dies.',
    releaseLabel: 'Tier 3 cabinet · Puzzle run',
    genre: 'Puzzle / Stack',
    cabinetTier: 3,
    requiredMembership: 'Elite',
    cabinetAccent: '#00e5ff',
    cabinetGlow: 'rgba(0, 229, 255, 0.46)',
    stageFallbackUrl: DEFAULT_ARCADE_STAGE_BACKGROUND_URL,
  },
];

export function formatArcadeHighScore(score: number): string {
  return score > 0 ? score.toLocaleString() : '—';
}

export function memberMeetsCabinetMembership(
  memberTier: NamiMember['tier'],
  requiredMembership: ArcadeCabinetRequiredMembership,
): boolean {
  return MEMBERSHIP_RANK[memberTier] >= REQUIRED_MEMBERSHIP_RANK[requiredMembership];
}

export function resolveArcadeCabinetAccess(
  cabinet: ArcadeCabinetDefinition,
  memberTier: NamiMember['tier'],
): ArcadeCabinetAccess {
  if (!memberMeetsCabinetMembership(memberTier, cabinet.requiredMembership)) {
    return 'locked';
  }

  if (!cabinet.gameId) {
    return 'offline';
  }

  return 'live';
}

export function arcadeCabinetAccessLabel(access: ArcadeCabinetAccess): string {
  if (access === 'live') {
    return 'LIVE';
  }

  if (access === 'locked') {
    return 'LOCKED';
  }

  return 'OFFLINE';
}

export function arcadeCabinetRequiredMembershipLabel(
  requiredMembership: ArcadeCabinetRequiredMembership,
): string {
  return requiredMembership.toUpperCase();
}

function readCabinetHighScoreLabel(cabinet: ArcadeCabinetDefinition): string {
  if (cabinet.gameId === ARCADE_BUBBLE_GAME_ID) {
    const normalHigh = readArcadeBubbleHighScore('normal');
    const hardHigh = readArcadeBubbleHighScore('hard');

    const skillHigh = readArcadeBubbleHighScore('skill');

    return (
      'N ' +
      formatArcadeHighScore(normalHigh) +
      ' · H ' +
      formatArcadeHighScore(hardHigh) +
      ' · D ' +
      formatArcadeHighScore(skillHigh)
    );
  }

  if (cabinet.gameId === ARCADE_ALLEY_PUSH_GAME_ID) {
    const streetHigh = readArcadeAlleyPushHighScore('normal');
    const heatHigh = readArcadeAlleyPushHighScore('hard');

    const skillHigh = readArcadeAlleyPushHighScore('skill');

    return (
      'S ' +
      formatArcadeHighScore(streetHigh) +
      ' · H ' +
      formatArcadeHighScore(heatHigh) +
      ' · D ' +
      formatArcadeHighScore(skillHigh)
    );
  }

  if (cabinet.gameId === ARCADE_STASH_DEFENSE_GAME_ID) {
    const watchHigh = readArcadeStashDefenseHighScore('normal');
    const siegeHigh = readArcadeStashDefenseHighScore('hard');

    const skillHigh = readArcadeStashDefenseHighScore('skill');

    return (
      'W ' +
      formatArcadeHighScore(watchHigh) +
      ' · S ' +
      formatArcadeHighScore(siegeHigh) +
      ' · D ' +
      formatArcadeHighScore(skillHigh)
    );
  }

  if (cabinet.gameId === ARCADE_DROP_WINDOW_GAME_ID) {
    const cleanHigh = readArcadeDropWindowHighScore('normal');
    const stormHigh = readArcadeDropWindowHighScore('hard');

    const skillHigh = readArcadeDropWindowHighScore('skill');

    return (
      'C ' +
      formatArcadeHighScore(cleanHigh) +
      ' · S ' +
      formatArcadeHighScore(stormHigh) +
      ' · D ' +
      formatArcadeHighScore(skillHigh)
    );
  }

  if (cabinet.gameId === ARCADE_BRICKED_UP_GAME_ID) {
    const streetHigh = readArcadeBrickedUpHighScore('normal');
    const heatHigh = readArcadeBrickedUpHighScore('hard');
    const skillHigh = readArcadeBrickedUpHighScore('skill');

    return (
      'B ' +
      formatArcadeHighScore(streetHigh) +
      ' · H ' +
      formatArcadeHighScore(heatHigh) +
      ' · D ' +
      formatArcadeHighScore(skillHigh)
    );
  }

  if (cabinet.gameId === ARCADE_STEALTH_GOON_GAME_ID) {
    const lowHigh = readArcadeStealthGoonHighScore('normal');
    const heatHigh = readArcadeStealthGoonHighScore('hard');
    const skillHigh = readArcadeStealthGoonHighScore('skill');

    return (
      'L ' +
      formatArcadeHighScore(lowHigh) +
      ' · H ' +
      formatArcadeHighScore(heatHigh) +
      ' · D ' +
      formatArcadeHighScore(skillHigh)
    );
  }

  if (cabinet.gameId === ARCADE_GOB_MARKET_GAME_ID) {
    const guestHigh = readArcadeGobMarketHighScore('normal');
    const vipHigh = readArcadeGobMarketHighScore('hard');
    const skillHigh = readArcadeGobMarketHighScore('skill');

    return (
      'G ' +
      formatArcadeHighScore(guestHigh) +
      ' · V ' +
      formatArcadeHighScore(vipHigh) +
      ' · D ' +
      formatArcadeHighScore(skillHigh)
    );
  }

  if (cabinet.gameId === ARCADE_INTEL_STACK_GAME_ID) {
    const cleanHigh = readArcadeIntelStackHighScore('normal');
    const surgeHigh = readArcadeIntelStackHighScore('hard');
    const skillHigh = readArcadeIntelStackHighScore('skill');

    return (
      'C ' +
      formatArcadeHighScore(cleanHigh) +
      ' · S ' +
      formatArcadeHighScore(surgeHigh) +
      ' · D ' +
      formatArcadeHighScore(skillHigh)
    );
  }

  return '—';
}

export function readArcadeCabinetById(cabinetId: string): ArcadeCabinetDefinition | null {
  return OFFICIAL_ARCADE_CABINETS.find((cabinet) => cabinet.id === cabinetId) ?? null;
}

export function readArcadeCabinetsForMember(member: NamiMember): ArcadeCabinetView[] {
  const memberTier = memberFeatureTier(member);

  return OFFICIAL_ARCADE_CABINETS.map((cabinet) => {
    const access = resolveArcadeCabinetAccess(cabinet, memberTier);

    return {
      ...cabinet,
      access,
      highScoreLabel: readCabinetHighScoreLabel(cabinet),
      accessLabel: arcadeCabinetAccessLabel(access),
    };
  });
}

export function canEnterArcadeCabinet(cabinet: ArcadeCabinetView): boolean {
  return cabinet.access === 'live';
}

export type ArcadeCabinetOwnerAssetSlot = {
  id: string;
  label: string;
  category: 'scene';
  hint: string;
};

function cabinetOwnerMediaSlotId(
  cabinetId: string,
  kind: 'intro' | 'stage' | 'viewport',
): string {
  return `arcade-cabinet-${cabinetId}-${kind}`;
}

export function readArcadeCabinetOwnerAssetSlots(): ArcadeCabinetOwnerAssetSlot[] {
  const slots: ArcadeCabinetOwnerAssetSlot[] = [];

  for (const cabinet of OFFICIAL_ARCADE_CABINETS) {
    slots.push(
      {
        id: cabinetOwnerMediaSlotId(cabinet.id, 'intro'),
        label: cabinet.title + ' walk-up intro',
        category: 'scene',
        hint:
          'Fullscreen MP4/WebM walk-up for the ' +
          cabinet.title +
          ' machine. Shared by every game board on this cabinet — not per-game.',
      },
      {
        id: cabinetOwnerMediaSlotId(cabinet.id, 'stage'),
        label: cabinet.title + ' stage loop',
        category: 'scene',
        hint:
          'Looping MP4/WebM stage FX behind the ' +
          cabinet.title +
          ' machine while any game on this cabinet is active. Public fallback: /arcade/cabinets/' +
          cabinet.id +
          '/stage.mp4.',
      },
      {
        id: cabinetOwnerMediaSlotId(cabinet.id, 'viewport'),
        label: cabinet.title + ' cabinet viewport',
        category: 'scene',
        hint:
          'Optional CRT interior background for ' +
          cabinet.title +
          '. Image or looping video inside the cabinet bezel.',
      },
    );
  }

  return slots;
}