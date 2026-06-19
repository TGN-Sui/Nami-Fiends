import type { CSSProperties, ReactElement, ReactNode } from 'react';

import { canSubscribeToChannelBanners } from './member-access.js';
import { ChannelBoostButton } from './ChannelBoostButton.js';
import { buildChannelProfileNavItems, type ChannelProfileSection } from './channel-profile-sections.js';
import { resolveChannelCoverUrl } from './channel-cover-store.js';
import type { NamiChannel, NamiMember, NamiPage } from './uiMockData.js';

type ChannelProfileShellProps = {
  channel: NamiChannel;
  developerName: string;
  activeSection: ChannelProfileSection;
  onSelectSection: (section: ChannelProfileSection) => void;
  returnLabel: string;
  returnPage: NamiPage;
  onNavigate: (page: NamiPage) => void;
  profileBrandStyle: CSSProperties;
  channelIsSubscribed: boolean;
  bannerAlertsEnabled: boolean;
  onSubscribe: () => void;
  onBannerAlertsToggle: () => void;
  subscribeNotice?: string;
  bannerNotice?: string;
  boostNotice?: string;
  selfMember: NamiMember;
  channelBoostPower: number;
  onBoostChannel: () => void;
  eventCount: number;
  reviewCount: number;
  isChannelOwner: boolean;
  showMemberConsumerActions?: boolean;
  pageEyebrow?: string;
  pageTitle?: string;
  children: ReactNode;
  mode?: 'profile' | 'chat';
};

function cssAssetUrl(url: string): string {
  return 'url("' + url.replace(/"/g, '\\u0022') + '")';
}

function gameCoverAssetVariables(channel: NamiChannel): CSSProperties {
  const coverImageUrl = resolveChannelCoverUrl(channel)?.trim();

  if (!coverImageUrl) {
    return {
      '--game-cover-image': 'none',
      '--game-cover-image-opacity': '0',
    } as CSSProperties;
  }

  return {
    '--game-cover-image': cssAssetUrl(coverImageUrl),
    '--game-cover-image-opacity': '1',
  } as CSSProperties;
}

function ChannelAvatar(props: { channel: NamiChannel; size?: 'sm' | 'md' | 'lg' }): ReactElement {
  const className =
    'channel-avatar channel-avatar-' +
    (props.size ?? 'md') +
    (resolveChannelCoverUrl(props.channel) ? ' has-channel-cover-avatar' : '');

  const label = props.channel.name.slice(0, 2).toUpperCase();
  const resolvedCover = resolveChannelCoverUrl(props.channel);
  const avatarStyle = resolvedCover
    ? ({
        ...gameCoverAssetVariables(props.channel),
        '--channel-avatar-monogram-opacity': '0',
      } as CSSProperties)
    : undefined;

  return (
    <div className={className} style={avatarStyle} title={props.channel.name}>
      <span>{label}</span>
    </div>
  );
}

export function ChannelProfileShell(props: ChannelProfileShellProps): ReactElement {
  const showMemberConsumerActions = props.showMemberConsumerActions ?? true;

  const navItems = buildChannelProfileNavItems({
    eventCount: props.eventCount,
    reviewCount: props.reviewCount,
    isChannelOwner: props.isChannelOwner,
  });

  const shellClassName =
    'channel-profile-page channel-profile-redesign' +
    (props.mode === 'chat' ? ' channel-profile-chat-mode' : '');

  return (
    <>
      <header className="page-title channel-profile-page-title">
        <p>{props.pageEyebrow ?? props.channel.genre + ' channel'}</p>
        <h1>{props.pageTitle ?? props.channel.name}</h1>
      </header>

      <section className={shellClassName} style={props.profileBrandStyle}>
        <article
          className={'channel-profile-hero' + (props.channel.partner ? ' is-partner-galaxy-hero' : '')}
          data-channel-hero="true"
        >
          {props.channel.partner ? (
            <div aria-hidden="true" className="nami-official-galaxy-sky">
              <span className="nami-official-galaxy-shooting-star" />
            </div>
          ) : null}

          <div className="channel-profile-hero-main">
            <ChannelAvatar channel={props.channel} size="lg" />

            <div className="channel-profile-hero-copy">
              <h2>{props.channel.name}</h2>
              <p>{props.channel.tagline}</p>
              <div className="channel-profile-hero-meta">
                <span>{props.developerName}</span>
                <span>{props.channel.genre}</span>
                <span>{props.channel.platforms.join(' · ')}</span>
                <span>{props.channel.subscribers.toLocaleString()} subscribers</span>
                {props.channelBoostPower > 0 ? (
                  <span className="channel-profile-boost-power-pill">
                    {props.channelBoostPower.toLocaleString()} boost power this cycle
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="channel-profile-hero-actions">
            <button
              className="secondary-action profile-return-button"
              onClick={() => props.onNavigate(props.returnPage)}
              type="button"
            >
              {props.returnLabel}
            </button>
            {showMemberConsumerActions ? (
              <>
                <button
                  className={
                    'primary-action' + (props.channelIsSubscribed ? ' is-subscribed-channel-action' : '')
                  }
                  onClick={props.onSubscribe}
                  type="button"
                >
                  {props.channelIsSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
                <ChannelBoostButton
                  channelBoostPower={props.channelBoostPower}
                  channelId={props.channel.id}
                  member={props.selfMember}
                  onBoost={props.onBoostChannel}
                />
              </>
            ) : null}
            {props.activeSection !== 'chat' ? (
              <button className="secondary-action" onClick={() => props.onSelectSection('chat')} type="button">
                Join chat
              </button>
            ) : null}
            {showMemberConsumerActions && canSubscribeToChannelBanners(props.selfMember) ? (
              <button
                className={'secondary-action' + (props.bannerAlertsEnabled ? ' is-banner-alerts-active' : '')}
                onClick={props.onBannerAlertsToggle}
                title={
                  props.bannerAlertsEnabled
                    ? 'Turn off focused banner alerts for this channel'
                    : 'Receive focused banner alerts only from this game channel'
                }
                type="button"
              >
                {props.bannerAlertsEnabled ? 'Banners on' : 'Get banners'}
              </button>
            ) : null}
          </div>
        </article>

        {props.subscribeNotice ? <p className="report-pulse">{props.subscribeNotice}</p> : null}
        {props.boostNotice ? <p className="report-pulse channel-boost-notice">{props.boostNotice}</p> : null}
        {props.bannerNotice ? <p className="report-pulse">{props.bannerNotice}</p> : null}

        <nav aria-label="Channel sections" className="channel-profile-nav" role="tablist">
          {navItems.map((item) => (
            <button
              aria-selected={props.activeSection === item.id}
              className={
                'channel-profile-nav-tab' + (props.activeSection === item.id ? ' is-active-profile-tab' : '')
              }
              key={item.id}
              onClick={() => props.onSelectSection(item.id)}
              role="tab"
              type="button"
            >
              {item.label}
              {item.badge && item.badge > 0 ? (
                <span className="channel-profile-nav-badge">{item.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="channel-profile-section-shell" role="tabpanel">
          {props.children}
        </div>
      </section>
    </>
  );
}