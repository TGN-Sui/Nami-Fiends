import type { GiftSendTarget } from './GiftSendPanel.js';
import type { GlobalChatRoom } from './global-chats.js';
import { getSelfMember } from './member-access.js';
import type { NamiGuildRecord } from './nami-affiliations.js';
import { members, type NamiChannel, type NamiMember } from './uiMockData.js';

function memberByName(name: string): NamiMember | undefined {
  return members.find((member) => member.name === name);
}

function memberById(memberId: string): NamiMember | undefined {
  return members.find((member) => member.id === memberId);
}

function fallbackGiftHostMember(): NamiMember {
  return (
    members.find((member) => member.isNamiBoss) ??
    members.find((member) => member.isNamiTeam) ??
    getSelfMember()
  );
}

export function memberChatGiftTarget(member: NamiMember): GiftSendTarget {
  return {
    targetType: 'member',
    targetMember: member,
  };
}

export function channelChatGiftTarget(channel: NamiChannel): GiftSendTarget {
  const host =
    memberByName(channel.owner) ?? memberByName(channel.developerName) ?? fallbackGiftHostMember();

  return {
    targetType: 'stream',
    targetMember: host,
    streamKey: 'channel:' + channel.id,
    streamTitle: channel.name + ' chat',
    channelOwnerMemberId: host.id,
  };
}

export function globalChatGiftTarget(chat: GlobalChatRoom): GiftSendTarget {
  const host = memberByName(chat.createdBy) ?? fallbackGiftHostMember();

  return {
    targetType: 'stream',
    targetMember: host,
    streamKey: 'global-chat:' + chat.id,
    streamTitle: chat.title,
    ...(chat.kind === 'genre' ? { channelOwnerMemberId: host.id } : {}),
  };
}

export function guildChatGiftTarget(guild: NamiGuildRecord): GiftSendTarget {
  const host = memberById(guild.ownerMemberId) ?? fallbackGiftHostMember();

  return {
    targetType: 'stream',
    targetMember: host,
    streamKey: 'guild:' + guild.id,
    streamTitle: guild.name + ' guild chat',
    channelOwnerMemberId: host.id,
  };
}