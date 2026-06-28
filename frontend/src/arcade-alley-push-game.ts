export const ARCADE_ALLEY_PUSH_GAME_ID = 'nami-alley-push';

export const ARCADE_ALLEY_PUSH_LANE_COUNT = 5;
export const ARCADE_ALLEY_PUSH_GAME_DURATION_MS = 60_000;
export const ARCADE_ALLEY_PUSH_LEADERBOARD_SIZE = 10;
export const ARCADE_ALLEY_PUSH_CREW_PASS_SCORE = 5;
export const ARCADE_ALLEY_PUSH_HIT_PENALTY = 2;
export const ARCADE_ALLEY_PUSH_INVINCIBLE_MS = 700;
export const ARCADE_ALLEY_PUSH_LANE_CHANGE_COOLDOWN_MS = 260;
export const ARCADE_ALLEY_PUSH_PASS_COOLDOWN_MS = 1_100;
export const ARCADE_ALLEY_PUSH_PASS_INVINCIBLE_MS = 420;
export const ARCADE_ALLEY_PUSH_TRAFFIC_ENTRY_LANE = 1;

export const ARCADE_ALLEY_PUSH_PLAYER_WIDTH = 8;
export const ARCADE_ALLEY_PUSH_HAZARD_WIDTH = 16;

export type ArcadeAlleyPushMode = 'normal' | 'hard';

export type ArcadeAlleyPushGameConfig = {
  mode: ArcadeAlleyPushMode;
  hazardSpeedMin: number;
  hazardSpeedMax: number;
  hazardTracksPerLane: number;
  hazardsPerLane: number;
  playerMoveSpeed: number;
};

export type ArcadeAlleyPushHazard = {
  id: string;
  lane: number;
  track: number;
  x: number;
  width: number;
  speed: number;
  label: string;
};

export const ARCADE_ALLEY_PUSH_HAZARD_TRACK_Y = [24, 50, 76] as const;

export type ArcadeAlleyPushPlayer = {
  lane: number;
  track: number;
  x: number;
  invincibleUntil: number;
};

const HAZARD_LABELS = ['HEAT', 'COP', 'DRONE', 'STATIC', 'BLOCK'] as const;
const TRAFFIC_LANES = [1, 2, 3] as const;

export const ARCADE_ALLEY_PUSH_CREW_PASS_LANE = 4;
export const ARCADE_ALLEY_PUSH_START_LANE = 0;

export function arcadeAlleyPushGameConfig(mode: ArcadeAlleyPushMode): ArcadeAlleyPushGameConfig {
  if (mode === 'hard') {
    return {
      mode,
      hazardSpeedMin: 0.16,
      hazardSpeedMax: 0.3,
      hazardTracksPerLane: 3,
      hazardsPerLane: 1,
      playerMoveSpeed: 0.34,
    };
  }

  return {
    mode,
    hazardSpeedMin: 0.12,
    hazardSpeedMax: 0.24,
    hazardTracksPerLane: 1,
    hazardsPerLane: 3,
    playerMoveSpeed: 0.38,
  };
}

export function arcadeAlleyPushHazardTrackY(track: number, trackCount: number): number {
  if (trackCount <= 1) {
    return 50;
  }

  return ARCADE_ALLEY_PUSH_HAZARD_TRACK_Y[track] ?? 50;
}

export function arcadeAlleyPushModeLabel(mode: ArcadeAlleyPushMode): string {
  return mode === 'hard' ? 'Heat Chase' : 'Street Pass';
}

function randomHazardLabel(): string {
  return HAZARD_LABELS[Math.floor(Math.random() * HAZARD_LABELS.length)]!;
}

function randomHazardSpeed(config: ArcadeAlleyPushGameConfig): number {
  const magnitude =
    config.hazardSpeedMin + Math.random() * (config.hazardSpeedMax - config.hazardSpeedMin);

  return Math.random() < 0.5 ? -magnitude : magnitude;
}

function spawnArcadeAlleyPushHazardX(speed: number, width: number, index: number): number {
  const entrySpacing = 26;

  if (speed > 0) {
    return -width * 0.5 - index * entrySpacing;
  }

  return 100 + width * 0.5 + index * entrySpacing;
}

export function isArcadeAlleyPushHazardVisible(hazard: ArcadeAlleyPushHazard): boolean {
  const hazardLeft = hazard.x - hazard.width * 0.5;
  const hazardRight = hazard.x + hazard.width * 0.5;

  return hazardRight > 0 && hazardLeft < 100;
}

