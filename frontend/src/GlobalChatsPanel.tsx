import {
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
  canSendChatMessages,
  canSendOfficialChatMessages,
  messageBubbleClass,
  resolveMessageAuthorMember,
} from './member-access.js';
import { useSelfMember } from './member-avatar-store.js';
import { appendGlobalChatMessage, useMessagesStore } from './messages-store.js';
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
  hubGlobalChats,
  OFFICIAL_NAMI_GLOBAL_CHAT_ID,
  type GlobalChatRoom,
} from './global-chats.js';
import { ChatComposerWithEmojis } from './ChatComposerWithEmojis.js';
import { ChatWindowExpandable } from './ChatWindowExpandable.js';
import { GenreChatBroadcastAside } from './GenreChatBroadcastAside.js';
import { hasTaggedGenreBroadcasts } from './genre-chat-broadcasts.js';
import { tagSuggestionHint } from './nami-tag-registry.js';
import { TaggedMessageBody, type TagNavigationHandlers } from './TaggedMessageBody.js';
import { members, userProfile, type NamiMember } from './uiMockData.js';

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
    <div className="chat-window-expanded-heading-copy">
      <span className="mini-badge">Genre Lounge</span>
      <h2>{chat.title}</h2>
      <p>
        {chat.activeMembers.toLocaleString()} active
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
}): ReactElement {
  const selfMember = useSelfMember();
  const messageStore = useMessagesStore();
  const messages = useMemo(
    () => getGlobalChatMessages(props.chat.id),
    [props.chat.id, messageStore.globalMessages]
  );
  const isOwner = props.chat.createdBy === userProfile.displayName;
  const [draft, setDraft] = useState('');
  const messageStackRef = useRef<HTMLDivElement | null>(null);
  const canSend = props.chat.isOfficial ? canSendOfficialChatMessages() : canSendChatMessages();

  useEffect(() => {
    const stack = messageStackRef.current;

    if (!stack) {
      return;
    }

    stack.scrollTop = stack.scrollHeight;
  }, [messages.length, messageStore.globalMessages]);
  const visibleMembers = members.filter((member) => member.signal !== 'Black').slice(0, 6);

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

      <div className="message-stack global-message-stack" ref={messageStackRef}>
        {messages.map((message) => {
          const member = resolveMessageAuthorMember(message, selfMember);

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

              <div className={'message-bubble' + messageBubbleClass(member, message.author)}>
                <div className="message-meta">
                  <button
                    className={'message-author-button signal-text-' + message.signal.toLowerCase()}
                    onClick={() => member && props.onOpenMember(member)}
                    type="button"
                  >
                    {message.author}
                  </button>
                  <span>{message.time}</span>
                  <ConductSignalDot signal={message.signal} size="sm" />
                </div>
                <p>
                  <TaggedMessageBody
                    body={message.body}
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
        className="global-chat-composer chat-composer-row"
        onChange={setDraft}
        onSend={sendMessage}
        placeholder={
          canSend
            ? props.chat.isOfficial
              ? 'Say something to the official room… · ' + tagSuggestionHint()
              : 'Say something to the room… · ' + tagSuggestionHint()
            : 'Sign in and verify to send official chat messages'
        }
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
    </>
  );

  return (
    <div className={'global-chat-room-pane' + (props.compact ? ' is-compact-global-chat' : '')}>
      {props.compact ? (
        props.showCompactHead !== false ? (
          <div className="global-chat-compact-head">
            <div className="global-chat-compact-title-row">
              <span className="global-chat-compact-mark">{props.chat.title.slice(0, 2).toUpperCase()}</span>
              <strong>{props.chat.title}</strong>
              <span className="global-chat-compact-meta">
                {props.chat.activeMembers.toLocaleString()} inside
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
        <div className="chat-presence-rail">
          <div className="chat-presence-channel">
            <div className="global-chat-presence-mark">{props.chat.title.slice(0, 2).toUpperCase()}</div>
            <div className="global-chat-presence-copy">
              <span className="mini-badge">
                {props.chat.kind === 'genre'
                  ? 'Genre Lounge'
                  : props.chat.isOfficial
                    ? 'Official Global'
                    : props.chat.closesOnExit
                      ? 'Temporary'
                      : 'Community'}
              </span>
              <h2>{props.chat.title}</h2>
              <p>
                by {props.chat.createdBy}
                {props.chat.creatorVerified ? ' · Verified' : ''} ·{' '}
                {props.chat.activeMembers.toLocaleString()} active
              </p>
            </div>
          </div>

          {props.onClose ? (
            <button className="secondary-action" onClick={props.onClose} type="button">
              Close
            </button>
          ) : null}

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
                <span>{member.tier}</span>
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
      onOpenMember={props.onOpenMember}
        {...genreChatExpandProps(activeChat, { compact: false })}
        showCompactHead={false}
      {...(props.tagHandlers ? { tagHandlers: props.tagHandlers } : {})}
      {...(props.compact ? { compact: true } : {})}
    />
  );
}

export function HubGlobalChatsSection(props: GlobalChatsPanelProps): ReactElement {
  const [activeChatId, setActiveChatId] = useState(OFFICIAL_NAMI_GLOBAL_CHAT_ID);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [newChatVoice, setNewChatVoice] = useState(false);
  const [extraChats, setExtraChats] = useState<GlobalChatRoom[]>([]);

  const allChats = useMemo(() => [...hubGlobalChats, ...extraChats], [extraChats]);
  const activeChat = allChats.find((chat) => chat.id === activeChatId) ?? hubGlobalChats[0]!;

  function createTemporaryChat(): void {
    if (!canCreateTemporaryChat() || !newChatTitle.trim()) {
      return;
    }

    const created: GlobalChatRoom = {
      id: 'temp-' + Date.now(),
      title: newChatTitle.trim(),
      kind: 'temporary',
      createdBy: userProfile.displayName,
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

    if (activeChatId === chatId) {
      setActiveChatId(OFFICIAL_NAMI_GLOBAL_CHAT_ID);
    }
  }

  return (
    <article className="panel global-chats-unified-panel">
      <div className="profile-panel-heading">
        <h2>Global Chats</h2>
        <p>Official Nami Global Chat opens by default. Pick a room and chat in the same panel.</p>
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
                  <small>
                    by {chat.createdBy}
                    {chat.creatorVerified ? ' ✓' : ''}
                  </small>
                </div>
                <span>{chat.activeMembers.toLocaleString()} inside</span>
                {chat.closesOnExit && chat.createdBy === userProfile.displayName ? (
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
      <em>{activeChat.activeMembers.toLocaleString()} inside</em>
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