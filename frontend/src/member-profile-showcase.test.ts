// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { members } from './uiMockData.js';

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

describe('member-profile-showcase chat presence', () => {
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

  it('uses tier mock chat time when auditing a demo member perspective', async () => {
    window.localStorage.setItem('nami.demo.active-perspective', 'npc');

    const { buildMemberProfileShowcase } = await import('./member-profile-showcase.js');
    const showcase = buildMemberProfileShowcase(members[0]!);

    expect(showcase.chatPresence.length).toBeGreaterThan(0);
    expect(showcase.chatPresence.length).toBeLessThanOrEqual(6);
  });

  it('dedupes chat rows that collapse to the same lounge label', async () => {
    const { recordMemberChatTime } = await import('./member-chat-time-store.js');
    const { buildMemberProfileShowcase } = await import('./member-profile-showcase.js');

    recordMemberChatTime(
      'm1',
      { chatId: 'genre-shooter', chatTitle: 'Shooter Lounge', surfaceLabel: 'Genre Lounge' },
      60 * 60 * 1000
    );
    recordMemberChatTime(
      'm1',
      { chatId: 'shooter-alt', chatTitle: 'Shooter', surfaceLabel: 'Genre Lounge' },
      30 * 60 * 1000
    );

    const showcase = buildMemberProfileShowcase(members[0]!);
    const shooterRows = showcase.chatPresence.filter((row) => row.chatTitle.toLowerCase().includes('shooter'));

    expect(shooterRows).toHaveLength(1);
    expect(shooterRows[0]?.hoursThisWeek).toBeCloseTo(1, 1);
  });
});