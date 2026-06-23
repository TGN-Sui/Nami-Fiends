import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';

import {
  hydrateChatFavorites,
  setActiveFavoriteRoom,
  toggleGenreFavorite,
  updateFavoriteRooms,
  useChatFavorites,
} from './chat-favorites-store.js';
import {
  favoriteRoomTabLabel,
  isGenreChatRoomId,
  resolveFavoriteChatRoom,
} from './chat-room-registry.js';
import { memberPublicChatId } from './member-public-chat.js';
import {
  markFavoriteRoomRead,
  startChatRoomUnreadPolling,
  totalChatRoomUnread,
  useChatRoomUnreadMap,
} from './chat-room-notifications-store.js';
import { genreOfficialChats, type GlobalChatRoom } from './global-chats.js';
import { genreChatExpandProps, GlobalChatRoomView } from './GlobalChatsPanel.js';
import {
  readGenreChatDockSize,
  saveGenreChatDockCollapsed,
  saveGenreChatDockPinned,
  saveGenreChatDockSize,
  type GenreChatDockSize,
} from './gamehub-preferences.js';
import { startSharedGlobalChatPolling } from './global-chat-messages-sync.js';
import { useSelfMember } from './member-avatar-store.js';
import type { NamiMember } from './uiMockData.js';
import type { TagNavigationHandlers } from './TaggedMessageBody.js';

type NamiFavoritedChatDockProps = {
  pinned: boolean;
  collapsed: boolean;
  onPinnedChange: (pinned: boolean) => void;
  onCollapsedChange: (collapsed: boolean) => void;
  onOpenMember: (member: NamiMember) => void;
  tagHandlers?: TagNavigationHandlers;
};

