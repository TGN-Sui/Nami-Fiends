import { useRef, useState, type ReactElement } from 'react';

import { boostCycleLimit, getChannelBoostPower, getRemainingBoosts } from './channel-boost-store.js';
import { getSelfMember } from './member-access.js';
import { resolveOwnedGameChannel } from './channel-owner-access.js';
import { readOwnerPromotionStatuses, useChannelOwnerPromotionsState } from './channel-owner-promotions-store.js';
import { resolveChannelCoverUrl, useChannelCoverVersion } from './channel-cover-store.js';
import type { NamiChannel, NamiPage } from './uiMockData.js';

function channelAvatarStyle(channel: NamiChannel): React.CSSProperties | undefined {
  const coverUrl = resolveChannelCoverUrl(channel)?.trim();

  if (!coverUrl) {
    return undefined;
  }

  return {
    backgroundImage: 'url("' + coverUrl.replace(/"/g, '\\u0022') + '")',
  };
}

export function PinnedGameChannelProfileCard(props: {
  onNavigate: (page: NamiPage) => void;
  onOpenGameProfile: () => void;
  onSignOut: () => void | Promise<void>;
}): ReactElement | null {
  useChannelCoverVersion();
  const channel = resolveOwnedGameChannel();
  useChannelOwnerPromotionsState();
  const [menuOpen, setMenuOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const promotionStatuses = readOwnerPromotionStatuses();

  if (!channel) {
    return null;
  }

  const coverUrl = resolveChannelCoverUrl(channel)?.trim();
  const boostPower = getChannelBoostPower(channel.id);
  const selfMember = getSelfMember();
  const boostLimit = boostCycleLimit(selfMember.tier);
  const remainingBoosts = getRemainingBoosts(selfMember);
  const badgePreview = channel.officialBadges?.slice(0, 3) ?? [];

  return (
    <div aria-label="Game channel owner profile" className="nami-pinned-profile-card is-game-channel-owner-card">
      <div
        className={'sidebar-profile-shell nami-pinned-profile-stack' + (menuOpen ? ' is-profile-menu-open' : '')}
        ref={shellRef}
      >
        <button
          aria-expanded={menuOpen}
          className="sidebar-player-progress sidebar-player-progress-button nami-pinned-profile-trigger is-game-channel-owner-trigger"
          onClick={() => props.onOpenGameProfile()}
          type="button"
        >
          <span
            className={'pinned-game-channel-avatar' + (coverUrl ? ' has-channel-cover' : '')}
            style={channelAvatarStyle(channel)}
          >
            {!coverUrl ? <span>{channel.name.slice(0, 2).toUpperCase()}</span> : null}
          </span>

          <div className="sidebar-player-copy pinned-game-channel-copy">
            <span>{channel.name}</span>
            <small>{channel.genre}</small>
            <div className="pinned-game-channel-meta-row">
              <span>{channel.subscribers.toLocaleString()} subscribers</span>
              <span>{boostPower.toLocaleString()} boost power</span>
              {boostLimit > 0 ? (
                <span>
                  {remainingBoosts} of {boostLimit} boost{boostLimit === 1 ? '' : 's'} left
                </span>
              ) : null}
            </div>
          </div>

          <button
            aria-label="Game channel menu"
            className="nami-pinned-profile-chevron-button"
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((value) => !value);
            }}
            type="button"
          >
            <span aria-hidden="true" className="nami-pinned-profile-chevron" />
          </button>
        </button>

        {badgePreview.length > 0 ? (
          <div className="pinned-game-channel-badge-row" aria-label="Official channel badges">
            {badgePreview.map((badge) => (
              <span className="pinned-game-channel-badge-chip" key={badge}>
                {badge}
              </span>
            ))}
          </div>
        ) : null}

        {promotionStatuses.length > 0 ? (
          <div className="pinned-game-channel-promotion-row">
            {promotionStatuses.slice(0, 2).map((status) => (
              <span
                className={
                  'pinned-game-channel-promotion-chip' + (status.isActive ? ' is-active-promotion-chip' : '')
                }
                key={status.id}
              >
                <strong>{status.label}</strong>
                <small>{status.remainingLabel ?? status.detail}</small>
              </span>
            ))}
          </div>
        ) : null}

        {menuOpen ? (
          <div className="sidebar-profile-menu nami-pinned-profile-menu" role="menu">
            <button
              onClick={() => {
                setMenuOpen(false);
                props.onOpenGameProfile();
              }}
              role="menuitem"
              type="button"
            >
              My Game Profile
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                props.onNavigate('settings');
              }}
              role="menuitem"
              type="button"
            >
              Owner settings
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                void props.onSignOut();
              }}
              role="menuitem"
              type="button"
            >
              Sign Out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}