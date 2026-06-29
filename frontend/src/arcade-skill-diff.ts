export const ARCADE_SKILL_DIFF_MODE = 'skill' as const;

export function isArcadeSkillDiffMode(mode: string): mode is typeof ARCADE_SKILL_DIFF_MODE {
  return mode === ARCADE_SKILL_DIFF_MODE;
}

export function isArcadeCabinetPlayMode(mode: string): boolean {
  return mode === 'normal' || mode === 'hard' || isArcadeSkillDiffMode(mode);
}

export const ARCADE_SKILL_DIFF_HAZARD_SPEED_MULTIPLIER = 3;
export const ARCADE_SKILL_DIFF_SPAWN_RATE_MULTIPLIER = 5;
export const ARCADE_SKILL_DIFF_SPAWN_BATCH_MULTIPLIER = 2;
export const ARCADE_SKILL_DIFF_ACTION_COOLDOWN_MS = 0;

export const ARCADE_SKILL_DIFF_MODE_LABEL = 'SKILL DIFF';

export function arcadeSkillDiffScaledSpeed(speed: number): number {
  return speed * ARCADE_SKILL_DIFF_HAZARD_SPEED_MULTIPLIER;
}

export function arcadeSkillDiffFasterSpawnInterval(intervalMs: number): number {
  return Math.max(120, Math.round(intervalMs / ARCADE_SKILL_DIFF_SPAWN_RATE_MULTIPLIER));
}

export function arcadeSkillDiffDoubledSpawnCount(count: number): number {
  return count * ARCADE_SKILL_DIFF_SPAWN_BATCH_MULTIPLIER;
}