import { describe, expect, it } from 'vitest';

import {
  arcadeCabinetStageFitBoxStyle,
  DEFAULT_ARCADE_CABINET_STAGE_FIT,
  readArcadeCabinetStageFit,
} from './arcade-cabinet-stage-fit.js';

describe('arcade-cabinet-stage-fit', () => {
  it('returns defaults when no cabinet is active', () => {
    expect(readArcadeCabinetStageFit(null)).toEqual(DEFAULT_ARCADE_CABINET_STAGE_FIT);
  });

  it('applies goon-pop stage fit from the cabinet registry', () => {
    const fit = readArcadeCabinetStageFit('goon-pop');

    expect(fit.scaleX).toBe(1.6);
    expect(fit.scaleY).toBe(1.49);
    expect(fit.width).toBe('min(998px, 85vw)');
    expect(fit.offsetX).toBe('3.5%');
    expect(fit.offsetY).toBe('1.5%');
    expect(fit.hideBezel).toBe(true);
  });

  it('applies alley-push stage fit from the cabinet registry', () => {
    const fit = readArcadeCabinetStageFit('alley-push');

    expect(fit.scaleX).toBe(1.6);
    expect(fit.scaleY).toBe(1.49);
    expect(fit.width).toBe('min(998px, 85vw)');
    expect(fit.offsetX).toBe('3.5%');
    expect(fit.offsetY).toBe('1.5%');
    expect(fit.hideBezel).toBe(true);
  });

  it('raises the bricked up cabinet screen on the stage closeup', () => {
    const fit = readArcadeCabinetStageFit('hawkeye-gallery');

    expect(fit.scaleX).toBeCloseTo(1.528, 3);
    expect(fit.scaleY).toBeCloseTo(1.476, 3);
    expect(fit.offsetX).toBe('4.5%');
    expect(fit.offsetY).toBe('-1.5%');
  });

  it('raises the stealth goon cabinet screen on the stage closeup', () => {
    const fit = readArcadeCabinetStageFit('stealth-goon');

    expect(fit.scaleY).toBe(1.5);
    expect(fit.offsetX).toBe('2.5%');
    expect(fit.offsetY).toBe('-2%');
  });

  it('writes stealth goon offset vars on the cabinet box element', () => {
    const fit = readArcadeCabinetStageFit('stealth-goon');

    expect(arcadeCabinetStageFitBoxStyle(fit)['--arcade-cabinet-fit-offset-y']).toBe('-2%');
  });

  it('applies intel stack stage fit from the cabinet registry', () => {
    const fit = readArcadeCabinetStageFit('intel-stack');

    expect(fit.scaleY).toBe(1.553);
    expect(fit.scaleX).toBe(1.545);
    expect(fit.offsetY).toBe('-2%');
  });
});