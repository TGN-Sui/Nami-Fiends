import { describe, expect, it } from 'vitest';

import {
  isNamiSoundEnabled,
  playArcadeDropWindowBuzzerSfx,
  playArcadeGameCountdownTickSfx,
  playBubbleCollisionSfx,
  playBubbleMotionSfx,
  playButtonHoverSfx,
  playSidebarHoverSfx,
  playTypeKeySfx,
  setNamiSoundEnabled,
} from './nami-sfx.js';

describe('nami-sfx', () => {
  it('toggles sound enabled state', () => {
    setNamiSoundEnabled(false);
    expect(isNamiSoundEnabled()).toBe(false);
    setNamiSoundEnabled(true);
    expect(isNamiSoundEnabled()).toBe(true);
  });

  it('exposes hover, typing, and bubble motion helpers without throwing when audio is unavailable', () => {
    setNamiSoundEnabled(false);

    expect(() => playButtonHoverSfx()).not.toThrow();
    expect(() => playSidebarHoverSfx()).not.toThrow();
    expect(() => playTypeKeySfx()).not.toThrow();
    expect(() => playBubbleCollisionSfx(0.8)).not.toThrow();
    expect(() => playBubbleMotionSfx(0.7)).not.toThrow();
    expect(() => playArcadeGameCountdownTickSfx(3)).not.toThrow();
    expect(() => playArcadeDropWindowBuzzerSfx()).not.toThrow();

    setNamiSoundEnabled(true);
  });
});