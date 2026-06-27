import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { MemberAudienceLoungePopup } from './MemberAudienceLoungePopup.js';
import { GlobalChatRoomView } from './GlobalChatsPanel.js';
import {
  audienceSubchannelChatRoom,
  countCustomAudienceSubchannels,
  LIVE_CHAT_SLUG,
  maxAudienceSubchannelsForMember,
  useMemberAudienceSubchannels,
} from './member-audience-subchannels-store.js';
import { memberPublicChatId } from './member-public-chat.js';
import { memberFeatureTier } from './member-access.js';
import type { TagNavigationHandlers } from './TaggedMessageBody.js';
import type { NamiMember } from './uiMockData.js';

export function MemberAudienceSubchannelHub(props: {
  member: NamiMember;
  editable?: boolean;
  isStreamingOnline?: boolean;
  onOpenMember?: (member: NamiMember) => void;
  tagHandlers?: TagNavigationHandlers;
}): ReactElement {
  const channels = useMemberAudienceSubchannels(props.member.id);
  const limit = maxAudienceSubchannelsForMember(props.member);
  const tier = memberFeatureTier(props.member);
  const customCount = countCustomAudienceSubchannels(props.member.id);
  const [loungeOpen, setLoungeOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState(
    () => memberPublicChatId(props.member.id)
  );

  const liveChannel = useMemo(
    () => channels.find((entry) => entry.kind === 'live-chat' || entry.slug === LIVE_CHAT_SLUG) ?? channels[0],
    [channels]
  );

  const selectedChannel = useMemo(
    () => channels.find((entry) => entry.id === selectedChannelId) ?? channels[0] ?? null,
    [channels, selectedChannelId]
  );

  const chatRoom = selectedChannel ? audienceSubchannelChatRoom(selectedChannel, props.member) : null;

  const isLiveChatSelected =
    selectedChannel?.kind === 'live-chat' || selectedChannel?.slug === LIVE_CHAT_SLUG;

  useEffect(() => {
    if (!channels.some((entry) => entry.id === selectedChannelId)) {
      setSelectedChannelId(channels[0]?.id ?? memberPublicChatId(props.member.id));
    }
  }, [channels, selectedChannelId]);

  function openImmersiveLounge(): void {
    setLoungeOpen(true);
  }

  return (
    <>
      <article className="panel member-audience-subchannel-hub member-audience-inline-lounge">
        <div className="member-audience-inline-lounge-head">
          <div className="profile-panel-heading">
            <h2>Audience lounge</h2>
            <p>
              Chat in {props.member.name}&apos;s channels here. Open the immersive lounge from the chat
              header to watch live feeds alongside the room.
            </p>
          </div>
        </div>

        <div className="member-audience-subchannel-hub-layout member-audience-inline-lounge-layout">
          <aside aria-label="Audience channels" className="member-audience-subchannel-sidebar">
            <div className="member-audience-subchannel-sidebar-head">
              <span className="mini-badge">
                {channels.length} channels · {customCount}/{limit} custom
              </span>
              <span className="protocol-hint">{tier} tier</span>
            </div>

            <ul className="member-audience-subchannel-sidebar-list">
              {channels.map((channel) => {
                const isLive = channel.kind === 'live-chat' || channel.slug === LIVE_CHAT_SLUG;

                return (
                  <li key={channel.id}>
                    <button
                      aria-current={selectedChannel?.id === channel.id ? 'true' : undefined}
                      className={
                        'member-audience-subchannel-sidebar-item' +
                        (selectedChannel?.id === channel.id ? ' is-active' : '')
                      }
                      onClick={() => setSelectedChannelId(channel.id)}
                      type="button"
                    >
                      <span className="member-audience-subchannel-sidebar-hash">{isLive ? '●' : '#'}</span>
                      <span className="member-audience-subchannel-sidebar-title">{channel.title}</span>
                      {isLive && props.isStreamingOnline ? (
                        <span className="mini-badge member-audience-live-pill">Live</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="member-audience-subchannel-chat-pane member-audience-inline-chat-pane">
            {chatRoom ? (
              <>
                <header className="member-audience-subchannel-chat-head">
                  <span className="member-audience-subchannel-sidebar-hash">
                    {isLiveChatSelected ? '●' : '#'}
                  </span>
                  <div className="member-audience-subchannel-chat-head-copy">
                    <strong>{chatRoom.title}</strong>
                    <p className="protocol-hint">
                      {isLiveChatSelected
                        ? 'Community chat for ' + props.member.name + '.'
                        : 'Audience room for ' + props.member.name + '.'}
                    </p>
                  </div>
                  <button
                    className="nami-surface-button is-primary-surface-button member-audience-lounge-expand"
                    onClick={openImmersiveLounge}
                    type="button"
                  >
                    {props.isStreamingOnline ? 'Open live lounge' : 'Open lounge'}
                  </button>
                </header>

                <GlobalChatRoomView
                  chat={chatRoom}
                  compact
                  disableExpand
                  onOpenMember={props.onOpenMember ?? (() => {})}
                  showCompactHead={false}
                  {...(props.tagHandlers ? { tagHandlers: props.tagHandlers } : {})}
                />
              </>
            ) : (
              <p className="protocol-hint member-audience-inline-empty">Select a channel to start chatting.</p>
            )}
          </div>
        </div>
      </article>

      <MemberAudienceLoungePopup
        hostMember={props.member}
        initialChannelId={selectedChannelId}
        onClose={() => setLoungeOpen(false)}
        open={loungeOpen}
        {...(props.editable ? { editable: true } : {})}
        {...(props.isStreamingOnline ? { isHostStreamingOnline: props.isStreamingOnline } : {})}
        {...(props.onOpenMember ? { onOpenMember: props.onOpenMember } : {})}
        {...(props.tagHandlers ? { tagHandlers: props.tagHandlers } : {})}
      />
    </>
  );
}