import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

import {
  embedCardKey,
  readEmbeddedFeedLinks,
  saveEmbedCollapsed,
} from './embedded-feed-preferences.js';
import { EmbeddedSocialPanel } from './EmbeddedSocialPanel.js';
import { GlobalChatRoomView } from './GlobalChatsPanel.js';
import { withMemberAvatar } from './member-avatar-store.js';
import {
  audienceSubchannelChatRoom,
  canCreateAudienceSubchannel,
  countCustomAudienceSubchannels,
  createAudienceSubchannel,
  LIVE_CHAT_SLUG,
  maxAudienceSubchannelsForMember,
  removeAudienceSubchannel,
  renameAudienceSubchannel,
  setAudienceSubchannelVoiceEnabled,
  useMemberAudienceSubchannels,
  type AudienceSubchannel,
} from './member-audience-subchannels-store.js';
import { memberFeatureTier } from './member-access.js';
import { isMemberStreamingOnline, useMemberStreamingOnline } from './member-online-store.js';
import {
  memberPublicChatId,
  memberWatchableLiveFeed,
} from './member-public-chat.js';
import { withMemberProfile } from './member-profile-store.js';
import { SocialEmbedPlayer } from './SocialEmbedPlayer.js';
import { UniformMemberAvatar } from './member-avatar.js';
import type { TagNavigationHandlers } from './TaggedMessageBody.js';
import { members, type NamiMember } from './uiMockData.js';

function revealMemberTwitchFeed(memberId: string): void {
  const embeds = readEmbeddedFeedLinks('member', memberId);
  const twitchIndex = embeds.findIndex((embed) => embed.platform === 'twitch');

  if (twitchIndex < 0) {
    return;
  }

  saveEmbedCollapsed('member', embedCardKey(embeds[twitchIndex]!, twitchIndex), false, memberId);
}

function resolveMember(memberId: string): NamiMember | undefined {
  const member = members.find((entry) => entry.id === memberId);

  return member ? withMemberProfile(withMemberAvatar(member)) : undefined;
}

