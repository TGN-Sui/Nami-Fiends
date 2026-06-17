import { members } from './uiMockData.js';
import { readMessageThreads, threadMessagesForMember } from './messages-store.js';

export type MessageThread = {
  id: string;
  memberId: string;
  memberName: string;
  preview: string;
  updatedAt: string;
  unread: number;
};

export type ThreadMessage = {
  id: string;
  author: string;
  body: string;
  time: string;
  signal: import('./uiMockData.js').ConductSignal;
  outgoing: boolean;
};

export function getMessageThreads(): MessageThread[] {
  return readMessageThreads().map((thread) => ({
    id: 'thread-' + thread.memberId,
    memberId: thread.memberId,
    memberName: thread.memberName,
    preview: thread.preview,
    updatedAt: thread.updatedAt,
    unread: thread.unread,
  }));
}

export function threadMessagesFor(memberId: string, _memberName: string): ThreadMessage[] {
  return threadMessagesForMember(memberId);
}

export function threadParticipantsFor(memberId: string, memberName: string): (typeof members)[number][] {
  const selfMember = members.find((member) => member.id === 'm1') ?? members[0]!;
  const threadMember =
    members.find((member) => member.id === memberId) ??
    members.find((member) => member.name === memberName);

  const participantIds = new Set<string>();
  const storedMessages = threadMessagesForMember(memberId);

  for (const message of storedMessages) {
    const authorMember = members.find((member) => member.name === message.author);

    if (authorMember) {
      participantIds.add(authorMember.id);
    }
  }

  if (threadMember) {
    participantIds.add(threadMember.id);
  }

  participantIds.add(selfMember.id);

  return members.filter((member) => participantIds.has(member.id));
}