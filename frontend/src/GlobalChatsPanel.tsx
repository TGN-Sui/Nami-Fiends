import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';

import {
  readGenreChatDockSize,
  saveGenreChatDockCollapsed,
  saveGenreChatDockPinned,
  saveGenreChatDockSize,
  type GenreChatDockSize,
} from './gamehub-preferences.js';
import {
  canManageTemporaryGlobalChats,
  canSendChatMessages,
  canSendOfficialChatMessages,
  getChatPresenceMembers,
  messageBubbleClass,
  resolveChatMessageAuthorLabel,
  resolveMessageAuthorMember,
} from './member-access.js';
import { useSelfMember } from './member-avatar-store.js';
import {
  formatGlobalChatPresenceMeta,
  resolveGlobalChatLiveStats,
  useGlobalChatLiveStats,
} from './chat-live-stats.js';
import { recordGenreWeeklyChatter, useGenreChatActivityVersion } from './genre-chat-activity-store.js';
import { useMemberChatTimeTracker, useMemberChatTimeVersion } from './member-chat-time-store.js';
import {
  canOfficialOwnerModerateGlobalChat,
  filterModeratedGlobalChats,
  moderateDeleteGlobalChat,
  useGlobalChatModerationStore,
} from './global-chat-moderation-store.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { memberPassportTierLabel } from './owner-passport-display.js';
import { readSignedInOwner } from './member-access.js';
import {
  startSharedGlobalChatPolling,
  useSharedGlobalChatSyncSignal,
} from './global-chat-messages-sync.js';
import { appendGlobalChatMessage, removeGlobalChatMessages } from './messages-store.js';
import {
  useChatAutoScroll,
  useChatViewportPause,
  useFrozenChatMessages,
  usePausedMessagesStoreSignal,
} from './use-chat-viewport.js';
import {
  chatMemberCardTierClass,
  ConductSignalDot,
  UniformMemberAvatar,
  UniformMemberAvatarButton,
} from './member-avatar.js';
import {
  canCreateTemporaryChat,
  genreOfficialChats,
  getGlobalChatMessages,
  globalChatListCreatorLine,
  globalChatPresenceKindLabel,
  globalChatSurfaceLabel,
  listHubGlobalChats,
  OFFICIAL_NAMI_GLOBAL_CHAT_ID,
  type GlobalChatRoom,
} from './global-chats.js';
import { ChatComposerWithEmojis } from './ChatComposerWithEmojis.js';
import { ChatWindowExpandable } from './ChatWindowExpandable.js';
import { GenreChatBroadcastAside } from './GenreChatBroadcastAside.js';
import { hasTaggedGenreBroadcasts } from './genre-chat-broadcasts.js';
import { tagSuggestionHint } from './nami-tag-registry.js';
import { useChannelEmojiLibraryVersion } from './channel-custom-emojis-store.js';
import { readChannelEmojisForGenreLounge } from './channel-genre-emoji-scope.js';
import { TaggedMessageBody, type TagNavigationHandlers } from './TaggedMessageBody.js';
import { members, type NamiMember } from './uiMockData.js';

type GlobalChatsPanelProps = {
  onOpenMember: (member: NamiMember) => void;
  tagHandlers?: TagNavigationHandlers;
};

function genreChatExpandProps(
  chat: GlobalChatRoom,
  options?: { compact?: boolean }
): {
  renderExpandedAside?: () => ReactElement;
  expandedChatNotice?: ReactElement;
  expandedChatHeading?: ReactElement;
} {
  const expandedHeading = (
    <div className="chat-window-expanded-heading-copy is-centered-hub-chat-heading">
      <h2>{chat.title}</h2>
      <p>
        Genre lounge · {resolveGlobalChatLiveStats(chat).weeklyActive.toLocaleString()} active this week
        {options?.compact === true ? ' in lounge' : ''}
      </p>
    </div>
  );

  if (hasTaggedGenreBroadcasts(chat)) {
    return {
      expandedChatHeading: expandedHeading,
      renderExpandedAside: () => <GenreChatBroadcastAside chat={chat} isExpanded={true} />,
    };
  }

  return {
    expandedChatHeading: expandedHeading,
    expandedChatNotice: (
      <p>
        No tagged live streams in {chat.title} yet. Expanded view is chat-only until members
        publish streams with matching tags.
      </p>
    ),
  };
}

