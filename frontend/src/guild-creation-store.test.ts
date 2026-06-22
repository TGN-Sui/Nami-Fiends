import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetApprovalRequestsForTests } from './approval-requests-store.js';

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
import {
  cofounderPendingGuildApprovals,
  creatorPendingGuildProposals,
  getGuildCreationCooldown,
  resetGuildCreationStateForTests,
  respondToGuildCreationProposal,
  submitGuildCreationProposal,
} from './guild-creation-store.js';

vi.mock('./member-access.js', () => ({
  getSelfMember: vi.fn(() => ({
    id: 'm1',
    name: 'Robbos',
    signal: 'Green',
    tier: 'Pro',
    badge: 'Top Helper',
    surfaceType: 'member',
    avatarSeed: 'NO',
  })),
  isMemberVerified: (member: { signal: string; tier: string }) =>
    member.signal === 'Green' && member.tier !== 'NPC',
  memberFeatureTier: (member: { tier: string }) => member.tier,
  SELF_MEMBER_ID: 'm1',
}));

vi.mock('./messages-store.js', () => ({
  deliverIncomingPrivateMessage: vi.fn(),
}));

describe('guild-creation-store', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: createLocalStorageMock() });
    resetGuildCreationStateForTests();
    resetApprovalRequestsForTests();
  });

  afterEach(() => {
    resetGuildCreationStateForTests();
    resetApprovalRequestsForTests();
    vi.clearAllMocks();
  });

  it('scopes pending visibility to creator and invited cofounders only', () => {
    const created = submitGuildCreationProposal({
      proposedName: 'Wave Raiders II',
      isPublic: true,
      cofounderMemberIds: ['m6', 'm8'],
    });

    expect(created.ok).toBe(true);

    expect(creatorPendingGuildProposals('m1')).toHaveLength(1);
    expect(cofounderPendingGuildApprovals('m6')).toHaveLength(1);
    expect(cofounderPendingGuildApprovals('m8')).toHaveLength(1);
    expect(cofounderPendingGuildApprovals('m9')).toHaveLength(0);
    expect(creatorPendingGuildProposals('m6')).toHaveLength(0);
  });

  it('removes cofounder pending notification after they approve', () => {
    submitGuildCreationProposal({
      proposedName: 'Wave Raiders II',
      isPublic: true,
      cofounderMemberIds: ['m6', 'm8'],
    });

    const approved = respondToGuildCreationProposal(
      creatorPendingGuildProposals('m1')[0]!.id,
      'm6',
      'approved'
    );

    expect(approved.ok).toBe(true);
    expect(cofounderPendingGuildApprovals('m6')).toHaveLength(0);
    expect(cofounderPendingGuildApprovals('m8')).toHaveLength(1);
    expect(creatorPendingGuildProposals('m1')).toHaveLength(1);
  });

  it('ends pending guild creation and applies cooldown after three declines', () => {
    const cofounderSets: Array<[string, string]> = [
      ['m6', 'm8'],
      ['m6', 'm9'],
      ['m8', 'm9'],
    ];

    for (const cofounderMemberIds of cofounderSets) {
      const created = submitGuildCreationProposal({
        proposedName: 'Failed Guild ' + cofounderMemberIds.join('-'),
        isPublic: false,
        cofounderMemberIds,
      });

      expect(created.ok).toBe(true);

      const declined = respondToGuildCreationProposal(
        created.proposal.id,
        cofounderMemberIds[0],
        'declined'
      );

      expect(declined.ok).toBe(true);
      expect(declined.proposal.status).toBe('declined');
      expect(creatorPendingGuildProposals('m1')).toHaveLength(0);
    }

    const cooldown = getGuildCreationCooldown('m1');

    expect(cooldown.blocked).toBe(true);
    expect(cooldown.failureCount).toBe(3);

    const blocked = submitGuildCreationProposal({
      proposedName: 'Cooldown Guild',
      isPublic: true,
      cofounderMemberIds: ['m6', 'm8'],
    });

    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.reason).toContain('cooldown');
    }
  });
});