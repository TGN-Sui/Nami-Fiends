/** Small weekly growth per boost power point (resets with discovery cycle). */
export const GAME_BUBBLE_BOOST_SCALE_PER_POWER = 0.008;

/** Cap weekly game bubble growth at +35%. */
export const GAME_BUBBLE_BOOST_SCALE_CAP = 0.35;

/** Small weekly growth per unique genre chatter. */
export const GENRE_BUBBLE_CHATTER_SCALE_PER_ACTIVE = 0.012;

/** Cap weekly genre bubble growth at +40%. */
export const GENRE_BUBBLE_CHATTER_SCALE_CAP = 0.4;

export function gameBubbleScaleFromBoostPower(boostPower: number): number {
  const growth = Math.min(
    GAME_BUBBLE_BOOST_SCALE_CAP,
    Math.max(0, boostPower) * GAME_BUBBLE_BOOST_SCALE_PER_POWER,
  );

  return 1 + growth;
}

export function genreBubbleScaleFromWeeklyChatters(activeChatters: number): number {
  const growth = Math.min(
    GENRE_BUBBLE_CHATTER_SCALE_CAP,
    Math.max(0, activeChatters) * GENRE_BUBBLE_CHATTER_SCALE_PER_ACTIVE,
  );

  return 1 + growth;
}

export function genreBubbleBaseRadiusFromWeeklyChatters(activeChatters: number): number {
  return 26 + Math.min(18, Math.round(Math.max(0, activeChatters) / 8));
}

const GENRE_BUBBLE_BOARD_REFERENCE_WIDTH_PX = 1160;

/** Shrink genre bubble radii on narrow boards — radii are pixel-absolute while layout is responsive. */
export function resolveGenreBubbleBoardScale(baseScale: number, boardWidthPx: number): number {
  const widthFactor = Math.min(
    1,
    Math.max(0.35, boardWidthPx / GENRE_BUBBLE_BOARD_REFERENCE_WIDTH_PX),
  );

  return baseScale * widthFactor;
}