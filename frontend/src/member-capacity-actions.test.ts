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

describe('member capacity action visibility', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      sessionStorage: createLocalStorageMock(),
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('hides channel boost actions for NPC members', async () => {
    const { canShowChannelBoostAction } = await import('./channel-boost-store.js');
    const { getSelfMember } = await import('./member-access.js');

    const member = { ...getSelfMember(), tier: 'NPC' as const };

    expect(canShowChannelBoostAction(member, 'fiends')).toBe(false);
  });

  it('returns false when no squads can invite the target member', async () => {
    const { canInviteMemberToAnySquad } = await import('./squad-roster-store.js');
    const { members } = await import('./uiMockData.js');

    const target = members.find((member) => member.id === 'm1');

    expect(target).toBeDefined();
    expect(canInviteMemberToAnySquad(target!)).toBe(false);
  });
});