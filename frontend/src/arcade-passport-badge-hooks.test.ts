import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ARCADE_BUBBLE_GAME_ID } from './arcade-bubble-game.js';
import { recordArcadeBubbleGameResult, resetArcadeBubbleGameStoreForTests } from './arcade-bubble-game-store.js';
import {
  applyArcadePassportBadgesAfterRun,
  grantArcadePassportBadge,
  hasArcadePassportBadge,
  readMemberArcadePassportBadgeLabels,
  resetArcadePassportBadgeGrantsForTests,
} from './arcade-passport-badge-hooks.js';
import { ARCADE_SKILL_DIFF_MODE } from './arcade-skill-diff.js';

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('arcade-passport-badge-hooks', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    resetArcadeBubbleGameStoreForTests();
    resetArcadePassportBadgeGrantsForTests();
  });

  it('grants debut and skill badges after a qualifying run', () => {
    recordArcadeBubbleGameResult({
      memberId: 'm1',
      displayName: 'Tester',
      mode: ARCADE_SKILL_DIFF_MODE,
      score: 12,
      bubblesPopped: 8,
    });

    const earned = applyArcadePassportBadgesAfterRun({
      memberId: 'm1',
      gameId: ARCADE_BUBBLE_GAME_ID,
      mode: ARCADE_SKILL_DIFF_MODE,
      score: 12,
      isPersonalBest: true,
    });

    expect(earned.map((grant) => grant.badgeLabel)).toEqual(
      expect.arrayContaining(['Goon Pop Debut', 'Skill Diff Survivor', 'Crew Record']),
    );
    expect(readMemberArcadePassportBadgeLabels('m1')).toEqual(
      expect.arrayContaining(['Goon Pop Debut', 'Skill Diff Survivor', 'Crew Record']),
    );
  });

  it('does not grant the same badge twice', () => {
    expect(grantArcadePassportBadge('self', 'crew-record', 'Crew Record').ok).toBe(true);
    expect(grantArcadePassportBadge('self', 'crew-record', 'Crew Record')).toEqual({
      ok: false,
      reason: 'already-owned',
    });
    expect(hasArcadePassportBadge('self', 'crew-record')).toBe(true);
  });
});