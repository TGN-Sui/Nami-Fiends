// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
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

vi.mock('./channel-owner-access.js', () => ({
  isGameChannelOwner: () => false,
}));

vi.mock('./member-access.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./member-access.js')>();

  return {
    ...actual,
    getSelfMember: () => ({
      id: 'm1',
      surfaceType: 'member',
      name: 'Owner',
      avatarSeed: 'OW',
      signal: 'Green',
      tier: 'NPC',
      badge: 'Boss',
      isNamiBoss: true,
    }),
    memberFeatureTier: () => 'Elite' as const,
    isMemberVerified: () => true,
    canSendChatMessages: () => true,
  };
});

async function renderToContainer(element: React.ReactElement): Promise<HTMLDivElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(element);
  });

  return container;
}

describe('guild space detail screens', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scrollTo: vi.fn(),
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('renders squad detail for a squad leader without crashing', async () => {
    window.localStorage.setItem(
      'nami.squad.created-records',
      JSON.stringify([
        {
          id: 'squad-created-test',
          name: 'Raid Team',
          memberIds: ['m1'],
          maxSlots: 3,
        },
      ])
    );

    const { SquadDetailScreen } = await import('./GuildSpaceScreens.js');

    const container = await renderToContainer(
      React.createElement(SquadDetailScreen, {
        squad: {
          id: 'squad-created-test',
          name: 'Raid Team',
          memberIds: ['m1'],
          maxSlots: 3,
        },
        onNavigate: vi.fn(),
        onOpenMember: vi.fn(),
      })
    );

    expect(container.textContent).toContain('Raid Team');
    expect(container.textContent).toContain('Display photo');
  });

  it('renders guild detail for a guild master without crashing', async () => {
    window.localStorage.setItem(
      'nami.guild.created-records',
      JSON.stringify([
        {
          id: 'guild-created-test',
          name: 'Raid Guild',
          ownerMemberId: 'm1',
          memberIds: ['m1'],
          isPublic: true,
        },
      ])
    );

    const { GuildDetailScreen } = await import('./GuildSpaceScreens.js');

    const container = await renderToContainer(
      React.createElement(GuildDetailScreen, {
        guild: {
          id: 'guild-created-test',
          name: 'Raid Guild',
          ownerMemberId: 'm1',
          memberIds: ['m1'],
          isPublic: true,
        },
        onNavigate: vi.fn(),
        onOpenMember: vi.fn(),
      })
    );

    expect(container.textContent).toContain('Raid Guild');
    expect(container.textContent).toContain('Display photo');
  });
});