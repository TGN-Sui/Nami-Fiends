import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ARCADE_CABINET_STAGE_FIT,
  readArcadeCabinetStageFit,
} from './arcade-cabinet-stage-fit.js';

describe('arcade-cabinet-stage-fit', () => {
  it('returns defaults when no cabinet is active', () => {
    expect(readArcadeCabinetStageFit(null)).toEqual(DEFAULT_ARCADE_CABINET_STAGE_FIT);
  });

  it('applies goon-pop stage fit from the cabinet registry', () => {
    const fit = readArcadeCabinetStageFit('goon-pop');

    expect(fit.scaleX).toBe(1.48);
    expect(fit.scaleY).toBe(1.3);
    expect(fit.width).toBe('min(998px, 85vw)');
    expect(fit.offsetY).toBe('0%');
    expect(fit.hideBezel).toBe(true);
  });

  it('applies alley-push stage fit from the cabinet registry', () => {
    const fit = readArcadeCabinetStageFit('alley-push');

    expect(fit.scaleX).toBe(1.48);
    expect(fit.scaleY).toBe(1.3);
    expect(fit.width).toBe('min(998px, 85vw)');
    expect(fit.offsetY).toBe('0%');
    expect(fit.hideBezel).toBe(true);
  });
});