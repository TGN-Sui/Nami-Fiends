import { afterEach, describe, expect, it } from 'vitest';

import {
  clearArcadeSession,
  readArcadeStageCabinetId,
  resetArcadeSessionStoreForTests,
  setArcadeStageCabinetId,
} from './arcade-session-store.js';

describe('arcade-session-store', () => {
  afterEach(() => {
    resetArcadeSessionStoreForTests();
  });

  it('tracks the active cabinet stage id', () => {
    expect(readArcadeStageCabinetId()).toBeNull();

    setArcadeStageCabinetId('goon-pop');

    expect(readArcadeStageCabinetId()).toBe('goon-pop');
  });

  it('clears cabinet stage state on session reset', () => {
    setArcadeStageCabinetId('alley-push');
    clearArcadeSession();

    expect(readArcadeStageCabinetId()).toBeNull();
  });
});