import { useSyncExternalStore } from 'react';

import { shouldAutoSeedLocalData } from './app-config.js';
import { playChatSendSfx } from './nami-sfx.js';
import { getSelfMember, isSelfMessageAuthor } from './member-access.js';
import { processMessageTags } from './nami-notifications-store.js';
import { chatMessages, members, type ChatMessage, type ConductSignal } from './uiMockData.js';
import type { ThreadMessage } from './messages-data.js';

const THREADS_KEY = 'nami.user.message-threads';
const CHANNEL_MESSAGES_KEY = 'nami.user.channel-messages';
const GLOBAL_MESSAGES_KEY = 'nami.user.global-chat-messages';
const GUILD_MESSAGES_KEY = 'nami.user.guild-chat-messages';

type StoredThread = {
  memberId: string;
  memberName: string;
  preview: string;
  updatedAt: string;
  unread: number;
  messages: ThreadMessage[];
};

type StoreSnapshot = {
  threads: StoredThread[];
  channelMessages: ChatMessage[];
  globalMessages: Record<string, ChatMessage[]>;
  guildMessages: Record<string, ChatMessage[]>;
  unreadCount: number;
};

const listeners = new Set<() => void>();
let cachedSnapshot: StoreSnapshot | null = null;

function emit(): void {
  cachedSnapshot = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function subscribeMessagesStore(listener: () => void): () => void {
  return subscribe(listener);
}

function nowTime(): string {
  const date = new Date();
  return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
}

function seedThreads(): StoredThread[] {
  return members
    .filter((member) => member.id !== 'm1')
    .map((member, index) => {
      const baseMessages = chatMessages
        .filter((message) => message.author === member.name || isSelfMessageAuthor(message.author))
        .map((message, messageIndex) => ({
          id: member.id + '-seed-' + messageIndex,
          author: isSelfMessageAuthor(message.author) ? getSelfMember().name : message.author,
          body: message.body,
          time: message.time,
          signal: message.signal,
          outgoing: isSelfMessageAuthor(message.author),
        }));

      const preview = baseMessages[baseMessages.length - 1]?.body ?? 'Hey — are you joining tonight?';

      return {
        memberId: member.id,
        memberName: member.name,
        preview,
        updatedAt: baseMessages[baseMessages.length - 1]?.time ?? '12:0' + index,
        unread: index % 3 === 0 ? 2 : 0,
        messages: baseMessages,
      };
    });
}

function readThreads(): StoredThread[] {
  try {
    const stored = window.localStorage.getItem(THREADS_KEY);

    if (!stored) {
      return shouldAutoSeedLocalData() ? seedThreads() : [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return shouldAutoSeedLocalData() ? seedThreads() : [];
    }

    return parsed as StoredThread[];
  } catch {
    return shouldAutoSeedLocalData() ? seedThreads() : [];
  }
}

function writeThreads(threads: StoredThread[]): void {
  window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  emit();
}

function readChannelMessages(): ChatMessage[] {
  try {
    const stored = window.localStorage.getItem(CHANNEL_MESSAGES_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function writeChannelMessages(messages: ChatMessage[]): void {
  window.localStorage.setItem(CHANNEL_MESSAGES_KEY, JSON.stringify(messages));
  emit();
}

function readGlobalMessages(): Record<string, ChatMessage[]> {
  try {
    const stored = window.localStorage.getItem(GLOBAL_MESSAGES_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);

    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, ChatMessage[]>) : {};
  } catch {
    return {};
  }
}

function writeGlobalMessages(messages: Record<string, ChatMessage[]>): void {
  window.localStorage.setItem(GLOBAL_MESSAGES_KEY, JSON.stringify(messages));
  emit();
}

function readGuildMessages(): Record<string, ChatMessage[]> {
  try {
    const stored = window.localStorage.getItem(GUILD_MESSAGES_KEY);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);

    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, ChatMessage[]>) : {};
  } catch {
    return {};
  }
}

function writeGuildMessages(messages: Record<string, ChatMessage[]>): void {
  window.localStorage.setItem(GUILD_MESSAGES_KEY, JSON.stringify(messages));
  emit();
}

function buildSnapshot(): StoreSnapshot {
  const threads = readThreads();

  return {
    threads,
    channelMessages: readChannelMessages(),
    globalMessages: readGlobalMessages(),
    guildMessages: readGuildMessages(),
    unreadCount: threads.reduce((sum, thread) => sum + thread.unread, 0),
  };
}

function getSnapshot(): StoreSnapshot {
  if (!cachedSnapshot) {
    cachedSnapshot = buildSnapshot();
  }

  return cachedSnapshot;
}

export function useMessagesStore(): StoreSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function getUnreadCountSnapshot(): number {
  return getSnapshot().unreadCount;
}

export function useMessageUnreadCount(): number {
  return useSyncExternalStore(subscribe, getUnreadCountSnapshot, getUnreadCountSnapshot);
}

export function readMessageThreads(): StoredThread[] {
  return readThreads();
}

export function readTotalUnreadCount(): number {
  return readThreads().reduce((sum, thread) => sum + thread.unread, 0);
}

export function markThreadRead(memberId: string): void {
  const threads = readThreads().map((thread) => {
    if (thread.memberId !== memberId) {
      return thread;
    }

    return {
      ...thread,
      unread: 0,
    };
  });

  writeThreads(threads);
}

export function appendChannelChatMessage(
  body: string,
  author = getSelfMember().name,
  signal: ConductSignal = 'Green'
): ChatMessage {
  const message: ChatMessage = {
    id: 'user-cm-' + Date.now(),
    time: nowTime(),
    author,
    signal,
    body: body.trim(),
  };

  writeChannelMessages([...readChannelMessages(), message]);
  processMessageTags({
    body: message.body,
    authorName: author,
    context: 'channel',
    contextLabel: 'Game Chat',
  });
  playChatSendSfx();
  return message;
}

export function readChannelChatMessages(): ChatMessage[] {
  return readChannelMessages();
}

export function appendGlobalChatMessage(
  chatId: string,
  body: string,
  author = getSelfMember().name,
  signal: ConductSignal = 'Green'
): ChatMessage {
  const message: ChatMessage = {
    id: 'user-gc-' + chatId + '-' + Date.now(),
    time: nowTime(),
    author,
    signal,
    body: body.trim(),
  };

  const globalMessages = readGlobalMessages();

  writeGlobalMessages({
    ...globalMessages,
    [chatId]: [...(globalMessages[chatId] ?? []), message],
  });

  processMessageTags({
    body: message.body,
    authorName: author,
    context: 'global',
    contextLabel: 'Global Chat · ' + chatId,
  });
  playChatSendSfx();
  return message;
}

export function appendGuildChatMessage(
  guildId: string,
  guildName: string,
  body: string,
  author = getSelfMember().name,
  signal: ConductSignal = 'Green'
): ChatMessage {
  const message: ChatMessage = {
    id: 'user-guild-' + guildId + '-' + Date.now(),
    time: nowTime(),
    author,
    signal,
    body: body.trim(),
  };

  const guildMessages = readGuildMessages();

  writeGuildMessages({
    ...guildMessages,
    [guildId]: [...(guildMessages[guildId] ?? []), message],
  });

  processMessageTags({
    body: message.body,
    authorName: author,
    context: 'channel',
    contextLabel: 'Guild Chat · ' + guildName,
  });
  playChatSendSfx();
  return message;
}

const INCOMING_REPLY_SNIPPETS = [
  'Got your message — hopping on now.',
  'Copy that. See you in the lounge.',
  'Nice. I will ping %Alpha Squad.',
  'On it. Want me to invite &Wave Raiders?',
  'Heard you @{selfName} — grabbing a squad slot.',
];

function incomingReplySnippet(): string {
  const template = INCOMING_REPLY_SNIPPETS[Math.floor(Math.random() * INCOMING_REPLY_SNIPPETS.length)]!;

  return template.replace('{selfName}', getSelfMember().name);
}

export function deliverIncomingPrivateMessage(input: {
  memberId: string;
  memberName: string;
  body: string;
  authorName: string;
  signal: ConductSignal;
  markUnread?: boolean;
}): void {
  appendIncomingPrivateMessage(
    input.memberId,
    input.memberName,
    input.body,
    input.authorName,
    input.signal,
    input.markUnread !== false
  );
}

function appendIncomingPrivateMessage(
  memberId: string,
  memberName: string,
  body: string,
  authorName: string,
  signal: ConductSignal,
  markUnread = true
): void {
  const incoming: ThreadMessage = {
    id: 'in-' + Date.now(),
    author: authorName,
    body,
    time: nowTime(),
    signal,
    outgoing: false,
  };

  const threads = readThreads();
  const existing = threads.find((thread) => thread.memberId === memberId);

  if (existing) {
    writeThreads(
      threads.map((thread) => {
        if (thread.memberId !== memberId) {
          return thread;
        }

        return {
          ...thread,
          preview: body,
          updatedAt: incoming.time,
          unread: markUnread ? thread.unread + 1 : thread.unread,
          messages: [...thread.messages, incoming],
        };
      })
    );
    return;
  }

  writeThreads([
    {
      memberId,
      memberName,
      preview: body,
      updatedAt: incoming.time,
      unread: markUnread ? 1 : 0,
      messages: [incoming],
    },
    ...threads,
  ]);
}

function scheduleIncomingThreadReply(memberId: string, memberName: string): void {
  const member = members.find((entry) => entry.id === memberId);

  if (!member) {
    return;
  }

  const delayMs = 1400 + Math.floor(Math.random() * 2200);

  window.setTimeout(() => {
    const body = incomingReplySnippet();

    appendIncomingPrivateMessage(memberId, memberName, body, member.name, member.signal);
    processMessageTags({
      body,
      authorName: member.name,
      context: 'private',
      contextLabel: 'Private message · ' + memberName,
    });
  }, delayMs);
}

export function readGlobalChatOverlay(chatId: string): ChatMessage[] {
  return readGlobalMessages()[chatId] ?? [];
}

export function readGuildChatMessages(guildId: string): ChatMessage[] {
  return readGuildMessages()[guildId] ?? [];
}

export function sendPrivateMessage(memberId: string, memberName: string, body: string): void {
  const trimmed = body.trim();

  if (!trimmed) {
    return;
  }

  const selfMember = getSelfMember();
  const outgoing: ThreadMessage = {
    id: 'out-' + Date.now(),
    author: selfMember.name,
    body: trimmed,
    time: nowTime(),
    signal: selfMember.signal,
    outgoing: true,
  };

  const threads = readThreads();
  const existing = threads.find((thread) => thread.memberId === memberId);

  if (existing) {
    writeThreads(
      threads.map((thread) => {
        if (thread.memberId !== memberId) {
          return thread;
        }

        return {
          ...thread,
          preview: trimmed,
          updatedAt: outgoing.time,
          messages: [...thread.messages, outgoing],
        };
      })
    );
    processMessageTags({
      body: trimmed,
      authorName: selfMember.name,
      context: 'private',
      contextLabel: 'Private message · ' + memberName,
    });
    playChatSendSfx();
    scheduleIncomingThreadReply(memberId, memberName);
    return;
  }

  writeThreads([
    {
      memberId,
      memberName,
      preview: trimmed,
      updatedAt: outgoing.time,
      unread: 0,
      messages: [outgoing],
    },
    ...threads,
  ]);

  processMessageTags({
    body: trimmed,
    authorName: selfMember.name,
    context: 'private',
    contextLabel: 'Private message · ' + memberName,
  });
  playChatSendSfx();
  scheduleIncomingThreadReply(memberId, memberName);
}

export function threadMessagesForMember(memberId: string): ThreadMessage[] {
  return readThreads().find((thread) => thread.memberId === memberId)?.messages ?? [];
}