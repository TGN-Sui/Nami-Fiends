import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';

import { MemberDailyStatusQuickEdit } from './MemberDailyStatusEditor.js';
import { buildMemberProfileShowcase, channelForShowcase } from './member-profile-showcase.js';
import { percentForNamiSeasonLevel } from './member-progression.js';
import { useSelfProfileEdits } from './member-profile-store.js';
import { badgeGlyph } from './nami-badge-glyphs.js';
import { resolveChannelCoverUrl } from './channel-cover-store.js';
import { isSelfMember } from './surface-preferences.js';
import type { NamiGuildRecord } from './nami-affiliations.js';
import type { NamiChannel, NamiMember, NamiPage } from './uiMockData.js';

type ShowcaseTab = 'overview' | 'activity' | 'groups';

const SHOWCASE_TABS: Array<{ id: ShowcaseTab; label: string; hint: string }> = [
  { id: 'overview', label: 'Overview', hint: 'Chats & badges' },
  { id: 'activity', label: 'Activity', hint: 'Time, reviews, boosts' },
  { id: 'groups', label: 'Groups', hint: 'Guilds & subs' },
];

function ShowcaseChannelAvatar(props: { channel: NamiChannel; size?: 'sm' | 'md' }): ReactElement {
  const cover = resolveChannelCoverUrl(props.channel);
  const label = props.channel.name.slice(0, 2).toUpperCase();

  return (
    <div
      className={
        'member-showcase-channel-avatar member-showcase-channel-avatar-' +
        (props.size ?? 'md') +
        (cover ? ' has-channel-cover-avatar' : '')
      }
      style={
        cover
          ? ({
              backgroundImage: 'url("' + cover.replace(/"/g, '') + '")',
            } as React.CSSProperties)
          : undefined
      }
    >
      <span>{label}</span>
    </div>
  );
}

function ratingStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(Math.max(0, 5 - rating));
}

function compactChatLabel(title: string): string {
  return title.replace(/ Game Chat$/, '').replace(/ Lounge$/, '');
}

function rarityLabel(rarity: string): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

