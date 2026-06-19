import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

import {
  embedCardKey,
  readEmbeddedFeedLinks,
  saveEmbedCollapsed,
} from './embedded-feed-preferences.js';
import { GlobalChatRoomView } from './GlobalChatsPanel.js';
import { withMemberAvatar } from './member-avatar-store.js';
import {
  memberLiveBroadcastEmbed,
  memberPublicChatRoom,
  readMemberPublicChatCollapsed,
  saveMemberPublicChatCollapsed,
} from './member-public-chat.js';
import { withMemberProfile } from './member-profile-store.js';
import { SocialEmbedPlayer } from './SocialEmbedPlayer.js';
import { TcgFoilPassportCard } from './TcgFoilPassportCard.js';
import type { TagNavigationHandlers } from './TaggedMessageBody.js';
import { members, type NamiMember } from './uiMockData.js';

type PassportPeekLayout = 'vertical' | 'horizontal';

export function MemberPublicPinnedChat(props: {
  member: NamiMember;
  onOpenMember: (member: NamiMember) => void;
  tagHandlers?: TagNavigationHandlers;
}): ReactElement {
  const chat = memberPublicChatRoom(props.member);
  const [collapsed, setCollapsed] = useState(() => readMemberPublicChatCollapsed(props.member.id));
  const [chatExpanded, setChatExpanded] = useState(false);
  const [peekMember, setPeekMember] = useState<NamiMember | null>(null);
  const [peekPassportLayout, setPeekPassportLayout] = useState<PassportPeekLayout>('vertical');
  const liveBroadcast = useMemo(() => memberLiveBroadcastEmbed(props.member.id), [props.member.id]);

  useEffect(() => {
    setPeekPassportLayout('vertical');
  }, [peekMember?.id]);

  const shouldPeekPassport = chatExpanded && liveBroadcast !== undefined;

  const handleOpenMember = useCallback(
    (member: NamiMember): void => {
      if (shouldPeekPassport) {
        setPeekMember(withMemberProfile(withMemberAvatar(member)));
        return;
      }

      props.onOpenMember(member);
    },
    [props.onOpenMember, shouldPeekPassport]
  );

  const mergedTagHandlers = useMemo((): TagNavigationHandlers | undefined => {
    if (!props.tagHandlers && !shouldPeekPassport) {
      return undefined;
    }

    return {
      ...props.tagHandlers,
      onOpenMember: (memberId) => {
        const member = members.find((entry) => entry.id === memberId);

        if (member && shouldPeekPassport) {
          setPeekMember(withMemberProfile(withMemberAvatar(member)));
          return;
        }

        props.tagHandlers?.onOpenMember?.(memberId);
      },
    };
  }, [props.tagHandlers, shouldPeekPassport]);

  const expandedAside = useMemo(() => {
    if (!liveBroadcast) {
      return undefined;
    }

    return (
      <div
        className={
          'member-public-chat-broadcast-popup' +
          (peekMember ? ' has-passport-peek' : '') +
          (peekMember && peekPassportLayout === 'horizontal' ? ' is-horizontal-passport-layout' : '')
        }
      >
        <header className="member-public-chat-broadcast-popup-head">
          <span className="mini-badge">Live on Twitch</span>
          <strong>{liveBroadcast.title}</strong>
          <small>{liveBroadcast.handle}</small>
        </header>

        <div className="member-public-chat-broadcast-player-shell">
          <SocialEmbedPlayer embed={liveBroadcast} featured surface="member" />
        </div>

        {peekMember ? (
          <section
            aria-label={peekMember.name + ' passport preview'}
            className={
              'member-public-chat-passport-peek' +
              (peekPassportLayout === 'horizontal' ? ' is-horizontal-passport-peek-mode' : '')
            }
          >
            <div className="member-public-chat-passport-peek-toolbar">
              <div
                className="member-public-chat-passport-peek-toolbar-copy"
                title="Only you can see this passport while the live chat stays open."
              >
                <span className="mini-badge">Private preview</span>
                <span className="member-public-chat-passport-peek-hint">Only you</span>
              </div>

              <div className="member-public-chat-passport-peek-toolbar-actions">
                <div
                  aria-label="Passport layout"
                  className="nami-profile-layout-switch member-public-chat-passport-layout-switch"
                  role="group"
                >
                  {(['vertical', 'horizontal'] as PassportPeekLayout[]).map((layout) => (
                    <button
                      aria-pressed={peekPassportLayout === layout}
                      className={peekPassportLayout === layout ? 'is-selected-profile-layout' : ''}
                      key={layout}
                      onClick={() => setPeekPassportLayout(layout)}
                      type="button"
                    >
                      {layout === 'vertical' ? 'Vertical' : 'Horizontal'}
                    </button>
                  ))}
                </div>

                <button
                  className="nami-surface-button member-public-chat-passport-peek-profile"
                  onClick={() => props.onOpenMember(peekMember)}
                  type="button"
                >
                  Open profile
                </button>

                <button
                  aria-label={'Close ' + peekMember.name + ' passport preview'}
                  className="profile-secondary-link member-public-chat-passport-peek-close"
                  onClick={() => setPeekMember(null)}
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>

            <div
              className={
                'member-public-chat-passport-peek-card' +
                (peekPassportLayout === 'horizontal' ? ' is-horizontal-passport-peek' : '')
              }
            >
              <TcgFoilPassportCard layout={peekPassportLayout} member={peekMember} />
            </div>
          </section>
        ) : null}
      </div>
    );
  }, [liveBroadcast, peekMember, peekPassportLayout, props.onOpenMember]);

  function revealMemberTwitchFeed(): void {
    if (!liveBroadcast) {
      return;
    }

    const embeds = readEmbeddedFeedLinks('member', props.member.id);
    const twitchIndex = embeds.findIndex((embed) => embed.platform === 'twitch');

    if (twitchIndex < 0) {
      return;
    }

    saveEmbedCollapsed('member', embedCardKey(embeds[twitchIndex]!, twitchIndex), false, props.member.id);
  }

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
        onOpenMember={handleOpenMember}
        showCompactHead={false}
        onChatExpandedChange={(expanded) => {
          setChatExpanded(expanded);

          if (expanded) {
            revealMemberTwitchFeed();
          } else {
            setPeekMember(null);
          }
        }}
        onChatEscape={() => {
          if (peekMember) {
            setPeekMember(null);
            return true;
          }

          return false;
        }}
        {...(expandedAside ? { expandedAside } : {})}
        {...(mergedTagHandlers ? { tagHandlers: mergedTagHandlers } : {})}
      />
    </aside>
  );

  return createPortal(
    <div className="member-public-chat-pinned-root">{dockContent}</div>,
    document.body
  );
}