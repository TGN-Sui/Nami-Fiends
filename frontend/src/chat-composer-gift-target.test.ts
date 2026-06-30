import { describe, expect, it } from 'vitest';

import {
  channelChatGiftTarget,
  globalChatGiftTarget,
  guildChatGiftTarget,
  memberChatGiftTarget,
} from './chat-composer-gift-target.js';
import { officialNamiGlobalChat } from './global-chats.js';
import { members, channels } from './uiMockData.js';

describe('chat-composer-gift-target', () => {
  it('builds member gift targets for direct messages', () => {
    const member = members[1]!;

    expect(memberChatGiftTarget(member)).toEqual({
      targetType: 'member',
      targetMember: member,
    });
  });

  it('builds stream gift targets for global chats', () => {
    const target = globalChatGiftTarget(officialNamiGlobalChat);

    expect(target.targetType).toBe('stream');
    expect(target.streamKey).toBe('global-chat:' + officialNamiGlobalChat.id);
    expect(target.targetMember.name).toBeTruthy();
  });

  it('builds stream gift targets for channel chats', () => {
    const channel = channels[0]!;
    const target = channelChatGiftTarget(channel);

    expect(target.targetType).toBe('stream');
    expect(target.streamKey).toBe('channel:' + channel.id);
    expect(target.channelOwnerMemberId).toBeTruthy();
  });

  it('builds stream gift targets for guild chats', () => {
    const target = guildChatGiftTarget({
      id: 'guild-test',
      name: 'Wave Raiders',
      ownerMemberId: members[0]!.id,
      memberIds: [members[0]!.id],
      isPublic: true,
    });

    expect(target.targetType).toBe('stream');
    expect(target.streamKey).toBe('guild:guild-test');
    expect(target.targetMember.id).toBe(members[0]!.id);
  });
});