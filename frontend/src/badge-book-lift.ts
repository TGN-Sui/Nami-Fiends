export const BADGE_BOOK_SPREAD_MAX_WIDTH = 920;
export const BADGE_BOOK_SPREAD_MAX_HEIGHT = 620;
export const BADGE_BOOK_SPREAD_HEIGHT_RATIO = 0.62;
export const BADGE_BOOK_SPINE_WIDTH = 14;
export const BADGE_BOOK_LIFT_MS = 1100;
export const BADGE_BOOK_OPEN_LAYOUT_PHASE = 0.28;
export const BADGE_BOOK_OPEN_COVER_PHASE = 0.5;

export type BadgeBookLiftTarget = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type BadgeBookSpreadLayout = {
  spread: BadgeBookLiftTarget;
  rightPage: BadgeBookLiftTarget;
};

export type BadgeBookLiftFrame = {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotateY: number;
};

export type BadgeBookOpenPose = {
  coverRotateY: number;
  leftPageRotateY: number;
  leftPageOpacity: number;
  layoutProgress: number;
  coverOpacity: number;
};

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export function prefersReducedBadgeBookMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function computeBadgeBookPageWidth(spreadWidth: number): number {
  return (spreadWidth - BADGE_BOOK_SPINE_WIDTH) / 2;
}

export function computeBadgeBookSpreadTarget(): BadgeBookLiftTarget {
  const padX = Math.min(Math.max(16, window.innerWidth * 0.03), 32) * 2;
  const width = Math.min(BADGE_BOOK_SPREAD_MAX_WIDTH, window.innerWidth - padX);
  const height = Math.min(
    BADGE_BOOK_SPREAD_MAX_HEIGHT,
    window.innerHeight * BADGE_BOOK_SPREAD_HEIGHT_RATIO
  );
  const left = (window.innerWidth - width) / 2;
  const top = Math.max(16, (window.innerHeight - height) / 2 - 20);

  return { left, top, width, height };
}

export function computeBadgeBookSpreadLayout(): BadgeBookSpreadLayout {
  const spread = computeBadgeBookSpreadTarget();
  const pageWidth = computeBadgeBookPageWidth(spread.width);

  return {
    spread,
    rightPage: {
      left: spread.left + pageWidth + BADGE_BOOK_SPINE_WIDTH,
      top: spread.top,
      width: pageWidth,
      height: spread.height,
    },
  };
}

export function computeBadgeBookLiftFrames(
  source: DOMRect,
  spread: BadgeBookLiftTarget
): { from: BadgeBookLiftFrame; to: BadgeBookLiftFrame } {
  const pageWidth = computeBadgeBookPageWidth(spread.width);
  const sourceCenterX = source.left + source.width / 2;
  const sourceCenterY = source.top + source.height / 2;
  const spreadCenterX = spread.left + spread.width / 2;
  const spreadCenterY = spread.top + spread.height / 2;

  return {
    from: {
      translateX: sourceCenterX - spreadCenterX,
      translateY: sourceCenterY - spreadCenterY,
      scaleX: source.width / pageWidth,
      scaleY: source.height / spread.height,
      rotateY: 0,
    },
    to: {
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      rotateY: 0,
    },
  };
}

export function interpolateLiftFrame(
  from: BadgeBookLiftFrame,
  to: BadgeBookLiftFrame,
  progress: number
): BadgeBookLiftFrame {
  const t = Math.min(1, Math.max(0, progress));

  return {
    translateX: from.translateX + (to.translateX - from.translateX) * t,
    translateY: from.translateY + (to.translateY - from.translateY) * t,
    scaleX: from.scaleX + (to.scaleX - from.scaleX) * t,
    scaleY: from.scaleY + (to.scaleY - from.scaleY) * t,
    rotateY: from.rotateY + (to.rotateY - from.rotateY) * t,
  };
}

export function computeBadgeBookOpenPose(progress: number): BadgeBookOpenPose {
  const p = Math.min(1, Math.max(0, progress));
  const layoutProgress = easeInOutCubic(Math.min(1, p / BADGE_BOOK_OPEN_LAYOUT_PHASE));

  let coverRotateY = 0;
  let leftPageRotateY = 90;
  let leftPageOpacity = 0;
  let coverOpacity = 1;

  if (p < BADGE_BOOK_OPEN_COVER_PHASE) {
    const coverT = easeInOutCubic(p / BADGE_BOOK_OPEN_COVER_PHASE);
    coverRotateY = coverT * -90;
    leftPageRotateY = 90;
    leftPageOpacity = 0;
  } else {
    const leftT = easeInOutCubic((p - BADGE_BOOK_OPEN_COVER_PHASE) / (1 - BADGE_BOOK_OPEN_COVER_PHASE));
    coverRotateY = -90 + leftT * -90;
    leftPageRotateY = 90 * (1 - leftT);
    leftPageOpacity = 1;
    coverOpacity = Math.max(0, 1 - leftT * 1.35);
  }

  return { coverRotateY, leftPageRotateY, leftPageOpacity, layoutProgress, coverOpacity };
}

export function readBadgeBookLiftHandoffTarget(
  node: HTMLElement | null,
  fallback: BadgeBookLiftTarget
): BadgeBookLiftTarget {
  if (!node) {
    return fallback;
  }

  const rect = node.getBoundingClientRect();

  if (rect.width < 1 || rect.height < 1) {
    return fallback;
  }

  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function badgeBookSpreadCssVars(spread: BadgeBookLiftTarget): Record<string, string> {
  const pageWidth = computeBadgeBookPageWidth(spread.width);

  return {
    '--badge-book-handoff-width': String(spread.width) + 'px',
    '--badge-book-handoff-height': String(spread.height) + 'px',
    '--badge-book-page-width': String(pageWidth) + 'px',
  };
}

export function badgeBookLiftTransform(frame: BadgeBookLiftFrame): string {
  return (
    'translate3d(' +
    String(frame.translateX) +
    'px, ' +
    String(frame.translateY) +
    'px, 0) scale(' +
    String(frame.scaleX) +
    ', ' +
    String(frame.scaleY) +
    ') rotateY(' +
    String(frame.rotateY) +
    'deg)'
  );
}