import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { NamiGuildRecord } from './nami-affiliations.js';

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

const createdGuild: NamiGuildRecord = {
  id: 'guild-created-test',
  name: 'Created Guild',
  ownerMemberId: 'm1',
  memberIds: ['m1', 'm2'],
  isPublic: true,
};

vi.mock('./guild-creation-store.js', () => ({
  getCreatedGuildRecords: () => [createdGuild],
}));

vi.mock('./member-access.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./member-access.js')>();

  return {
    ...actual,
    getSelfMember: () => ({
      id: 'm2',
      surfaceType: 'member',
      name: 'Member',
      avatarSeed: 'M2',
      signal: 'Green',
      tier: 'Pro',
      badge: 'Member',
      isNamiBoss: false,
    }),
    isMemberVerified: () => true,
  };
});

describe('guild-invites-store profile visibility', () => {
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

  it('shows guild invite when the member rank has invite permission', async () => {
    window.localStorage.setItem(
      'nami.guild.hierarchy',
      JSON.stringify({
        'guild-created-test': {
          rankTitles: ['Guild Master', 'Officer', 'Member'],
          guildMasterMemberId: 'm1',
          cofounderMemberIds: ['m2'],
          removedMemberIds: [],
          memberRanks: [
            { memberId: 'm1', rankIndex: 0 },
            { memberId: 'm2', rankIndex: 2 },
          ],
          rankPermissions: [
            {
              rankIndex: 0,
              permissions: {
                inviteMembers: true,
                promoteMembers: true,
                demoteMembers: true,
                removeMembers: true,
                createEvents: true,
                editRankTitles: true,
                manageRankPermissions: true,
              },
            },
            {
              rankIndex: 1,
              permissions: {
                inviteMembers: false,
                promoteMembers: false,
                demoteMembers: false,
                removeMembers: false,
                createEvents: false,
                editRankTitles: false,
                manageRankPermissions: false,
              },
            },
            {
              rankIndex: 2,
              permissions: {
                inviteMembers: true,
                promoteMembers: false,
                demoteMembers: false,
                removeMembers: false,
                createEvents: false,
                editRankTitles: false,
                manageRankPermissions: false,
              },
            },
          ],
        },
      })
    );

    const { canShowGuildInviteOnProfile, invitableGuildsForTarget } = await import(
      './guild-invites-store.js'
    );
    const { members } = await import('./uiMockData.js');

    const target = members.find((member) => member.id === 'm3');

    expect(target).toBeDefined();
    expect(canShowGuildInviteOnProfile(target!)).toBe(true);
    expect(invitableGuildsForTarget(target!.id).map((guild) => guild.id)).toEqual(['guild-created-test']);
  });

  it('hides guild invite when the member rank lacks invite permission', async () => {
    window.localStorage.setItem(
      'nami.guild.hierarchy',
      JSON.stringify({
        'guild-created-test': {
          rankTitles: ['Guild Master', 'Officer', 'Member'],
          guildMasterMemberId: 'm1',
          cofounderMemberIds: ['m2'],
          removedMemberIds: [],
          memberRanks: [
            { memberId: 'm1', rankIndex: 0 },
            { memberId: 'm2', rankIndex: 2 },
          ],
          rankPermissions: [
            {
              rankIndex: 0,
              permissions: {
                inviteMembers: true,
                promoteMembers: true,
                demoteMembers: true,
                removeMembers: true,
                createEvents: true,
                editRankTitles: true,
                manageRankPermissions: true,
              },
            },
            {
              rankIndex: 1,
              permissions: {
                inviteMembers: false,
                promoteMembers: false,
                demoteMembers: false,
                removeMembers: false,
                createEvents: false,
                editRankTitles: false,
                manageRankPermissions: false,
              },
            },
            {
              rankIndex: 2,
              permissions: {
                inviteMembers: false,
                promoteMembers: false,
                demoteMembers: false,
                removeMembers: false,
                createEvents: false,
                editRankTitles: false,
                manageRankPermissions: false,
              },
            },
          ],
        },
      })
    );

    const { canShowGuildInviteOnProfile } = await import('./guild-invites-store.js');
    const { members } = await import('./uiMockData.js');

    const target = members.find((member) => member.id === 'm3');

    expect(target).toBeDefined();
    expect(canShowGuildInviteOnProfile(target!)).toBe(false);
  });
});