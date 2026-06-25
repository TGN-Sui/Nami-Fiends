import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();

vi.stubGlobal('window', {
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  setTimeout: (callback: () => void) => {
    callback();
    return 0;
  },
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
  },
});

vi.mock('./app-config.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./app-config.js')>();

  return {
    ...actual,
    shouldAutoSeedLocalData: () => false,
    shouldUseDevFixtures: () => false,
  };
});

vi.mock('./member-access.js', () => ({
  SELF_MEMBER_ID: 'm1',
  canSendPrivateMessages: () => true,
  getSelfMember: () => ({
    id: 'm1',
    name: 'Self',
    signal: 'Green',
    tier: 'Pro',
    badge: 'Founder',
  }),
  isSelfMessageAuthor: (authorName: string) => authorName === 'Self',
}));

vi.mock('./nami-notifications-store.js', () => ({
  processMessageTags: () => undefined,
}));

vi.mock('./nami-sfx.js', () => ({
  playChatSendSfx: () => undefined,
}));

vi.mock('./guild-space-members.js', () => ({
  discoverableGuildSpaceMembers: () => [
    { id: 'm1', name: 'Self', tier: 'Pro', badge: 'Founder' },
    { id: 'm2', name: 'Zara', tier: 'Elite', badge: 'Raider' },
    { id: 'm3', name: 'Kai', tier: 'Pro', badge: 'Pilot' },
  ],
}));

describe('message-compose', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('excludes the signed-in member from compose candidates', async () => {
    const { messageComposeCandidates } = await import('./message-compose.js');

    expect(messageComposeCandidates().map((member) => member.id)).toEqual(['m3', 'm2']);
  });

  it('creates an empty thread when ensurePrivateThread is called', async () => {
    const { ensurePrivateThread } = await import('./messages-store.js');
    const { EMPTY_THREAD_PREVIEW } = await import('./message-compose.js');

    ensurePrivateThread('m2', 'Zara');

    const stored = JSON.parse(storage.get('nami.user.message-threads') ?? '[]') as Array<{
      memberId: string;
      preview: string;
      messages: unknown[];
    }>;

    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      memberId: 'm2',
      preview: EMPTY_THREAD_PREVIEW,
      messages: [],
    });
  });

  it('does not duplicate an existing thread', async () => {
    const { ensurePrivateThread } = await import('./messages-store.js');

    storage.set(
      'nami.user.message-threads',
      JSON.stringify([
        {
          memberId: 'm2',
          memberName: 'Zara',
          preview: 'Existing preview',
          updatedAt: '12:00',
          unread: 0,
          messages: [],
        },
      ])
    );

    ensurePrivateThread('m2', 'Zara');

    const stored = JSON.parse(storage.get('nami.user.message-threads') ?? '[]') as Array<{
      preview: string;
    }>;

    expect(stored).toHaveLength(1);
    expect(stored[0]?.preview).toBe('Existing preview');
  });
});