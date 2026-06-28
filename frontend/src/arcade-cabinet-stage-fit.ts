import { readArcadeCabinetById } from './arcade-cabinets.js';

/** Tune these when aligning the live cabinet to the stage video closeup. */
export type ArcadeCabinetStageFit = {
  /** Horizontal scale (wider → increase). */
  scaleX: number;
  /** Vertical scale (taller → increase). */
  scaleY: number;
  /** Horizontal nudge after scale (negative = left). */
  offsetX: string;
  /** Vertical nudge after scale (higher → decrease, lower → increase). */
  offsetY: string;
  /** Base width before scale is applied. */
  width: string;
  /** Viewport aspect — closeup screens are usually squarer than 16:10. */
  aspectRatio: string;
  /** Hide the decorative bezel so only the CRT viewport sits on the stage screen. */
  hideBezel: boolean;
};

export const DEFAULT_ARCADE_CABINET_STAGE_FIT: ArcadeCabinetStageFit = {
  scaleX: 1.38,
  scaleY: 1.44,
  offsetX: '0%',
  offsetY: '4.5%',
  width: 'min(940px, 80vw)',
  aspectRatio: '4 / 3',
  hideBezel: true,
};

export function readArcadeCabinetStageFit(cabinetId: string | null): ArcadeCabinetStageFit {
  if (!cabinetId) {
    return DEFAULT_ARCADE_CABINET_STAGE_FIT;
  }

  const cabinet = readArcadeCabinetById(cabinetId);

  return {
    ...DEFAULT_ARCADE_CABINET_STAGE_FIT,
    ...cabinet?.stageFit,
  };
}

export function arcadeCabinetStageFitStyle(
  fit: ArcadeCabinetStageFit,
): Record<string, string | number> {
  return {
    '--arcade-cabinet-fit-scale-x': fit.scaleX,
    '--arcade-cabinet-fit-scale-y': fit.scaleY,
    '--arcade-cabinet-fit-offset-x': fit.offsetX,
    '--arcade-cabinet-fit-offset-y': fit.offsetY,
    '--arcade-cabinet-fit-width': fit.width,
    '--arcade-cabinet-fit-aspect': fit.aspectRatio,
  };
}