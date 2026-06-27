import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';

import {
  embedCardKey,
  readEmbeddedFeedLinks,
  saveEmbedCollapsed,
} from './embedded-feed-preferences.js';
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
import {
  memberLiveBroadcastEmbed,
  memberPublicChatId,
} from './member-public-chat.js';
import { withMemberProfile } from './member-profile-store.js';
import { SocialEmbedPlayer } from './SocialEmbedPlayer.js';
import { TcgFoilPassportCard } from './TcgFoilPassportCard.js';
import type { TagNavigationHandlers } from './TaggedMessageBody.js';
import { members, type NamiMember } from './uiMockData.js';

type PassportPeekLayout = 'vertical' | 'horizontal';

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
  const [selectedChannelId, setSelectedChannelId] = useState(() => memberPublicChatId(props.member.id));
  const [status, setStatus] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [chatExpanded, setChatExpanded] = useState(false);
  const [peekMember, setPeekMember] = useState<NamiMember | null>(null);
  const [peekPassportLayout, setPeekPassportLayout] = useState<PassportPeekLayout>('vertical');

  const selectedChannel = useMemo(
    () => channels.find((entry) => entry.id === selectedChannelId) ?? channels[0] ?? null,
    [channels, selectedChannelId]
  );

  const liveBroadcast = useMemo(
    () => memberLiveBroadcastEmbed(props.member.id),
    [props.member.id]
  );

  const isLiveChatSelected =
    selectedChannel?.kind === 'live-chat' || selectedChannel?.slug === LIVE_CHAT_SLUG;

  useEffect(() => {
    if (!channels.some((entry) => entry.id === selectedChannelId)) {
      setSelectedChannelId(channels[0]?.id ?? memberPublicChatId(props.member.id));
    }
  }, [channels, props.member.id, selectedChannelId]);

  useEffect(() => {
    setPeekPassportLayout('vertical');
  }, [peekMember?.id]);

  const shouldPeekPassport = chatExpanded && isLiveChatSelected && liveBroadcast !== undefined;

  const handleOpenMember = useCallback(
    (member: NamiMember): void => {
      if (shouldPeekPassport) {
        setPeekMember(withMemberProfile(withMemberAvatar(member)));
        return;
      }

      props.onOpenMember?.(member);
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
    if (!isLiveChatSelected || !liveBroadcast) {
      return undefined;
    }

    return (
      <div
        className={
          'member-public-chat-broadcast-popup member-audience-hub-broadcast' +
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

                {props.onOpenMember ? (
                  <button
                    className="nami-surface-button member-public-chat-passport-peek-profile"
                    onClick={() => props.onOpenMember?.(peekMember)}
                    type="button"
                  >
                    Open profile
                  </button>
                ) : null}

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
  }, [isLiveChatSelected, liveBroadcast, peekMember, peekPassportLayout, props.onOpenMember]);

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

  function handleCreate(): void {
    const result = createAudienceSubchannel(props.member);

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
    const result = renameAudienceSubchannel(props.member.id, channelId, draftTitle);

    if (!result.ok) {
      setStatus(result.reason);
      return;
    }

    setEditingId(null);
    setDraftTitle('');
    setStatus('Renamed to "' + result.channel.title + '".');
  }

  function toggleVoice(channelId: string, enabled: boolean): void {
    const result = setAudienceSubchannelVoiceEnabled(props.member.id, channelId, enabled);

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

  const chatRoom = selectedChannel ? audienceSubchannelChatRoom(selectedChannel, props.member) : null;

  return (
    <article className="panel member-audience-subchannel-hub">
      <div className="profile-panel-heading">
        <h2>Audience channels</h2>
        <p>
          Discord-style rooms for your community. Live Chat is always available; {tier} members can add up to{' '}
          {limit} custom channels.
        </p>
      </div>

      <div className="member-audience-subchannel-hub-layout">
        <aside aria-label="Audience subchannels" className="member-audience-subchannel-sidebar">
          <header className="member-audience-subchannel-sidebar-head">
            <strong>{props.member.name}</strong>
            <span className="mini-badge">
              {customCount}/{limit} custom
            </span>
          </header>

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
                    {channel.voiceChatEnabled ? (
                      <span aria-label="Voice enabled" className="member-audience-voice-pill">
                        🎙
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {props.editable && canCreateAudienceSubchannel(props.member) ? (
            <button
              className="nami-surface-button member-audience-subchannel-add"
              onClick={handleCreate}
              type="button"
            >
              + New channel
            </button>
          ) : null}

          {props.editable && selectedChannel && selectedChannel.kind === 'custom' ? (
            <div className="member-audience-subchannel-sidebar-manage">
              {editingId === selectedChannel.id ? (
                <div className="member-audience-subchannel-rename-row">
                  <input
                    aria-label="Subchannel title"
                    maxLength={48}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    value={draftTitle}
                  />
                  <button
                    className="nami-surface-button is-primary-surface-button"
                    onClick={() => commitRename(selectedChannel.id)}
                    type="button"
                  >
                    Save
                  </button>
                  <button
                    className="nami-surface-button"
                    onClick={() => {
                      setEditingId(null);
                      setDraftTitle('');
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="member-audience-subchannel-actions">
                  <button
                    className="nami-surface-button"
                    onClick={() => startRename(selectedChannel)}
                    type="button"
                  >
                    Rename
                  </button>
                  <label className="member-audience-voice-toggle">
                    <input
                      checked={selectedChannel.voiceChatEnabled}
                      onChange={(event) => toggleVoice(selectedChannel.id, event.target.checked)}
                      type="checkbox"
                    />
                    Voice
                  </label>
                  <button
                    className="nami-surface-button danger-preference"
                    onClick={() => {
                      removeAudienceSubchannel(props.member.id, selectedChannel.id);
                      setStatus('Removed "' + selectedChannel.title + '".');
                    }}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {props.editable && selectedChannel && selectedChannel.kind === 'live-chat' && editingId === selectedChannel.id ? (
            <div className="member-audience-subchannel-sidebar-manage">
              <div className="member-audience-subchannel-rename-row">
                <input
                  aria-label="Live chat title"
                  maxLength={48}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  value={draftTitle}
                />
                <button
                  className="nami-surface-button is-primary-surface-button"
                  onClick={() => commitRename(selectedChannel.id)}
                  type="button"
                >
                  Save
                </button>
                <button
                  className="nami-surface-button"
                  onClick={() => {
                    setEditingId(null);
                    setDraftTitle('');
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : props.editable && selectedChannel?.kind === 'live-chat' ? (
            <div className="member-audience-subchannel-sidebar-manage">
              <button
                className="nami-surface-button"
                onClick={() => startRename(selectedChannel)}
                type="button"
              >
                Rename
              </button>
            </div>
          ) : null}
        </aside>

        <section className="member-audience-subchannel-chat-pane">
          {chatRoom ? (
            <>
              <header className="member-audience-subchannel-chat-head">
                <span className="member-audience-subchannel-sidebar-hash">
                  {isLiveChatSelected ? '●' : '#'}
                </span>
                <div>
                  <strong>{chatRoom.title}</strong>
                  {isLiveChatSelected ? (
                    <p className="protocol-hint">
                      {props.isStreamingOnline
                        ? 'Public live chat for viewers while you stream.'
                        : 'Go live to open this room to your audience.'}
                    </p>
                  ) : selectedChannel?.voiceChatEnabled ? (
                    <p className="protocol-hint">Voice lounge enabled for this room.</p>
                  ) : (
                    <p className="protocol-hint">Text channel for your audience.</p>
                  )}
                </div>
              </header>

              <GlobalChatRoomView
                chat={chatRoom}
                compact
                hubLayout
                onOpenMember={handleOpenMember}
                showCompactHead={false}
                onChatExpandedChange={(expanded) => {
                  setChatExpanded(expanded);

                  if (expanded && isLiveChatSelected) {
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
            </>
          ) : (
            <p className="protocol-hint">Select a channel to start chatting.</p>
          )}
        </section>
      </div>

      {status ? <p className="protocol-hint">{status}</p> : null}
    </article>
  );
}