import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  canCreateAudienceSubchannel,
  createAudienceSubchannel,
  maxAudienceSubchannelsForTier,
  readMemberAudienceSubchannels,
  renameAudienceSubchannel,
  setAudienceSubchannelVoiceEnabled,
} from './member-audience-subchannels-store.js';
import type { NamiMember } from './uiMockData.js';

function member(tier: NamiMember['tier']): NamiMember {
  return {
    id: 'm1',
    name: 'River',
    avatarSeed: 'river',
    signal: 'Green',
    tier,
    badge: 'Founder',
  };
}

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
      return store.get(key) ?? null;
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

describe('member audience subchannels', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('assigns tier limits', () => {
    expect(maxAudienceSubchannelsForTier('Elite')).toBe(4);
    expect(maxAudienceSubchannelsForTier('Pro')).toBe(3);
    expect(maxAudienceSubchannelsForTier('Adventurer')).toBe(1);
    expect(maxAudienceSubchannelsForTier('NPC')).toBe(0);
  });

  it('creates editable titled subchannels with voice toggle', () => {
    createAudienceSubchannel(member('Pro'), 'Coaches');
    const channels = readMemberAudienceSubchannels('m1');

    expect(channels).toHaveLength(1);
    expect(channels[0]?.title).toBe('Coaches');

    renameAudienceSubchannel('m1', channels[0]!.id, 'VIP Coaches');
    setAudienceSubchannelVoiceEnabled('m1', channels[0]!.id, true);

    const updated = readMemberAudienceSubchannels('m1')[0];

    expect(updated?.title).toBe('VIP Coaches');
    expect(updated?.voiceChatEnabled).toBe(true);
  });

  it('enforces the pro tier cap', () => {
    createAudienceSubchannel(member('Pro'), 'One');
    createAudienceSubchannel(member('Pro'), 'Two');
    createAudienceSubchannel(member('Pro'), 'Three');

    expect(canCreateAudienceSubchannel(member('Pro'))).toBe(false);
    expect(createAudienceSubchannel(member('Pro'), 'Four').ok).toBe(false);
  });
});