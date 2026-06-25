import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();

  vi.stubGlobal('window', {
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => undefined,
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
});

describe('owner submitted ticket queue', () => {
  it('keeps orphaned submitted tickets visible in the open queue', async () => {
    const { enqueueSubmittedTicket, readOpenSubmittedTickets } = await import(
      './owner-submitted-tickets-store.js'
    );

    enqueueSubmittedTicket({
      id: 'orphan-ticket-1',
      kind: 'game-ticket',
      title: 'Mystery Game Ticket',
      description: 'Studio · studio@example.com',
      channelId: null,
      coverUrl: null,
      duration: null,
      submitterLabel: 'Studio',
      submitterDetail: '72% trust',
      referenceId: 'orphan-ticket-1',
      submittedAtMs: Date.now(),
    });

    const openTickets = readOpenSubmittedTickets();

    expect(openTickets).toHaveLength(1);
    expect(openTickets[0]?.title).toBe('Mystery Game Ticket');
  });
});