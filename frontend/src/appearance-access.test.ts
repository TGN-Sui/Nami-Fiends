import { describe, expect, it } from 'vitest';

import {
  allowedThemeModes,
  allowedUiShells,
  clampAppearanceForTier,
  isThemeModeAllowed,
  isUiShellAllowed,
} from './appearance-access.js';

describe('appearance access by membership tier', () => {
  it('limits NPC members to classic default appearance', () => {
    expect(allowedUiShells('NPC')).toEqual(['classic']);
    expect(allowedThemeModes('NPC')).toEqual(['default']);
    expect(isUiShellAllowed('NPC', 'glass')).toBe(false);
    expect(isThemeModeAllowed('NPC', 'dark')).toBe(false);
  });

  it('unlocks modern glass and light/dark modes for Adventurers', () => {
    expect(allowedUiShells('Adventurer')).toEqual(['classic', 'glass']);
    expect(allowedThemeModes('Adventurer')).toEqual(['default', 'dark', 'light']);
    expect(isUiShellAllowed('Adventurer', 'pixel')).toBe(false);
    expect(isThemeModeAllowed('Adventurer', 'custom')).toBe(false);
  });

  it('unlocks custom color mode for Pro members', () => {
    expect(allowedThemeModes('Pro')).toContain('custom');
    expect(isUiShellAllowed('Pro', 'pixel')).toBe(false);
  });

  it('unlocks pixel interface for Elite members', () => {
    expect(allowedUiShells('Elite')).toEqual(['classic', 'glass', 'pixel']);
    expect(isUiShellAllowed('Elite', 'pixel')).toBe(true);
  });

  it('clamps stored preferences back to the highest tier allowed', () => {
    expect(clampAppearanceForTier('NPC', 'glass', 'dark')).toEqual({
      uiShell: 'classic',
      mode: 'default',
    });

    expect(clampAppearanceForTier('Adventurer', 'pixel', 'custom')).toEqual({
      uiShell: 'classic',
      mode: 'default',
    });

    expect(clampAppearanceForTier('Pro', 'pixel', 'custom')).toEqual({
      uiShell: 'classic',
      mode: 'custom',
    });
  });
});