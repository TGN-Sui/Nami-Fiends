import { useMemo, useState, type ReactElement } from 'react';

import { MemberAudienceLoungePopup } from './MemberAudienceLoungePopup.js';
import {
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
  const [launchChannelId, setLaunchChannelId] = useState(() => memberPublicChatId(props.member.id));

  const liveChannel = useMemo(
    () => channels.find((entry) => entry.kind === 'live-chat' || entry.slug === LIVE_CHAT_SLUG) ?? channels[0],
    [channels]
  );

  function openLounge(channelId?: string): void {
    setLaunchChannelId(channelId ?? liveChannel?.id ?? memberPublicChatId(props.member.id));
    setLoungeOpen(true);
  }

  return (
    <>
      <article className="panel member-audience-subchannel-hub member-audience-lounge-launcher">
        <div className="profile-panel-heading">
          <h2>Audience lounge</h2>
          <p>
            Immersive chat + live feed popup. {tier} members can run Live Chat plus up to {limit} custom channels.
          </p>
        </div>

        <div className="member-audience-lounge-launcher-card">
          <div className="member-audience-lounge-launcher-copy">
            <span className="mini-badge">
              {channels.length} channels · {customCount}/{limit} custom
            </span>
            <strong>{props.member.name}&apos;s lounge</strong>
            <p className="protocol-hint">
              Open the popup to chat with the community, watch {props.member.name}&apos;s stream, and tune into any
              other live member in the room by clicking their avatar.
            </p>
          </div>

          <div className="member-audience-lounge-launcher-actions">
            <button
              className="nami-surface-button is-primary-surface-button member-audience-lounge-open"
              onClick={() => openLounge(liveChannel?.id)}
              type="button"
            >
              {props.isStreamingOnline ? 'Open live lounge' : 'Open audience lounge'}
            </button>
          </div>
        </div>

        <ul className="member-audience-lounge-channel-preview">
          {channels.map((channel) => {
            const isLive = channel.kind === 'live-chat' || channel.slug === LIVE_CHAT_SLUG;

            return (
              <li key={channel.id}>
                <button
                  className="member-audience-lounge-channel-preview-item"
                  onClick={() => openLounge(channel.id)}
                  type="button"
                >
                  <span className="member-audience-subchannel-sidebar-hash">{isLive ? '●' : '#'}</span>
                  <span>{channel.title}</span>
                  {isLive && props.isStreamingOnline ? (
                    <span className="mini-badge member-audience-live-pill">Live</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </article>

      <MemberAudienceLoungePopup
        hostMember={props.member}
        initialChannelId={launchChannelId}
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