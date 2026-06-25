export const PLAYER_STAR_MAX_SCORE = 100;
export const PLAYER_STAR_SLOT_COUNT = 5;

export type PlayerStarDisplay = {
  score: number;
  filledStars: number;
  totalStars: number;
  isFoil: boolean;
  label: string;
};

function clampPlayerScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(PLAYER_STAR_MAX_SCORE, Math.round(score)));
}

/** Maps Player Score (0–100) to 1–5 stars; 100 renders as foil. Display only. */
export function resolvePlayerStarDisplay(score: number): PlayerStarDisplay {
  const clamped = clampPlayerScore(score);
  const isFoil = clamped >= PLAYER_STAR_MAX_SCORE;
  const filledStars = isFoil
    ? PLAYER_STAR_SLOT_COUNT
    : Math.min(PLAYER_STAR_SLOT_COUNT, Math.max(1, Math.ceil(clamped / 20)));

  const label = isFoil
    ? 'Foil star — max player score'
    : filledStars + ' of ' + PLAYER_STAR_SLOT_COUNT + ' gamer stars';

  return {
    score: clamped,
    filledStars,
    totalStars: PLAYER_STAR_SLOT_COUNT,
    isFoil,
    label,
  };
}