export function MemberAudienceLoungePopup(props: {
  hostMember: NamiMember;
  open: boolean;
  editable?: boolean;
  initialChannelId?: string;
  isHostStreamingOnline?: boolean;
  onClose: () => void;
  onOpenMember?: (member: NamiMember) => void;
  tagHandlers?: TagNavigationHandlers;
}): ReactElement | null {
  const channels = useMemberAudienceSubchannels(props.hostMember.id);
  const limit = maxAudienceSubchannelsForMember(props.hostMember);
  const tier = memberFeatureTier(props.hostMember);
  const customCount = countCustomAudienceSubchannels(props.hostMember.id);
  const hostStreamingOnline = useMemberStreamingOnline(props.hostMember.id);

  const [selectedChannelId, setSelectedChannelId] = useState(
    () => props.initialChannelId ?? memberPublicChatId(props.hostMember.id)
  );
  const [watchingMemberId, setWatchingMemberId] = useState(props.hostMember.id);
  const [status, setStatus] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');

  const selectedChannel = useMemo(
    () => channels.find((entry) => entry.id === selectedChannelId) ?? channels[0] ?? null,
    [channels, selectedChannelId]
  );

  const watchingMember = useMemo(
    () => resolveMember(watchingMemberId) ?? props.hostMember,
    [props.hostMember, watchingMemberId]
  );

  const watchingStreamingOnline = useMemberStreamingOnline(watchingMember.id);
  const watchingLiveFeed = useMemo(
    () => memberWatchableLiveFeed(watchingMember.id),
    [watchingMember.id, watchingStreamingOnline]
  );

  const isLiveChatSelected =
    selectedChannel?.kind === 'live-chat' || selectedChannel?.slug === LIVE_CHAT_SLUG;

  const chatRoom = selectedChannel ? audienceSubchannelChatRoom(selectedChannel, props.hostMember) : null;

  useEffect(() => {
    if (!props.open) {
      return;
    }

    if (!channels.some((entry) => entry.id === selectedChannelId)) {
      setSelectedChannelId(channels[0]?.id ?? memberPublicChatId(props.hostMember.id));
    }
  }, [channels, props.hostMember.id, props.open, selectedChannelId]);

  useEffect(() => {
    if (!props.open) {
      return;
    }

    setWatchingMemberId(props.hostMember.id);
  }, [props.hostMember.id, props.open]);

  useEffect(() => {
    if (!props.open) {
      return;
    }

    document.body.classList.add('has-audience-lounge-open');

    return () => {
      document.body.classList.remove('has-audience-lounge-open');
    };
  }, [props.open]);

  const handleOpenMember = useCallback(
    (member: NamiMember): void => {
      const hydrated = withMemberProfile(withMemberAvatar(member));

      if (memberWatchableLiveFeed(hydrated.id)) {
        setWatchingMemberId(hydrated.id);
        revealMemberTwitchFeed(hydrated.id);
        return;
      }

      props.onOpenMember?.(hydrated);
    },
    [props.onOpenMember]
  );

  const mergedTagHandlers = useMemo((): TagNavigationHandlers | undefined => {
    if (!props.tagHandlers) {
      return {
        onOpenMember: (memberId) => {
          const member = resolveMember(memberId);

          if (member) {
            handleOpenMember(member);
          }
        },
      };
    }

    return {
      ...props.tagHandlers,
      onOpenMember: (memberId) => {
        const member = resolveMember(memberId);

        if (member && memberWatchableLiveFeed(member.id)) {
          handleOpenMember(member);
          return;
        }

        props.tagHandlers?.onOpenMember?.(memberId);
      },
    };
  }, [handleOpenMember, props.tagHandlers]);

  function handleCreate(): void {
    const result = createAudienceSubchannel(props.hostMember);

    if (!result.ok) {
      setStatus(result.reason);
      return;
    }

    setSelectedChannelId(result.channel.id);
    setStatus('Created "' + result.channel.title + '".');
  }

  function startRename(channel: AudienceSubchannel): void {
    setEditingId(channel.id);
    setDraftTitle(channel.title);
  }

  function commitRename(channelId: string): void {
    const result = renameAudienceSubchannel(props.hostMember.id, channelId, draftTitle);

    if (!result.ok) {
      setStatus(result.reason);
      return;
    }

    setEditingId(null);
    setDraftTitle('');
    setStatus('Renamed to "' + result.channel.title + '".');
  }

  function toggleVoice(channelId: string, enabled: boolean): void {
    const result = setAudienceSubchannelVoiceEnabled(props.hostMember.id, channelId, enabled);

    if (!result.ok) {
      setStatus(result.reason);
      return;
    }

    setStatus(
      result.channel.voiceChatEnabled
        ? 'Voice chat enabled for "' + result.channel.title + '".'
        : 'Voice chat disabled for "' + result.channel.title + '".'
    );
  }

  if (!props.open) {
    return null;
  }

  return createPortal(
    <div className="audience-lounge-overlay" role="presentation">
      <button
        aria-label="Close audience lounge"
        className="audience-lounge-backdrop"
        onClick={props.onClose}
        type="button"
      />

      <section
        aria-label={props.hostMember.name + ' audience lounge'}
        className="audience-lounge-popup"
        role="dialog"
      >
        <header className="audience-lounge-popup-head">
          <div>
            <span className="mini-badge">Audience lounge</span>
            <strong>{props.hostMember.name}</strong>
            <p className="protocol-hint">
              Chat with the room and watch live feeds. Click a live avatar to tune into their stream.
            </p>
          </div>
          <button className="nami-surface-button audience-lounge-close" onClick={props.onClose} type="button">
            Close
          </button>
        </header>

        <div className="audience-lounge-popup-body">
          <aside aria-label="Audience channels" className="audience-lounge-channel-rail">
            <div className="audience-lounge-channel-rail-head">
              <span className="mini-badge">
                {customCount}/{limit} custom
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
                      {isLive && (props.isHostStreamingOnline ?? hostStreamingOnline) ? (
                        <span className="mini-badge member-audience-live-pill">Live</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>

            {props.editable && canCreateAudienceSubchannel(props.hostMember) ? (
              <button
                className="nami-surface-button member-audience-subchannel-add"
                onClick={handleCreate}
                type="button"
              >
                + New channel
              </button>
            ) : null}

            {props.editable && selectedChannel && selectedChannel.kind === 'custom' ? (
              <ChannelManagePanel
                channel={selectedChannel}
                draftTitle={draftTitle}
                editingId={editingId}
                onCancelRename={() => {
                  setEditingId(null);
                  setDraftTitle('');
                }}
                onCommitRename={() => commitRename(selectedChannel.id)}
                onDraftTitleChange={setDraftTitle}
                onRemove={() => {
                  removeAudienceSubchannel(props.hostMember.id, selectedChannel.id);
                  setStatus('Removed "' + selectedChannel.title + '".');
                }}
                onRename={() => startRename(selectedChannel)}
                onToggleVoice={(enabled) => toggleVoice(selectedChannel.id, enabled)}
              />
            ) : null}
          </aside>

          <div className="audience-lounge-stage">
            <section aria-label="Live member feed" className="audience-lounge-feed-pane">
              <header className="audience-lounge-feed-head">
                <div className="audience-lounge-feed-host">
                  <UniformMemberAvatar className="audience-lounge-feed-avatar" member={watchingMember} />
                  <div>
                    <strong>{watchingMember.name}</strong>
                    <p className="protocol-hint">
                      {watchingLiveFeed
                        ? 'Live now — synced with chat'
                        : isMemberStreamingOnline(watchingMember.id)
                          ? 'Live without a linked stream embed'
                          : 'Member feed'}
                    </p>
                  </div>
                </div>

                {watchingMember.id !== props.hostMember.id ? (
                  <button
                    className="nami-surface-button"
                    onClick={() => setWatchingMemberId(props.hostMember.id)}
                    type="button"
                  >
                    Back to {props.hostMember.name}
                  </button>
                ) : null}
              </header>

              <div className="audience-lounge-feed-body">
                {watchingLiveFeed ? (
                  <div className="audience-lounge-live-player-shell">
                    <SocialEmbedPlayer embed={watchingLiveFeed} featured surface="member" />
                  </div>
                ) : (
                  <EmbeddedSocialPanel
                    feedOwnerMemberId={watchingMember.id}
                    showFeedToggle={false}
                    surface="member"
                    title={watchingMember.name + ' Feed'}
                  />
                )}
              </div>
            </section>

            <section aria-label="Audience chat" className="audience-lounge-chat-pane">
              {chatRoom ? (
                <>
                  <header className="member-audience-subchannel-chat-head">
                    <span className="member-audience-subchannel-sidebar-hash">
                      {isLiveChatSelected ? '●' : '#'}
                    </span>
                    <div>
                      <strong>{chatRoom.title}</strong>
                      <p className="protocol-hint">
                        {isLiveChatSelected
                          ? 'Everyone chats here while the lounge feed plays above.'
                          : 'Audience room for ' + props.hostMember.name + '.'}
                      </p>
                    </div>
                  </header>

                  <GlobalChatRoomView
                    chat={chatRoom}
                    compact
                    hubLayout
                    onOpenMember={handleOpenMember}
                    showCompactHead={false}
                    {...(mergedTagHandlers ? { tagHandlers: mergedTagHandlers } : {})}
                  />
                </>
              ) : (
                <p className="protocol-hint">Select a channel to start chatting.</p>
              )}
            </section>
          </div>
        </div>

        {status ? <p className="protocol-hint audience-lounge-status">{status}</p> : null}
      </section>
    </div>,
    document.body
  );
}

function ChannelManagePanel(props: {
  channel: AudienceSubchannel;
  draftTitle: string;
  editingId: string | null;
  onCancelRename: () => void;
  onCommitRename: () => void;
  onDraftTitleChange: (value: string) => void;
  onRemove: () => void;
  onRename: () => void;
  onToggleVoice: (enabled: boolean) => void;
}): ReactElement {
  if (props.editingId === props.channel.id) {
    return (
      <div className="member-audience-subchannel-sidebar-manage">
        <div className="member-audience-subchannel-rename-row">
          <input
            aria-label="Subchannel title"
            maxLength={48}
            onChange={(event) => props.onDraftTitleChange(event.target.value)}
            value={props.draftTitle}
          />
          <button
            className="nami-surface-button is-primary-surface-button"
            onClick={props.onCommitRename}
            type="button"
          >
            Save
          </button>
          <button className="nami-surface-button" onClick={props.onCancelRename} type="button">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="member-audience-subchannel-sidebar-manage">
      <div className="member-audience-subchannel-actions">
        <button className="nami-surface-button" onClick={props.onRename} type="button">
          Rename
        </button>
        <label className="member-audience-voice-toggle">
          <input
            checked={props.channel.voiceChatEnabled}
            onChange={(event) => props.onToggleVoice(event.target.checked)}
            type="checkbox"
          />
          Voice
        </label>
        <button className="nami-surface-button danger-preference" onClick={props.onRemove} type="button">
          Remove
        </button>
      </div>
    </div>
  );
}