export function NamiFavoritedChatDock(props: NamiFavoritedChatDockProps): ReactElement | null {
  const selfMember = useSelfMember();
  const favorites = useChatFavorites();
  const unreadMap = useChatRoomUnreadMap();
  const [dockSize, setDockSize] = useState<GenreChatDockSize>(readGenreChatDockSize);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageStatus, setManageStatus] = useState<string | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  const favoriteRooms = useMemo(
    () =>
      favorites.roomIds
        .map((roomId) => resolveFavoriteChatRoom(roomId, selfMember))
        .filter((room): room is GlobalChatRoom => room !== null),
    [favorites.roomIds, selfMember]
  );

  const activeChat = useMemo(() => {
    return (
      favoriteRooms.find((room) => room.id === favorites.activeRoomId) ??
      favoriteRooms[0] ??
      null
    );
  }, [favoriteRooms, favorites.activeRoomId]);

  useEffect(() => {
    void hydrateChatFavorites();
  }, [selfMember.id]);

  useEffect(() => {
    const stops = favorites.roomIds.map((roomId) => startSharedGlobalChatPolling(roomId));

    return () => {
      stops.forEach((stop) => stop());
    };
  }, [favorites.roomIds.join('|')]);

  useEffect(() => {
    return startChatRoomUnreadPolling(favorites.roomIds);
  }, [favorites.roomIds.join('|')]);

  useEffect(() => {
    if (!activeChat) {
      return;
    }

    void markFavoriteRoomRead(activeChat.id);
  }, [activeChat?.id]);

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

  const ownRoomId = memberPublicChatId(selfMember.id);

  useEffect(() => {
    if (favorites.roomIds.includes(ownRoomId)) {
      return;
    }

    updateFavoriteRooms([...favorites.roomIds, ownRoomId]);
  }, [favorites.roomIds, ownRoomId]);

  if (!props.pinned || !activeChat) {
    return null;
  }

  const totalUnread = totalChatRoomUnread(unreadMap);

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

  function selectRoom(roomId: string): void {
    setActiveFavoriteRoom(roomId);
    void markFavoriteRoomRead(roomId);
  }

  function handleGenreToggle(roomId: string): void {
    const result = toggleGenreFavorite(roomId);

    if (!result.ok) {
      setManageStatus(result.reason);
      return;
    }

    if (result.swappedFrom) {
      const replaced = favoriteRoomTabLabel(result.swappedFrom, selfMember);
      const added = favoriteRoomTabLabel(roomId, selfMember);
      setManageStatus('Swapped ' + replaced + ' for ' + added + '.');
      return;
    }

    setManageStatus(null);
  }

  const dockContent = props.collapsed ? (
    <button
      aria-expanded={false}
      aria-label={'Open favorited chats: ' + activeChat.title}
      className="genre-chat-pinned-tab nami-favorited-chat-tab"
      onClick={() => toggleCollapsed(false)}
      type="button"
    >
      <span className="genre-chat-pinned-tab-label">Nami Chat</span>
      <strong>{favoriteRoomTabLabel(activeChat.id, selfMember)}</strong>
      {totalUnread > 0 ? <em>{totalUnread} new</em> : <em>Tap to open</em>}
    </button>
  ) : (
    <aside
      aria-label="Favorited Nami chats"
      className="genre-chat-pinned-dock nami-favorited-chat-dock"
      style={{
        width: dockSize.width,
        height: dockSize.height,
        maxHeight: 'calc(100vh - 40px)',
      }}
    >
      <header className="genre-chat-pinned-dock-head genre-chat-pinned-dock-head-compact">
        <strong className="genre-chat-pinned-active-title">
          {favoriteRoomTabLabel(activeChat.id, selfMember)}
        </strong>
        <div className="genre-chat-pinned-dock-actions">
          <button
            aria-expanded={manageOpen}
            aria-label="Manage favorited chat rooms"
            className={
              'nami-surface-button nami-favorited-chat-manage' +
              (manageOpen ? ' is-active-surface-button' : '')
            }
            onClick={() => {
              setManageStatus(null);
              setManageOpen((open) => !open);
            }}
            type="button"
          >
            Rooms
          </button>
          <button
            aria-label="Unpin favorited chats"
            className="nami-surface-button genre-chat-pinned-unpin"
            onClick={unpinDock}
            type="button"
          >
            Unpin
          </button>
          <button
            aria-label="Collapse favorited chats"
            className="nami-surface-button genre-chat-pinned-collapse"
            onClick={() => toggleCollapsed(true)}
            type="button"
          >
            −
          </button>
        </div>
      </header>

      {manageOpen ? (
        <section className="nami-favorited-chat-manage-panel">
          <p className="protocol-hint">
            Pin up to two genre lounges plus your public live chat. Picking a third genre swaps one out.
          </p>
          <ul className="nami-favorited-chat-manage-list">
            {genreOfficialChats.map((chat) => {
              const favorited = favorites.roomIds.includes(chat.id);

              return (
                <li key={chat.id}>
                  <label className="nami-favorited-chat-manage-option">
                    <input
                      checked={favorited}
                      onChange={() => handleGenreToggle(chat.id)}
                      type="checkbox"
                    />
                    <span>{chat.title}</span>
                  </label>
                </li>
              );
            })}
            <li>
              <span className="nami-favorited-chat-manage-locked">My Chat (always pinned)</span>
            </li>
          </ul>
          {manageStatus ? <p className="protocol-hint">{manageStatus}</p> : null}
        </section>
      ) : null}

      <div
        className="genre-chat-pinned-room-row nami-favorited-chat-tab-row"
        role="tablist"
        aria-label="Favorited chat rooms"
      >
        {favorites.roomIds.map((roomId) => {
          const unread = unreadMap[roomId] ?? 0;
          const label = favoriteRoomTabLabel(roomId, selfMember);

          return (
            <button
              aria-selected={roomId === activeChat.id}
              className={
                'genre-chat-pinned-room-tab nami-favorited-chat-room-tab' +
                (roomId === activeChat.id ? ' is-active-genre-room' : '') +
                (unread > 0 ? ' has-chat-unread' : '')
              }
              key={roomId}
              onClick={() => selectRoom(roomId)}
              role="tab"
              type="button"
            >
              <span>{label}</span>
              {unread > 0 ? <em className="nami-favorited-chat-unread-badge">{unread}</em> : null}
            </button>
          );
        })}
      </div>

      <GlobalChatRoomView
        chat={activeChat}
        compact
        key={activeChat.id}
        onOpenMember={props.onOpenMember}
        {...(isGenreChatRoomId(activeChat.id)
          ? genreChatExpandProps(activeChat, { compact: true })
          : {})}
        showCompactHead={false}
        {...(props.tagHandlers ? { tagHandlers: props.tagHandlers } : {})}
      />

      <button
        aria-label="Resize favorited chat dock"
        className="genre-chat-pinned-resize-handle"
        onPointerDown={startResize}
        type="button"
      />
    </aside>
  );

  return createPortal(
    <div className="genre-chat-pinned-root nami-favorited-chat-root">{dockContent}</div>,
    document.body
  );
}