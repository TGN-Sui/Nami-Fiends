import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('member-display-name-store', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('rejects display names that are too short', async () => {
    const { checkDisplayNameAvailability } = await import('./member-display-name-store.js');

    expect(checkDisplayNameAvailability('a', 'm1').available).toBe(false);
  });

  it('accepts the current passport display name', async () => {
    const { checkDisplayNameAvailability } = await import('./member-display-name-store.js');

    expect(checkDisplayNameAvailability('Robbos', 'm1').available).toBe(true);
  });

  it('does not mutate signup session display name when saving passport name', async () => {
    const { saveMemberSession } = await import('./member-session-store.js');
    const { saveMemberDisplayName, readMemberDisplayNameHistory } = await import(
      './member-display-name-store.js'
    );
    const { readSelfProfileEdits } = await import('./member-profile-store.js');

    saveMemberSession({
      displayName: 'River',
      email: 'river@example.com',
      archetype: 2,
      archetypeLabel: 'Cozy Voyager',
      flavorBadgeId: 'Hearth Basic',
      quizAnswers: {},
      issuedPlayerScore: 28,
      issuedPlayerScoreTier: 'basic',
      playerScoreIssuedAtMs: 1_700_000_000_000,
      signedUpAtMs: 1_700_000_000_000,
    });

    const result = saveMemberDisplayName('Passport Alias');

    expect(result.ok).toBe(true);
    expect(readSelfProfileEdits().displayName).toBe('Passport Alias');

    const { readMemberSession } = await import('./member-session-store.js');

    expect(readMemberSession()?.displayName).toBe('River');

    const registry = JSON.parse(window.localStorage.getItem('nami.member.accounts') ?? '{}') as Record<
      string,
      { displayName?: string }
    >;

    expect(registry['river@example.com']?.displayName).toBe('River');
    expect(readMemberDisplayNameHistory('m1', 'River')[0]?.name).toBe('Passport Alias');
  });

  it('blocks unverified members from changing display names', async () => {
    const memberAccess = await import('./member-access.js');
    const isMemberVerifiedSpy = vi.spyOn(memberAccess, 'isMemberVerified').mockReturnValue(false);

    const { readDisplayNameChangeEligibility, saveMemberDisplayName } = await import(
      './member-display-name-store.js'
    );

    const unverifiedMember = {
      id: 'm1',
      surfaceType: 'member' as const,
      avatarSeed: 'RB',
      name: 'Robbos',
      signal: 'Orange' as const,
      tier: 'NPC' as const,
      badge: 'Newcomer',
    };

    expect(readDisplayNameChangeEligibility('m1', unverifiedMember).allowed).toBe(false);
    expect(saveMemberDisplayName('New Alias', 'm1').ok).toBe(false);

    isMemberVerifiedSpy.mockRestore();
  });

  it('enforces a 30-day cooldown between display name changes for verified members', async () => {
    const { saveMemberDisplayName, readDisplayNameChangeEligibility } = await import(
      './member-display-name-store.js'
    );

    const verifiedMember = {
      id: 'm1',
      surfaceType: 'member' as const,
      avatarSeed: 'RB',
      name: 'Robbos',
      signal: 'Green' as const,
      tier: 'Pro' as const,
      badge: 'Top Helper',
    };

    const firstSave = saveMemberDisplayName('First Alias', 'm1');
    expect(firstSave.ok).toBe(true);

    const blocked = saveMemberDisplayName('Second Alias', 'm1');
    expect(blocked.ok).toBe(false);
    expect(blocked.message).toContain('30 days');

    const eligibility = readDisplayNameChangeEligibility('m1', verifiedMember);
    expect(eligibility.allowed).toBe(false);
    expect(eligibility.daysRemaining).toBeGreaterThan(0);
  });

  it('allows a new display name after the 30-day cooldown expires', async () => {
    const { saveMemberDisplayName } = await import('./member-display-name-store.js');

    const verifiedMember = {
      id: 'm1',
      surfaceType: 'member' as const,
      avatarSeed: 'RB',
      name: 'Robbos',
      signal: 'Green' as const,
      tier: 'Pro' as const,
      badge: 'Top Helper',
    };

    saveMemberDisplayName('Cooldown Alias', 'm1');

    window.localStorage.setItem(
      'nami.member.display-name-history',
      JSON.stringify({
        m1: [{ name: 'Cooldown Alias', changedAtMs: Date.now() - 31 * 24 * 60 * 60 * 1000 }],
      })
    );

    const { readDisplayNameChangeEligibility } = await import('./member-display-name-store.js');

    expect(readDisplayNameChangeEligibility('m1', verifiedMember).allowed).toBe(true);
    expect(saveMemberDisplayName('Fresh Alias', 'm1').ok).toBe(true);
  });
});