export function GlobalChatRoomView(props: {
  chat: GlobalChatRoom;
  onOpenMember: (member: NamiMember) => void;
  tagHandlers?: TagNavigationHandlers;
  onClose?: () => void;
  compact?: boolean;
  showCompactHead?: boolean;
  expandedAside?: ReactNode;
  renderExpandedAside?: () => ReactNode;
  expandedChatNotice?: ReactNode;
  expandedChatHeading?: ReactNode;
  onChatExpandedChange?: (expanded: boolean) => void;
  onChatEscape?: () => boolean | void;
  onModerationDelete?: () => void;
}): ReactElement {
  const selfMember = useSelfMember();
  const connectedOwner = readSignedInOwner();
  const chatTimeTarget = useMemo(
    () => ({
      chatId: props.chat.id,
      chatTitle:
        props.chat.kind === 'genre' ? props.chat.title + ' Lounge' : props.chat.title,
      surfaceLabel: globalChatSurfaceLabel(props.chat),
    }),
    [props.chat]
  );
  useMemberChatTimeTracker(selfMember.id, chatTimeTarget);
  useEffect(() => {
    if (props.chat.kind !== 'genre') {
      return;
    }

    recordGenreWeeklyChatter(props.chat.id, selfMember.id);
  }, [props.chat.id, props.chat.kind, selfMember.id]);
  const canOwnerModerateChat = canOfficialOwnerModerateGlobalChat(props.chat, connectedOwner);
  const presenceKindLabel = globalChatPresenceKindLabel(props.chat);
  const liveStats = useGlobalChatLiveStats(props.chat);
  const presenceMeta = formatGlobalChatPresenceMeta(props.chat);
  useChannelEmojiLibraryVersion();
  const genreEmojis =
    props.chat.kind === 'genre' && props.chat.genre
      ? readChannelEmojisForGenreLounge(props.chat.genre)
      : [];
  const { paused, resumeCount, viewportRef, messageStackRef } = useChatViewportPause();
  const storeSignal = usePausedMessagesStoreSignal(paused);
  const sharedSignal = useSharedGlobalChatSyncSignal();
  const computeMessages = useCallback(
    () => getGlobalChatMessages(props.chat.id),
    [props.chat.id, sharedSignal]
  );
  const messages = useFrozenChatMessages(paused, resumeCount, storeSignal + sharedSignal, computeMessages);

  useEffect(() => startSharedGlobalChatPolling(props.chat.id), [props.chat.id]);
  const isOwner = props.chat.createdBy === selfMember.name;
  const [draft, setDraft] = useState('');
  const canSend = props.chat.isOfficial ? canSendOfficialChatMessages() : canSendChatMessages();

  useChatAutoScroll(messageStackRef, {
    paused,
    resumeCount,
    messageCount: messages.length,
  });
  const visibleMembers = getChatPresenceMembers(selfMember, members);

  function sendMessage(): void {
    if (!canSend || !draft.trim()) {
      return;
    }

    appendGlobalChatMessage(props.chat.id, draft);
    setDraft('');
  }

  const chatWindowBody = (
    <>
      {!props.compact && props.chat.kind !== 'genre' ? (
        <div className="chat-window-heading">
          <div>
            <h2>{props.chat.title}</h2>
            <p>{messages.length} messages · live global room</p>
          </div>
        </div>
      ) : null}

      <div className="global-chat-conversation">
      <div className="message-stack global-message-stack" ref={messageStackRef}>
        {messages.map((message) => {
          const member = resolveMessageAuthorMember(message, selfMember);
          const authorLabel = resolveChatMessageAuthorLabel(message, selfMember, member);

          return (
            <div className="chat-message-row" key={message.id}>
              {member ? (
                <UniformMemberAvatarButton
                  member={member}
                  onClick={() => props.onOpenMember(member)}
                  signal={message.signal}
                />
              ) : (
                <span className="message-avatar">??</span>
              )}

              <div className={'message-bubble' + messageBubbleClass(member, authorLabel)}>
                <div className="message-meta">
                  <button
                    className={'message-author-button signal-text-' + message.signal.toLowerCase()}
                    onClick={() => member && props.onOpenMember(member)}
                    type="button"
                  >
                    {authorLabel}
                  </button>
                  <span>{message.time}</span>
                  <ConductSignalDot signal={message.signal} size="sm" />
                </div>
                <p>
                  <TaggedMessageBody
                    body={message.body}
                    {...(genreEmojis.length > 0 ? { customEmojis: genreEmojis } : {})}
                    {...(props.tagHandlers ? { handlers: props.tagHandlers } : {})}
                  />
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <ChatComposerWithEmojis
        ariaLabel="Message global chat"
        canSend={canSend}
        className="chat-composer-row global-chat-composer-bar"
        {...(genreEmojis.length > 0
          ? {
              customEmojis: genreEmojis,
              emojiPickerLabel: props.chat.title + ' genre emojis',
            }
          : {})}
        onChange={setDraft}
        onSend={sendMessage}
        placeholder={
          canSend
            ? props.chat.isOfficial
              ? 'Say something to the official room… · ' + tagSuggestionHint()
              : 'Say something to the room… · ' + tagSuggestionHint()
            : 'Sign in and verify to send official chat messages'
        }
        sendButtonClassName="global-chat-send-button"
        value={draft}
      />

      {props.chat.voiceEnabled && isOwner ? (
        <div className="global-chat-voice-controls">
          <button className="secondary-action" type="button">
            Mute all voice
          </button>
          <button className="secondary-action" type="button">
            Mute selected
          </button>
        </div>
      ) : null}
      </div>
    </>
  );

  return (
    <div
      className={'global-chat-room-pane' + (props.compact ? ' is-compact-global-chat' : '')}
      ref={viewportRef}
    >
      {props.compact ? (
        props.showCompactHead !== false ? (
          <div className="global-chat-compact-head">
            <div className="global-chat-compact-title-row">
              <strong>{props.chat.title}</strong>
              <span className="global-chat-compact-meta">
                {liveStats.membersInside.toLocaleString()} inside
              </span>
            </div>
            {props.onClose ? (
              <button className="nami-surface-button global-chat-compact-close" onClick={props.onClose} type="button">
                Close
              </button>
            ) : null}
          </div>
        ) : null
      ) : (
        <div className="chat-presence-rail is-hub-chat-presence-rail">
          <div className="chat-presence-channel is-hub-chat-presence-channel">
            <div className="global-chat-presence-copy is-centered-hub-chat-heading">
              {presenceKindLabel ? <span className="mini-badge">{presenceKindLabel}</span> : null}
              <h2>{props.chat.title}</h2>
              <p>{presenceMeta}</p>
            </div>
          </div>

          <div className="global-chat-presence-actions">
            {props.onClose ? (
              <button className="secondary-action" onClick={props.onClose} type="button">
                Close
              </button>
            ) : null}
            {canOwnerModerateChat ? (
              <button
                className="danger-action global-chat-owner-delete"
                onClick={() => {
                  const result = moderateDeleteGlobalChat(props.chat.id, connectedOwner);

                  if (result.ok) {
                    removeGlobalChatMessages(props.chat.id);
                    props.onModerationDelete?.();
                    props.onClose?.();
                  }
                }}
                title="Official owner moderation — permanently remove this community chat"
                type="button"
              >
                Delete chat
              </button>
            ) : null}
          </div>

          <div className="chat-member-strip">
            {visibleMembers.map((member) => (
              <button
                className={'chat-member-card' + chatMemberCardTierClass(member)}
                key={member.id}
                onClick={() => props.onOpenMember(member)}
                type="button"
              >
                <UniformMemberAvatar member={member} />
                <strong>{member.name}</strong>
                <span>{memberPassportTierLabel(member, connectedOwner)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <ChatWindowExpandable
        {...(props.chat.kind === 'genre' ? { className: 'chat-theme-ocean' } : {})}
        {...(props.expandedAside ? { expandedAside: props.expandedAside } : {})}
        {...(props.renderExpandedAside ? { renderExpandedAside: props.renderExpandedAside } : {})}
        {...(props.expandedChatNotice ? { expandedNotice: props.expandedChatNotice } : {})}
        {...(props.expandedChatHeading ? { expandedHeading: props.expandedChatHeading } : {})}
        {...(props.onChatExpandedChange ? { onExpandedChange: props.onChatExpandedChange } : {})}
        {...(props.onChatEscape ? { onEscape: props.onChatEscape } : {})}
      >
        {chatWindowBody}
      </ChatWindowExpandable>
    </div>
  );
}

export function GenreChatRoomPanel(props: {
  activeChatId: string;
  onOpenMember: (member: NamiMember) => void;
  tagHandlers?: TagNavigationHandlers;
  compact?: boolean;
}): ReactElement {
  const activeChat =
    genreOfficialChats.find((chat) => chat.id === props.activeChatId) ?? genreOfficialChats[0]!;

  return (
    <GlobalChatRoomView
      chat={activeChat}
      key={activeChat.id}
      onOpenMember={props.onOpenMember}
        {...genreChatExpandProps(activeChat, { compact: false })}
        showCompactHead={false}
      {...(props.tagHandlers ? { tagHandlers: props.tagHandlers } : {})}
      {...(props.compact ? { compact: true } : {})}
    />
  );
}

export function HubGlobalChatsSection(props: GlobalChatsPanelProps): ReactElement {
  const selfMember = useSelfMember();
  const connectedOwner = readSignedInOwner();
  const isOwner = isOfficialOwner(connectedOwner);
  useGlobalChatModerationStore();
  useMemberChatTimeVersion();
  useGenreChatActivityVersion();
  const [activeChatId, setActiveChatId] = useState(OFFICIAL_NAMI_GLOBAL_CHAT_ID);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [newChatVoice, setNewChatVoice] = useState(false);
  const [extraChats, setExtraChats] = useState<GlobalChatRoom[]>([]);

  const hubChats = useMemo(() => listHubGlobalChats(), []);

  const allChats = useMemo(
    () => filterModeratedGlobalChats([...hubChats, ...extraChats]),
    [extraChats, hubChats]
  );
  const activeChat = allChats.find((chat) => chat.id === activeChatId) ?? hubChats[0]!;

  function createTemporaryChat(): void {
    if (!canCreateTemporaryChat() || !newChatTitle.trim()) {
      return;
    }

    const created: GlobalChatRoom = {
      id: 'temp-' + Date.now(),
      title: newChatTitle.trim(),
      kind: 'temporary',
      createdBy: selfMember.name,
      creatorVerified: true,
      activeMembers: 1,
      voiceEnabled: newChatVoice,
      isOfficial: false,
      closesOnExit: true,
    };

    setExtraChats((current) => [created, ...current]);
    setActiveChatId(created.id);
    setNewChatTitle('');
    setNewChatVoice(false);
    setShowCreateForm(false);
  }

  function closeTemporaryChat(chatId: string): void {
    setExtraChats((current) => current.filter((chat) => chat.id !== chatId));
    removeGlobalChatMessages(chatId);

    if (activeChatId === chatId) {
      setActiveChatId(OFFICIAL_NAMI_GLOBAL_CHAT_ID);
    }
  }

  function ownerDeleteChat(chat: GlobalChatRoom): void {
    const result = moderateDeleteGlobalChat(chat.id, connectedOwner);

    if (!result.ok) {
      return;
    }

    setExtraChats((current) => current.filter((entry) => entry.id !== chat.id));
    removeGlobalChatMessages(chat.id);

    if (activeChatId === chat.id) {
      setActiveChatId(OFFICIAL_NAMI_GLOBAL_CHAT_ID);
    }
  }

  return (
    <article className="panel global-chats-unified-panel">
      <div className="profile-panel-heading is-hub-panel-heading">
        <h2>Global Chats</h2>
        <p>Pick a room and chat in the same panel.</p>
      </div>

      <div className="global-chats-unified-layout">
        <aside className="global-chats-list-sidebar">
          <div className="global-chats-list">
            {allChats.map((chat) => (
              <button
                className={
                  'global-chat-list-row' + (chat.id === activeChatId ? ' is-active-global-chat' : '')
                }
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                type="button"
              >
                <div>
                  <strong>{chat.title}</strong>
                  {globalChatListCreatorLine(chat) ? (
                    <small>{globalChatListCreatorLine(chat)}</small>
                  ) : null}
                </div>
                <span>{resolveGlobalChatLiveStats(chat).membersInside.toLocaleString()} inside</span>
                {chat.closesOnExit &&
                chat.createdBy === selfMember.name &&
                canManageTemporaryGlobalChats(selfMember) ? (
                  <button
                    className="secondary-action global-chat-close-temp"
                    onClick={(event) => {
                      event.stopPropagation();
                      closeTemporaryChat(chat.id);
                    }}
                    type="button"
                  >
                    End
                  </button>
                ) : null}
                {isOwner && canOfficialOwnerModerateGlobalChat(chat, connectedOwner) ? (
                  <button
                    className="danger-action global-chat-owner-delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      ownerDeleteChat(chat);
                    }}
                    title="Official owner moderation — delete this chat"
                    type="button"
                  >
                    Delete
                  </button>
                ) : null}
              </button>
            ))}
          </div>

          {canCreateTemporaryChat() ? (
            <div className="global-chat-create-block">
              {!showCreateForm ? (
                <button className="secondary-action" onClick={() => setShowCreateForm(true)} type="button">
                  Create temporary chat
                </button>
              ) : (
                <div className="global-chat-create-form">
                  <input
                    aria-label="Temporary chat title"
                    onChange={(event) => setNewChatTitle(event.target.value)}
                    placeholder="Room name"
                    value={newChatTitle}
                  />
                  <label className="global-chat-voice-toggle">
                    <input
                      checked={newChatVoice}
                      onChange={(event) => setNewChatVoice(event.target.checked)}
                      type="checkbox"
                    />
                    Enable voice chat
                  </label>
                  <div className="global-chat-create-actions">
                    <button className="primary-action" onClick={createTemporaryChat} type="button">
                      Open room
                    </button>
                    <button className="secondary-action" onClick={() => setShowCreateForm(false)} type="button">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </aside>

        <GlobalChatRoomView
          chat={activeChat}
          key={activeChat.id}
          onModerationDelete={() => ownerDeleteChat(activeChat)}
          onOpenMember={props.onOpenMember}
          {...(props.tagHandlers ? { tagHandlers: props.tagHandlers } : {})}
        />
      </div>
    </article>
  );
}

export function PinnedGenreChatDock(props: {
  activeChatId: string;
  collapsed: boolean;
  pinned: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onPinnedChange: (pinned: boolean) => void;
  onSelectChat: (chatId: string) => void;
  onOpenMember: (member: NamiMember) => void;
  tagHandlers?: TagNavigationHandlers;
}): ReactElement | null {
  const activeChat =
    genreOfficialChats.find((chat) => chat.id === props.activeChatId) ?? genreOfficialChats[0]!;
  const dockLiveStats = useGlobalChatLiveStats(activeChat);

  const [dockSize, setDockSize] = useState<GenreChatDockSize>(() => readGenreChatDockSize());
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent): void {
      if (!resizeRef.current) {
        return;
      }

      const deltaX = event.clientX - resizeRef.current.startX;
      const deltaY = event.clientY - resizeRef.current.startY;

      setDockSize({
        width: Math.min(720, Math.max(280, resizeRef.current.startW + deltaX)),
        height: Math.min(920, Math.max(420, resizeRef.current.startH + deltaY)),
      });
    }

    function handlePointerUp(event: PointerEvent): void {
      if (!resizeRef.current) {
        return;
      }

      const deltaX = event.clientX - resizeRef.current.startX;
      const deltaY = event.clientY - resizeRef.current.startY;

      saveGenreChatDockSize({
        width: Math.min(720, Math.max(280, resizeRef.current.startW + deltaX)),
        height: Math.min(920, Math.max(420, resizeRef.current.startH + deltaY)),
      });

      resizeRef.current = null;
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  if (!props.pinned) {
    return null;
  }

  function toggleCollapsed(nextCollapsed: boolean): void {
    props.onCollapsedChange(nextCollapsed);
    saveGenreChatDockCollapsed(nextCollapsed);
  }

  function unpinDock(): void {
    props.onPinnedChange(false);
    saveGenreChatDockPinned(false);
  }

  function startResize(event: ReactPointerEvent<HTMLButtonElement>): void {
    event.preventDefault();
    resizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startW: dockSize.width,
      startH: dockSize.height,
    };
  }

  const dockContent = props.collapsed ? (
    <button
      aria-expanded={false}
      aria-label={'Open pinned genre chat: ' + activeChat.title}
      className="genre-chat-pinned-tab"
      onClick={() => toggleCollapsed(false)}
      type="button"
    >
      <span className="genre-chat-pinned-tab-label">Genre Chats</span>
      <strong>{activeChat.title}</strong>
      <em>{dockLiveStats.membersInside.toLocaleString()} inside</em>
    </button>
  ) : (
    <aside
      aria-label="Pinned genre chats"
      className="genre-chat-pinned-dock"
      style={{
        width: dockSize.width,
        height: dockSize.height,
        maxHeight: 'calc(100vh - 40px)',
      }}
    >
      <header className="genre-chat-pinned-dock-head genre-chat-pinned-dock-head-compact">
        <strong className="genre-chat-pinned-active-title">{activeChat.title}</strong>
        <div className="genre-chat-pinned-dock-actions">
          <button
            aria-label="Unpin genre chats"
            className="nami-surface-button genre-chat-pinned-unpin"
            onClick={unpinDock}
            type="button"
          >
            Unpin
          </button>
          <button
            aria-label="Collapse genre chats"
            className="nami-surface-button genre-chat-pinned-collapse"
            onClick={() => toggleCollapsed(true)}
            type="button"
          >
            −
          </button>
        </div>
      </header>

      <div className="genre-chat-pinned-room-row" role="tablist" aria-label="Genre chat rooms">
        {genreOfficialChats.map((chat) => (
          <button
            aria-selected={chat.id === activeChat.id}
            className={
              'genre-chat-pinned-room-tab' + (chat.id === activeChat.id ? ' is-active-genre-room' : '')
            }
            key={chat.id}
            onClick={() => props.onSelectChat(chat.id)}
            role="tab"
            type="button"
          >
            {chat.title}
          </button>
        ))}
      </div>

      <GlobalChatRoomView
        chat={activeChat}
        compact
        key={activeChat.id}
        onOpenMember={props.onOpenMember}
        {...genreChatExpandProps(activeChat, { compact: true })}
        showCompactHead={false}
        {...(props.tagHandlers ? { tagHandlers: props.tagHandlers } : {})}
      />

      <button
        aria-label="Resize pinned genre chat"
        className="genre-chat-pinned-resize-handle"
        onPointerDown={startResize}
        type="button"
      />
    </aside>
  );

  return createPortal(
    <div className="genre-chat-pinned-root">{dockContent}</div>,
    document.body
  );
}