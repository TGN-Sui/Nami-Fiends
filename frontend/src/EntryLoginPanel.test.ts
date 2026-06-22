import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./app-config.js', () => ({
  isTestLaunchMode: () => true,
}));

vi.mock('./contact-code-verification-store.js', () => ({
  isContactVerificationAvailable: () => true,
  isContactVerified: () => false,
}));

vi.mock('./x-verification-store.js', () => ({
  authorizeXAccount: vi.fn(),
  isXVerificationMockEnabled: () => false,
  useXVerificationState: () => ({ handle: null, verified: false }),
}));

vi.mock('./wallet.js', () => ({
  useProtocolOwner: () => ({ owner: null, source: null }),
  ZkLoginConnectControl: () => null,
}));

vi.mock('./ContactCodeVerificationControl.js', () => ({
  ContactCodeVerificationControl: () => null,
}));

vi.mock('./onboarding-recovery.js', () => ({
  recoveryEmailOnboardingHint: () => 'recovery hint',
  zkLoginAccountLinkHint: () => 'link hint',
}));

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

describe('member session login helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      sessionStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects returning accounts without email re-verification', async () => {
    window.localStorage.setItem(
      'nami.member.accounts',
      JSON.stringify({
        'owner@example.com': {
          displayName: 'Owner',
          email: 'owner@example.com',
          archetype: 2,
          archetypeLabel: 'Cozy Voyager',
          flavorBadgeId: 'Hearth Basic',
          quizAnswers: {},
          issuedPlayerScore: 0,
          issuedPlayerScoreTier: 'basic',
          playerScoreIssuedAtMs: 1,
          signedUpAtMs: 1,
        },
      })
    );

    const { hasRegisteredMemberAccount } = await import('./member-session-store.js');

    expect(hasRegisteredMemberAccount('owner@example.com')).toBe(true);
  });
});