export function isArcadeAlleyPushTrafficLane(lane: number): boolean {
  return lane >= ARCADE_ALLEY_PUSH_TRAFFIC_ENTRY_LANE && lane < ARCADE_ALLEY_PUSH_CREW_PASS_LANE;
}

export function createArcadeAlleyPushPlayer(now: number): ArcadeAlleyPushPlayer {
  return {
    lane: ARCADE_ALLEY_PUSH_START_LANE,
    track: 1,
    x: 50,
    invincibleUntil: now + ARCADE_ALLEY_PUSH_INVINCIBLE_MS,
  };
}

export function spawnArcadeAlleyPushHazards(config: ArcadeAlleyPushGameConfig): ArcadeAlleyPushHazard[] {
  const hazards: ArcadeAlleyPushHazard[] = [];
  let hazardIndex = 0;

  for (const lane of TRAFFIC_LANES) {
    for (let track = 0; track < config.hazardTracksPerLane; track += 1) {
      for (let index = 0; index < config.hazardsPerLane; index += 1) {
        const speed = randomHazardSpeed(config);
        const width = ARCADE_ALLEY_PUSH_HAZARD_WIDTH + Math.random() * 4;
        const entryIndex = track * config.hazardsPerLane + index;

        hazards.push({
          id: 'alley-hazard-' + lane + '-' + hazardIndex,
          lane,
          track,
          x: spawnArcadeAlleyPushHazardX(speed, width, entryIndex),
          width,
          speed,
          label: randomHazardLabel(),
        });
        hazardIndex += 1;
      }
    }
  }

  return hazards;
}

export function updateArcadeAlleyPushHazards(
  hazards: ArcadeAlleyPushHazard[],
  config: ArcadeAlleyPushGameConfig,
): ArcadeAlleyPushHazard[] {
  return hazards.map((hazard) => {
    let nextX = hazard.x + hazard.speed;
    const hazardLeft = nextX - hazard.width * 0.5;
    const hazardRight = nextX + hazard.width * 0.5;

    if (hazard.speed > 0 && hazardLeft > 100) {
      nextX = -hazard.width * 0.5;
    }

    if (hazard.speed < 0 && hazardRight < 0) {
      nextX = 100 + hazard.width * 0.5;
    }

    return {
      ...hazard,
      x: nextX,
    };
  });
}

export function stepArcadeAlleyPushPlayer(
  player: ArcadeAlleyPushPlayer,
  direction: 'up' | 'down',
  config: ArcadeAlleyPushGameConfig,
): ArcadeAlleyPushPlayer {
  const maxTrack = config.hazardTracksPerLane - 1;

  if (config.hazardTracksPerLane <= 1) {
    let lane = player.lane;

    if (direction === 'up' && lane < ARCADE_ALLEY_PUSH_CREW_PASS_LANE) {
      lane += 1;
    }

    if (direction === 'down' && lane > ARCADE_ALLEY_PUSH_START_LANE) {
      lane -= 1;
    }

    return {
      ...player,
      lane,
    };
  }

  if (direction === 'up') {
    if (player.lane === ARCADE_ALLEY_PUSH_START_LANE) {
      return {
        ...player,
        lane: ARCADE_ALLEY_PUSH_TRAFFIC_ENTRY_LANE,
        track: maxTrack,
      };
    }

    if (player.lane === ARCADE_ALLEY_PUSH_CREW_PASS_LANE) {
      return player;
    }

    if (isArcadeAlleyPushTrafficLane(player.lane)) {
      if (player.track > 0) {
        return {
          ...player,
          track: player.track - 1,
        };
      }

      return {
        ...player,
        lane: player.lane + 1,
        track: maxTrack,
      };
    }
  }

  if (direction === 'down') {
    if (player.lane === ARCADE_ALLEY_PUSH_START_LANE) {
      return player;
    }

    if (player.lane === ARCADE_ALLEY_PUSH_CREW_PASS_LANE) {
      return {
        ...player,
        lane: ARCADE_ALLEY_PUSH_CREW_PASS_LANE - 1,
        track: 0,
      };
    }

    if (isArcadeAlleyPushTrafficLane(player.lane)) {
      if (player.track < maxTrack) {
        return {
          ...player,
          track: player.track + 1,
        };
      }

      if (player.lane > ARCADE_ALLEY_PUSH_TRAFFIC_ENTRY_LANE) {
        return {
          ...player,
          lane: player.lane - 1,
          track: 0,
        };
      }

      return {
        ...player,
        lane: ARCADE_ALLEY_PUSH_START_LANE,
        track: 1,
      };
    }
  }

  return player;
}

