import { useMemo, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

import {
  ExpandedChatMemberLivePanel,
  hydrateFocusedMember,
  revealMemberTwitchFeed,
} from './expanded-chat-member-focus.js';
import { GlobalChatRoomView } from './GlobalChatsPanel.js';
import {
  memberLiveBroadcastEmbed,
  memberPublicChatRoom,
  readMemberPublicChatCollapsed,
  saveMemberPublicChatCollapsed,
} from './member-public-chat.js';
import type { TagNavigationHandlers } from './TaggedMessageBody.js';
import type { NamiMember } from './uiMockData.js';

export function MemberPublicPinnedChat(props: {
  member: NamiMember;
  onOpenMember: (member: NamiMember) => void;
  tagHandlers?: TagNavigationHandlers;
}): ReactElement {
  const chat = memberPublicChatRoom(props.member);
  const [collapsed, setCollapsed] = useState(() => readMemberPublicChatCollapsed(props.member.id));
  const hostMember = useMemo(() => hydrateFocusedMember(props.member), [props.member]);
  const liveBroadcast = useMemo(() => memberLiveBroadcastEmbed(props.member.id), [props.member.id]);

  function toggleCollapsed(nextCollapsed: boolean): void {
    setCollapsed(nextCollapsed);
    saveMemberPublicChatCollapsed(props.member.id, nextCollapsed);
  }

  const dockContent = collapsed ? (
    <button
      aria-expanded={false}
      aria-label={'Open ' + props.member.name + ' live chat'}
      className="member-public-chat-pinned-tab"
      onClick={() => toggleCollapsed(false)}
      type="button"
    >
      <span className="member-public-chat-pinned-tab-label">Live Chat</span>
      <strong>{props.member.name}</strong>
      <em>{chat.activeMembers.toLocaleString()} watching</em>
    </button>
  ) : (
    <aside
      aria-label={props.member.name + ' public live chat'}
      className="member-public-chat-pinned-dock"
    >
      <header className="member-public-chat-pinned-dock-head">
        <div>
          <span className="mini-badge">Public Live Chat</span>
          <strong className="member-public-chat-pinned-title">{props.member.name}</strong>
        </div>
        <div className="member-public-chat-pinned-dock-actions">
          <button
            aria-label={'Collapse ' + props.member.name + ' live chat'}
            className="nami-surface-button member-public-chat-pinned-collapse"
            onClick={() => toggleCollapsed(true)}
            type="button"
          >
            −
          </button>
        </div>
      </header>

      <GlobalChatRoomView
        chat={chat}
        compact
        onOpenMember={props.onOpenMember}
        showCompactHead={false}
        onChatExpandedChange={(expanded) => {
          if (expanded) {
            revealMemberTwitchFeed(props.member.id);
          }
        }}
        {...(liveBroadcast
          ? {
              renderExpandedAside: () => <ExpandedChatMemberLivePanel member={hostMember} />,
            }
          : {})}
        {...(props.tagHandlers ? { tagHandlers: props.tagHandlers } : {})}
      />
    </aside>
  );

  return createPortal(
    <div className="member-public-chat-pinned-root">{dockContent}</div>,
    document.body
  );
}