export function MemberProfileShowcase(props: {
  member: NamiMember;
  isStreamingOnline?: boolean;
  mode?: 'self' | 'visitor';
  onOpenChannel?: (channel: NamiChannel) => void;
  onOpenGuild?: (guild: NamiGuildRecord) => void;
  onNavigate?: (page: NamiPage) => void;
  onOpenStatusSettings?: () => void;
  guildAffiliations?: Array<{ id: string; title: string; memberCount: number; isPublic: boolean; record: NamiGuildRecord }>;
  subscriptions?: NamiChannel[];
  belowShowcase?: ReactNode;
  safetyPanel?: ReactNode;
}): ReactElement {
  const selfProfileEdits = useSelfProfileEdits();
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('overview');
  const [progressTick, setProgressTick] = useState(() => Date.now());
  const isSelf = props.mode === 'self' || isSelfMember(props.member.id);

  const showcase = useMemo(
    () => buildMemberProfileShowcase(props.member, progressTick),
    [props.member, progressTick, isSelf ? selfProfileEdits.dailyStatus : '']
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => setProgressTick(Date.now()), 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  const topChats = showcase.chatPresence.slice(0, 3);
  const hiddenChatCount = Math.max(0, showcase.chatPresence.length - topChats.length);
  const seasonPercent = percentForNamiSeasonLevel(
    showcase.progression.level,
    showcase.progression.currentXp,
    showcase.progression.nextLevelXp
  );

  return (
    <section className="member-profile-showcase member-profile-showcase-tabbed" aria-label={props.member.name + ' activity showcase'}>
      <article className="panel member-showcase-status-panel">
        <div className="member-showcase-status-hero">
          <div className="member-showcase-status-copy">
            <span className="member-showcase-eyebrow">Daily Status</span>
            <p className="member-showcase-daily-status">{showcase.dailyStatus}</p>
          </div>

          {isSelf ? (
            <MemberDailyStatusQuickEdit
              {...(props.onOpenStatusSettings ? { onOpenSettings: props.onOpenStatusSettings } : {})}
            />
          ) : null}
        </div>

        <div className="member-showcase-metric-grid">
          {showcase.offstreamGame ? (
            <div className="member-showcase-metric-card">
              <span className="member-showcase-eyebrow">Playing Offstream</span>
              <strong className="member-showcase-metric-value">{showcase.offstreamGame.title}</strong>
              <p className="member-showcase-metric-detail">{showcase.offstreamGame.statusLabel}</p>
              <span className="member-showcase-metric-foot">{showcase.offstreamGame.platform}</span>
            </div>
          ) : (
            <div className="member-showcase-metric-card is-muted-metric">
              <span className="member-showcase-eyebrow">Playing Offstream</span>
              <strong className="member-showcase-metric-value">Not pinned</strong>
              <p className="member-showcase-metric-detail">No offstream game on display right now.</p>
            </div>
          )}

          <div className="member-showcase-metric-card">
            <span className="member-showcase-eyebrow">Season Reputation</span>
            <strong className="member-showcase-metric-value">Level {showcase.progression.level}</strong>
            <p className="member-showcase-metric-detail">
              {showcase.progression.currentXp.toLocaleString()} / {showcase.progression.nextLevelXp.toLocaleString()} XP
            </p>
            <div className="member-showcase-season-track">
              <div className="member-showcase-season-fill" style={{ width: seasonPercent + '%' }} />
            </div>
          </div>

          <div
            className={
              'member-showcase-metric-card' + (props.isStreamingOnline ? ' is-live-metric-card' : ' is-muted-metric')
            }
          >
            <span className="member-showcase-eyebrow">Live Status</span>
            {props.isStreamingOnline ? (
              <>
                <strong className="member-showcase-metric-value">
                  <span className="embedded-live-pill">LIVE</span>
                </strong>
                <p className="member-showcase-metric-detail">Member feed and live chat are available below.</p>
              </>
            ) : (
              <>
                <strong className="member-showcase-metric-value">Offline</strong>
                <p className="member-showcase-metric-detail">No active stream on this profile.</p>
              </>
            )}
          </div>
        </div>
      </article>

      <nav aria-label="Profile showcase sections" className="member-showcase-tab-nav" role="tablist">
        {SHOWCASE_TABS.map((tab) => (
          <button
            aria-selected={activeTab === tab.id}
            className={'member-showcase-tab' + (activeTab === tab.id ? ' is-active-showcase-tab' : '')}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            <strong>{tab.label}</strong>
            <span>{tab.hint}</span>
          </button>
        ))}
      </nav>

      <div className="member-showcase-tab-panel panel" role="tabpanel">
        {activeTab === 'overview' ? (
          <div className="member-showcase-overview-grid">
            <section className="member-showcase-section">
              <header className="member-showcase-section-head">
                <h2>{isSelf ? 'Your Top Chats' : 'Top Chats'}</h2>
                <p>Where {isSelf ? 'you' : 'they'} spend the most time this week.</p>
              </header>

              <div className="member-showcase-chat-card-grid">
                {topChats.map((chat) => (
                  <button
                    className={
                      'member-showcase-chat-card' + (chat.isActiveNow ? ' is-active-chat-card' : '')
                    }
                    key={chat.chatId}
                    onClick={() => {
                      if (!chat.channelId) {
                        return;
                      }

                      const channel = channelForShowcase(chat.channelId);

                      if (channel) {
                        props.onOpenChannel?.(channel);
                      }
                    }}
                    type="button"
                  >
                    <div className="member-showcase-chat-card-top">
                      {chat.isActiveNow ? <span className="member-showcase-presence-pill is-active-now">In chat now</span> : null}
                      <span className="member-showcase-chat-hours">{chat.hoursThisWeek.toFixed(1)}h</span>
                    </div>
                    <strong>{compactChatLabel(chat.chatTitle)}</strong>
                    <span className="member-showcase-chat-surface">{chat.surfaceLabel}</span>
                  </button>
                ))}

                {hiddenChatCount > 0 ? (
                  <button
                    className="member-showcase-chat-card is-more-chat-card"
                    onClick={() => setActiveTab('activity')}
                    type="button"
                  >
                    <strong>+{hiddenChatCount} more chats</strong>
                    <span className="member-showcase-chat-surface">View full activity breakdown</span>
                  </button>
                ) : null}
              </div>
            </section>

            <section className="member-showcase-section">
              <header className="member-showcase-section-head">
                <h2>Top Badges</h2>
                <p>Featured badges on this passport.</p>
              </header>

              <div className="member-showcase-badge-card-grid">
                {showcase.topBadges.map((badge) => (
                  <div className={'member-showcase-badge-card is-rarity-' + badge.rarity} key={badge.id}>
                    <span aria-hidden="true" className="member-showcase-badge-glyph">
                      {badgeGlyph(badge)}
                    </span>
                    <div className="member-showcase-badge-copy">
                      <strong>{badge.name}</strong>
                      <span>{rarityLabel(badge.rarity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === 'activity' ? (
          <div className="member-showcase-activity-grid">
            <section className="member-showcase-section">
              <header className="member-showcase-section-head">
                <h2>Chat Time</h2>
                <p>Weekly time across lounges and game channels.</p>
              </header>

              <div className="member-showcase-activity-rows">
                {showcase.chatPresence.map((chat) => (
                  <div className="member-showcase-activity-row" key={chat.chatId}>
                    <div className="member-showcase-activity-row-copy">
                      <strong>{compactChatLabel(chat.chatTitle)}</strong>
                      <span>{chat.surfaceLabel}</span>
                    </div>
                    <div className="member-showcase-activity-row-meta">
                      {chat.isActiveNow ? <span className="member-showcase-presence-pill is-active-now">Now</span> : null}
                      <strong className="member-showcase-stat-value">{chat.hoursThisWeek.toFixed(1)}h</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="member-showcase-section">
              <header className="member-showcase-section-head">
                <h2>Reviews & Boosts</h2>
                <p>Channel reviews written and boosts applied.</p>
              </header>

              {showcase.reviews.length > 0 || showcase.boostedChannels.length > 0 ? (
                <div className="member-showcase-activity-rows">
                  {showcase.reviews.map((review) => {
                    const channel = channelForShowcase(review.channelId);

                    return (
                      <button
                        className="member-showcase-activity-row is-clickable-activity-row"
                        key={review.id}
                        onClick={() => channel && props.onOpenChannel?.(channel)}
                        type="button"
                      >
                        <div className="member-showcase-activity-row-copy">
                          <span className="member-showcase-row-tag">Review</span>
                          <strong>{review.title}</strong>
                          <span>{channel?.name ?? review.channelId}</span>
                        </div>
                        <span aria-label={review.rating + ' out of 5 stars'} className="member-showcase-review-stars">
                          {ratingStars(review.rating)}
                        </span>
                      </button>
                    );
                  })}

                  {showcase.boostedChannels.map((boost) => {
                    const channel = channelForShowcase(boost.channelId);

                    if (!channel) {
                      return null;
                    }

                    return (
                      <button
                        className="member-showcase-activity-row is-clickable-activity-row has-row-avatar"
                        key={boost.channelId}
                        onClick={() => props.onOpenChannel?.(channel)}
                        type="button"
                      >
                        <ShowcaseChannelAvatar channel={channel} size="sm" />
                        <div className="member-showcase-activity-row-copy">
                          <span className="member-showcase-row-tag">Boost</span>
                          <strong>{boost.channelName}</strong>
                          <span>
                            {boost.boostsApplied} boost{boost.boostsApplied === 1 ? '' : 's'} · {boost.lastBoostedLabel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="profile-empty-state-copy">No reviews or boosted channels yet.</p>
              )}
            </section>
          </div>
        ) : null}

        {activeTab === 'groups' ? (
          <div className="member-showcase-groups-grid">
            <section className="member-showcase-section">
              <header className="member-showcase-section-head">
                <h2>Guilds & Squads</h2>
                <p>Standing groups tied to this passport.</p>
              </header>

              <div className="member-showcase-group-lanes">
                <div className="member-showcase-group-lane">
                  <span className="member-showcase-eyebrow">Guilds</span>
                  <div className="member-showcase-group-chip-row">
                    {showcase.progression.guilds.map((guild) => (
                      <span className="member-showcase-group-chip" key={'guild-' + guild}>
                        {guild}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="member-showcase-group-lane">
                  <span className="member-showcase-eyebrow">Squads</span>
                  <div className="member-showcase-group-chip-row">
                    {showcase.progression.squads.map((squad) => (
                      <span className="member-showcase-group-chip is-squad-chip" key={'squad-' + squad}>
                        {squad}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {props.guildAffiliations && props.guildAffiliations.length > 0 ? (
                <div className="member-showcase-guild-card-grid">
                  {props.guildAffiliations.map((guild) => (
                    <button
                      className="member-showcase-guild-card"
                      key={guild.id}
                      onClick={() => props.onOpenGuild?.(guild.record)}
                      type="button"
                    >
                      <span className="legend-dot signal-ring signal-green" />
                      <div>
                        <strong>{guild.title}</strong>
                        <span>
                          {guild.isPublic ? 'Public' : 'Private'} · {guild.memberCount} members
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}

              {isSelf && props.onNavigate ? (
                <button
                  className="profile-secondary-link member-showcase-section-action"
                  onClick={() => props.onNavigate?.('guilds')}
                  type="button"
                >
                  Manage Guilds
                </button>
              ) : null}
            </section>

            {isSelf && props.subscriptions ? (
              <section className="member-showcase-section">
                <header className="member-showcase-section-head">
                  <h2>Subscribed Channels</h2>
                  <p>Game channels you follow.</p>
                </header>

                <div className="member-showcase-channel-card-grid">
                  {props.subscriptions.length > 0 ? (
                    props.subscriptions.map((channel) => (
                      <button
                        className="member-showcase-channel-card"
                        key={channel.id}
                        onClick={() => props.onOpenChannel?.(channel)}
                        type="button"
                      >
                        <ShowcaseChannelAvatar channel={channel} />
                        <div>
                          <strong>{channel.name}</strong>
                          <span>{channel.genre}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="profile-empty-state-copy">No subscribed channels yet.</p>
                  )}
                </div>

                {props.onNavigate ? (
                  <button
                    className="profile-secondary-link member-showcase-section-action"
                    onClick={() => props.onNavigate?.('subscriptions')}
                    type="button"
                  >
                    Manage Subscriptions
                  </button>
                ) : null}
              </section>
            ) : (
              <section className="member-showcase-section member-showcase-section-summary">
                <header className="member-showcase-section-head">
                  <h2>Season Standing</h2>
                  <p>Reputation earned this season.</p>
                </header>
                <div className="member-showcase-summary-stat">
                  <strong className="member-showcase-stat-value">{showcase.progression.seasonXp.toLocaleString()}</strong>
                  <span>Season XP · Level {showcase.progression.level}</span>
                </div>
              </section>
            )}
          </div>
        ) : null}
      </div>

      {props.belowShowcase ? <div className="member-showcase-below-stack">{props.belowShowcase}</div> : null}

      {props.safetyPanel}
    </section>
  );
}