export function applyArcadeAlleyPushLaneStep(
  player: ArcadeAlleyPushPlayer,
  direction: 'up' | 'down',
  config: ArcadeAlleyPushGameConfig,
  lastLaneChangeAt: number,
  now: number,
): { player: ArcadeAlleyPushPlayer; lastLaneChangeAt: number; moved: boolean } {
  if (now - lastLaneChangeAt < ARCADE_ALLEY_PUSH_LANE_CHANGE_COOLDOWN_MS) {
    return { player, lastLaneChangeAt, moved: false };
  }

  const nextPlayer = stepArcadeAlleyPushPlayer(player, direction, config);

  if (nextPlayer.lane === player.lane && nextPlayer.track === player.track) {
    return { player, lastLaneChangeAt, moved: false };
  }

  return {
    player: nextPlayer,
    lastLaneChangeAt: now,
    moved: true,
  };
}

export function moveArcadeAlleyPushPlayerHorizontal(
  player: ArcadeAlleyPushPlayer,
  input: { left: boolean; right: boolean },
  config: ArcadeAlleyPushGameConfig,
): ArcadeAlleyPushPlayer {
  let x = player.x;

  if (input.left) {
    x -= config.playerMoveSpeed;
  }

  if (input.right) {
    x += config.playerMoveSpeed;
  }

  const minX = ARCADE_ALLEY_PUSH_PLAYER_WIDTH * 0.5;
  const maxX = 100 - ARCADE_ALLEY_PUSH_PLAYER_WIDTH * 0.5;

  return {
    ...player,
    x: Math.max(minX, Math.min(maxX, x)),
  };
}

export function shouldAwardArcadeAlleyPushPass(
  previousLane: number,
  nextLane: number,
  lastPassAt: number,
  now: number,
): boolean {
  return (
    previousLane === ARCADE_ALLEY_PUSH_CREW_PASS_LANE - 1 &&
    nextLane === ARCADE_ALLEY_PUSH_CREW_PASS_LANE &&
    now - lastPassAt >= ARCADE_ALLEY_PUSH_PASS_COOLDOWN_MS
  );
}

export function arcadeAlleyPushCollision(
  player: ArcadeAlleyPushPlayer,
  hazards: ArcadeAlleyPushHazard[],
  now: number,
  config: ArcadeAlleyPushGameConfig,
): ArcadeAlleyPushHazard | null {
  if (
    now < player.invincibleUntil ||
    player.lane <= ARCADE_ALLEY_PUSH_START_LANE ||
    player.lane >= ARCADE_ALLEY_PUSH_CREW_PASS_LANE
  ) {
    return null;
  }

  const playerLeft = player.x - ARCADE_ALLEY_PUSH_PLAYER_WIDTH * 0.5;
  const playerRight = player.x + ARCADE_ALLEY_PUSH_PLAYER_WIDTH * 0.5;

  for (const hazard of hazards) {
    if (hazard.lane !== player.lane || !isArcadeAlleyPushHazardVisible(hazard)) {
      continue;
    }

    if (config.hazardTracksPerLane > 1 && hazard.track !== player.track) {
      continue;
    }

    const hazardLeft = hazard.x - hazard.width * 0.5;
    const hazardRight = hazard.x + hazard.width * 0.5;

    if (playerRight > hazardLeft && playerLeft < hazardRight) {
      return hazard;
    }
  }

  return null;
}

export function arcadeAlleyPushPlayerTrackY(
  player: ArcadeAlleyPushPlayer,
  config: ArcadeAlleyPushGameConfig,
): number {
  if (config.hazardTracksPerLane <= 1 || !isArcadeAlleyPushTrafficLane(player.lane)) {
    return 50;
  }

  return arcadeAlleyPushHazardTrackY(player.track, config.hazardTracksPerLane);
}

export function resetArcadeAlleyPushPlayerAfterHit(
  player: ArcadeAlleyPushPlayer,
  now: number,
): ArcadeAlleyPushPlayer {
  return {
    lane: ARCADE_ALLEY_PUSH_START_LANE,
    track: 1,
    x: 50,
    invincibleUntil: now + ARCADE_ALLEY_PUSH_INVINCIBLE_MS,
  };
}

export function resetArcadeAlleyPushPlayerAfterPass(
  player: ArcadeAlleyPushPlayer,
  now: number,
): ArcadeAlleyPushPlayer {
  return {
    ...player,
    lane: ARCADE_ALLEY_PUSH_START_LANE,
    track: 1,
    x: 50,
    invincibleUntil: now + ARCADE_ALLEY_PUSH_PASS_INVINCIBLE_MS,
  };
}