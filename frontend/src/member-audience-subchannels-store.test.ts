import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  audienceSubchannelRoomId,
  canCreateAudienceSubchannel,
  countCustomAudienceSubchannels,
  createAudienceSubchannel,
  LIVE_CHAT_SLUG,
  maxAudienceSubchannelsForTier,
  readMemberAudienceSubchannels,
  removeAudienceSubchannel,
  renameAudienceSubchannel,
  resetAudienceSubchannelsStoreForTests,
  setAudienceSubchannelVoiceEnabled,
} from './member-audience-subchannels-store.js';
import { memberPublicChatId } from './member-public-chat.js';
import type { NamiMember } from './uiMockData.js';

function member(tier: NamiMember['tier']): NamiMember {
  return {
    id: 'm9',
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
    localStorage.clear();
    resetAudienceSubchannelsStoreForTests();
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

  it('always includes a default Live Chat subchannel', () => {
    const channels = readMemberAudienceSubchannels('m9');

    expect(channels).toHaveLength(1);
    expect(channels[0]?.slug).toBe(LIVE_CHAT_SLUG);
    expect(channels[0]?.kind).toBe('live-chat');
    expect(channels[0]?.title).toBe('Live Chat');
    expect(audienceSubchannelRoomId(channels[0]!, 'm9')).toBe(memberPublicChatId('m9'));
  });

  it('creates editable titled subchannels with voice toggle', () => {
    createAudienceSubchannel(member('Pro'), 'Coaches');
    const channels = readMemberAudienceSubchannels('m9');

    expect(channels).toHaveLength(2);
    expect(channels[1]?.title).toBe('Coaches');
    expect(channels[1]?.kind).toBe('custom');
    expect(countCustomAudienceSubchannels('m9')).toBe(1);

    renameAudienceSubchannel('m9', channels[1]!.id, 'VIP Coaches');
    setAudienceSubchannelVoiceEnabled('m9', channels[1]!.id, true);

    const updated = readMemberAudienceSubchannels('m9')[1];

    expect(updated?.title).toBe('VIP Coaches');
    expect(updated?.voiceChatEnabled).toBe(true);
  });

  it('enforces the pro tier cap for custom channels only', () => {
    createAudienceSubchannel(member('Pro'), 'One');
    createAudienceSubchannel(member('Pro'), 'Two');
    createAudienceSubchannel(member('Pro'), 'Three');

    expect(canCreateAudienceSubchannel(member('Pro'))).toBe(false);
    expect(createAudienceSubchannel(member('Pro'), 'Four').ok).toBe(false);
    expect(readMemberAudienceSubchannels('m9')).toHaveLength(4);
    expect(countCustomAudienceSubchannels('m9')).toBe(3);
  });

  it('cannot remove the default Live Chat subchannel', () => {
    const live = readMemberAudienceSubchannels('m9')[0]!;

    expect(removeAudienceSubchannel('m9', live.id)).toBe(false);
    expect(readMemberAudienceSubchannels('m9')).toHaveLength(1);
  });
});