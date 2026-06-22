import { useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react';

import {
  ChannelNewsDetailOverlay,
  type ChannelNewsItem,
} from './ChannelNewsDetailOverlay.js';
import { ChannelOwnerSection } from './ChannelOwnerSection.js';
import { ChannelProfileChatSection } from './ChannelProfileChatSection.js';
import { ChannelGameReviewsSection } from './ChannelGameReviewsSection.js';
import { ChannelProfileShell } from './ChannelProfileShell.js';
import { RelatedChannelCoverTile } from './RelatedChannelCoverTile.js';
import {
  readChannelHeroBackgroundOverride,
  readChannelNewsBannerOverride,
  readChannelTrailerOverride,
  useChannelOwnerMediaVersion,
} from './channel-owner-media-store.js';
import {
  reorderProfileTabs,
  useChannelOwnerEditMode,
  useChannelOwnerLayout,
} from './channel-owner-layout-store.js';
import { EventCardActionBar } from './EventCardActionBar.js';

import { useChannelBannerNotificationsStore } from './channel-banner-notifications-store.js';
import { getChannelBrandThemeForTile } from './channel-profile-brand.js';
import type { ChannelProfileSection } from './channel-profile-sections.js';
import {
  scrollToChannelOwnerFocus,
  type ChannelProfileOwnerFocus,
} from './channel-profile-navigation.js';
import { getChannelGameReviews, useChannelGameReviewsStore } from './channel-game-reviews-store.js';
import { resolveChannelCoverUrl, useChannelCoverVersion } from './channel-cover-store.js';
import {
  eventImportanceClass,
  formatEventTimeInTimezone,
  getChannelEvents,
  type StoredEvent,
  useEventsStore,
} from './events-store.js';
import { isPreApprovedGameOwner, isFullyApprovedGameOwner } from './game-owner-session-store.js';
import { ownsGameChannel } from './channel-owner-access.js';
import {
  useChannelOwnerProfileVersion,
  withChannelOwnerProfile,
} from './channel-owner-profile-store.js';
import { useChannelProfileChrome } from './useChannelProfileChrome.js';
import { useHorizontalScrollStrip } from './useHorizontalScrollStrip.js';
import type { TagNavigationHandlers } from './TaggedMessageBody.js';
import { channels, developers, type NamiChannel, type NamiMember, type NamiPage } from './uiMockData.js';

function channelDeveloper(channel: NamiChannel): (typeof developers)[number] {
  return developers.find((developer) => developer.id === channel.developerId) ?? developers[0]!;
}

function gameVerificationLabel(channel: NamiChannel): string {
  return channel.verifiedGame ? 'Verified Game' : 'Community Game';
}

function readOwnerBrandPalette(): string[] {
  try {
    const savedPalette = window.localStorage.getItem('nami-channel-brand-palette');

    if (!savedPalette) {
      return ['#4da3ff', '#e11d48', '#34d399', '#f97316'];
    }

    const parsedPalette = JSON.parse(savedPalette);

    if (!Array.isArray(parsedPalette)) {
      return ['#4da3ff', '#e11d48', '#34d399', '#f97316'];
    }

    return parsedPalette
      .filter((color): color is string => typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color))
      .slice(0, 4);
  } catch {
    return ['#4da3ff', '#e11d48', '#34d399', '#f97316'];
  }
}

function saveOwnerBrandPalette(palette: string[]): void {
  window.localStorage.setItem('nami-channel-brand-palette', JSON.stringify(palette.slice(0, 4)));
}

function gameVerificationClass(channel: NamiChannel): string {
  const developer = channelDeveloper(channel);

  if (channel.verifiedGame) {
    return 'is-verified-game-surface';
  }

  if (developer.approved) {
    return 'is-studio-approved-surface';
  }

  return 'is-community-game-surface';
}

export function ChannelProfileScreen(props: {
  channel: NamiChannel;
  onNavigate: (page: NamiPage) => void;
  onOpenProfile?: (channel: NamiChannel) => void;
  onOpenStudioProfile?: (developer: (typeof developers)[number]) => void;
  onOpenMember?: (memberId: string) => void;
  onOpenChatMember?: (member: NamiMember) => void;
  onViewEvent: (event: StoredEvent) => void;
  returnPage: NamiPage;
  returnLabel: string;
  initialSection?: ChannelProfileSection;
  ownerFocus?: ChannelProfileOwnerFocus;
  tagHandlers: TagNavigationHandlers;
}): ReactElement {
  useChannelCoverVersion();
  useChannelOwnerMediaVersion();
  useEventsStore();
  useChannelBannerNotificationsStore();
  useChannelGameReviewsStore();
  const ownerProfileVersion = useChannelOwnerProfileVersion();
  const channel = useMemo(
    () => withChannelOwnerProfile(props.channel),
    [props.channel, ownerProfileVersion]
  );

  const chrome = useChannelProfileChrome(channel);
  const preApprovedOwnerView =
    isPreApprovedGameOwner() && !isFullyApprovedGameOwner() && ownsGameChannel(channel.id);
  const channelCoverUrl = resolveChannelCoverUrl(channel)?.trim() ?? '';
  const newsBannerUrl = readChannelNewsBannerOverride(channel.id)?.trim() ?? '';
  const heroBackgroundUrl = readChannelHeroBackgroundOverride(channel.id)?.trim() ?? '';
  const trailerUrl = readChannelTrailerOverride(channel.id)?.trim() ?? '';
  const ownerLayout = useChannelOwnerLayout(channel.id);
  const profileEditMode = useChannelOwnerEditMode(channel.id) && chrome.isChannelOwner;
  const gameEvents = getChannelEvents(channel, {
    includeHiddenDrafts: preApprovedOwnerView,
  });
  const reviewCount = getChannelGameReviews(channel.id).length;

  const defaultSection: ChannelProfileSection = preApprovedOwnerView
    ? 'about'
    : props.initialSection ?? (chrome.isChannelOwner ? 'owner' : 'news');
  const [activeSection, setActiveSection] = useState<ChannelProfileSection>(defaultSection);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [ownerBrandPalette, setOwnerBrandPalette] = useState<string[]>(() => readOwnerBrandPalette());
  const relatedChannels = channels
    .filter((entry) => entry.id !== channel.id)
    .sort((left, right) => {
      const leftSameGenre = left.genre === channel.genre ? 1 : 0;
      const rightSameGenre = right.genre === channel.genre ? 1 : 0;

      return rightSameGenre - leftSameGenre || right.subscribers - left.subscribers;
    })
    .slice(0, 8);

  const relatedChannelStripRef = useHorizontalScrollStrip<HTMLDivElement>();

  const officialBadgeIcons = [
    { icon: '✓', label: 'Verified Channel' },
    { icon: '◇', label: 'SuiNS Linked' },
    { icon: 'N', label: 'Nami Approved' },
    { icon: '!', label: 'Official Announcements' },
  ];

  const customBadgeIcons = [
    { icon: 'L', label: 'Launch Crew' },
    { icon: 'G', label: 'Guild Friendly' },
    { icon: 'E', label: 'Event Host' },
    { icon: '★', label: 'Creator Pick' },
  ];

  const verifiedLinks = [
    {
      icon: 'S',
      label: 'SuiNS',
      value: channel.handle + '.sui',
      status: 'Verified',
    },
    {
      icon: 'D',
      label: 'Developer',
      value: 'Owner proof linked',
      status: 'Verified',
    },
    {
      icon: 'W',
      label: 'Website',
      value: channel.name + ' profile hub',
      status: 'Verified',
    },
  ];

  const announcements: ChannelNewsItem[] = [
    {
      id: 'event-board-live',
      title: 'Official event board is live',
      summary:
        'Event banners, guild schedules, and reward notes are now surfaced on this profile instead of main chat.',
      fullBody:
        'The official event board is now live on this game channel profile.\n\nSubscribers can browse upcoming tournaments, community nights, and reward windows without digging through chat history. Guild leads can still coordinate in their rooms, but the channel owner now has a single place to publish schedules that every visitor sees first.\n\nCheck the Events tab for the full calendar and mark yourself Interested to receive reminders before go-live.',
      tag: 'Official',
      publishedAtLabel: 'Posted 2 days ago',
    },
    {
      id: 'patch-notes-synced',
      title: 'Patch notes synced',
      summary: 'Developer notes and support updates now stay separate from everyday community conversation.',
      fullBody:
        'Patch notes and support advisories are synced to the News section automatically.\n\nThis keeps high-signal developer communication visible without burying it inside the main chat scroll. Each update includes the headline here and the full breakdown when you open the article.\n\nOlder notes remain available in the archive queue while the latest three stay pinned for quick scanning.',
      tag: 'Update',
      publishedAtLabel: 'Posted 5 days ago',
    },
    {
      id: 'banner-slot-available',
      title: 'Custom banner slot available',
      summary: 'Elite owners can rotate profile banners and focused alert creative for Get Banners subscribers.',
      fullBody:
        'Elite channel owners can now rotate profile banners, frames, and focused alert creative.\n\nUse Owner tools to upload cover art, draft alert copy, preview the subscriber popup, and publish when the message looks right. Get Banners subscribers receive the alert anywhere in Nami without subscribing to every chat room.\n\nPro members can still customize frames while Elite unlocks the full banner workflow.',
      tag: 'Pro / Elite',
      publishedAtLabel: 'Posted 1 week ago',
    },
  ];

  const [featuredAnnouncement, ...moreAnnouncements] = announcements;
  const selectedNewsArticle =
    announcements.find((article) => article.id === selectedNewsId) ?? null;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [channel.id]);

  useEffect(() => {
    if (props.initialSection === 'owner' && !chrome.isChannelOwner) {
      setActiveSection('news');
      return;
    }

    if (props.initialSection) {
      setActiveSection(props.initialSection);
      return;
    }

    setActiveSection((current) => {
      if (current === 'owner' && !chrome.isChannelOwner) {
        return 'news';
      }

      if (preApprovedOwnerView) {
        return 'about';
      }

      return chrome.isChannelOwner ? 'owner' : 'news';
    });
  }, [chrome.isChannelOwner, preApprovedOwnerView, channel.id, props.initialSection]);

  useEffect(() => {
    if (!chrome.isChannelOwner || activeSection !== 'owner' || !props.ownerFocus) {
      return;
    }

    const timer = window.setTimeout(() => {
      scrollToChannelOwnerFocus(props.ownerFocus ?? null);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [activeSection, chrome.isChannelOwner, channel.id, props.ownerFocus]);

  useEffect(() => {
    if (activeSection === 'owner' && !chrome.isChannelOwner) {
      setActiveSection('news');
    }
  }, [activeSection, chrome.isChannelOwner]);

  function handleSelectSection(section: ChannelProfileSection): void {
    if (preApprovedOwnerView && section !== 'about' && section !== 'owner' && section !== 'events') {
      return;
    }

    if (section === 'owner' && !chrome.isChannelOwner) {
      setActiveSection('news');
      return;
    }

    setActiveSection(section);
  }

  function renderBadgeIcon(
    badge: { icon: string; label: string },
    badgeType: 'official' | 'custom',
  ): ReactElement {
    return (
      <span
        className={'profile-badge-icon profile-badge-icon-' + badgeType}
        key={badge.label}
        title={badge.label}
      >
        {badge.icon}
      </span>
    );
  }

  function renderOfficialLinkIcon(link: {
    icon: string;
    label: string;
    value: string;
    status: string;
  }): ReactElement {
    return (
      <button className="profile-link-icon" key={link.label} title={link.label + ': ' + link.value} type="button">
        <span>{link.icon}</span>
        <small>{link.label}</small>
      </button>
    );
  }

  function renderNewsCard(article: ChannelNewsItem, variant: 'featured' | 'item'): ReactElement {
    return (
      <button
        aria-label={'Read full update: ' + article.title}
        className={
          'channel-profile-news-card announcement-card is-clickable-news-card' +
          (variant === 'featured' ? ' channel-profile-news-featured' : ' channel-profile-news-item')
        }
        key={article.id}
        onClick={() => setSelectedNewsId(article.id)}
        type="button"
      >
        <span>{article.tag}</span>
        <strong>{article.title}</strong>
        <p>{article.summary}</p>
        <span className="channel-profile-news-read-more">Read full update</span>
      </button>
    );
  }

  function renderNewsSection(): ReactElement {
    return (
      <section className="channel-profile-section channel-profile-news">
        {newsBannerUrl || channelCoverUrl ? (
          <div
            className="channel-profile-news-cover"
            style={{
              backgroundImage: 'url(' + JSON.stringify(newsBannerUrl || channelCoverUrl) + ')',
            }}
          />
        ) : null}

        {featuredAnnouncement ? renderNewsCard(featuredAnnouncement, 'featured') : null}

        {moreAnnouncements.length > 0 ? (
          <div className="channel-profile-news-list">
            {moreAnnouncements.map((announcement) => renderNewsCard(announcement, 'item'))}
          </div>
        ) : null}
      </section>
    );
  }

  function renderEventsSection(): ReactElement {
    return (
      <section className="channel-profile-section channel-profile-events">
        <div className="channel-profile-section-head">
          <div>
            <h2>Upcoming events</h2>
            <p>
              {preApprovedOwnerView
                ? 'Draft events stay hidden from players until Nami Officials approve your channel.'
                : 'Official schedules and live moments from ' + channel.name + '.'}
            </p>
          </div>
          {chrome.isChannelOwner ? (
            <button
              className="nami-surface-button"
              onClick={() => props.onNavigate('channelEvents')}
              type="button"
            >
              Manage events
            </button>
          ) : null}
        </div>

        {gameEvents.length === 0 ? (
          <div className="channel-profile-empty-state">
            <strong>No events posted yet</strong>
            <p>Check back for tournaments, launches, and community nights.</p>
            {chrome.isChannelOwner ? (
              <button
                className="primary-action"
                onClick={() => props.onNavigate('channelEvents')}
                type="button"
              >
                Create first event
              </button>
            ) : null}
          </div>
        ) : (
          <div className="channel-profile-event-list">
            {gameEvents.map((event, eventIndex) => (
              <article
                className={'channel-profile-event-row' + eventImportanceClass(event)}
                key={event.id}
              >
                <div className="channel-profile-event-copy">
                  <span className="mini-badge">{event.status}</span>
                  {event.hiddenUntilChannelApproval ? (
                    <span className="mini-badge is-hidden-event-draft">Hidden draft</span>
                  ) : null}
                  <strong>{event.title}</strong>
                  <p>{formatEventTimeInTimezone(event.startsAtUtc)}</p>
                </div>
                <EventCardActionBar
                  event={event}
                  eventCount={gameEvents.length}
                  eventIndex={eventIndex}
                  onEdit={(selectedEvent) => {
                    try {
                      window.sessionStorage.setItem(
                        'nami.channel.event-edit-focus',
                        selectedEvent.id
                      );
                    } catch {
                      // Ignore storage failures in restricted environments.
                    }

                    props.onNavigate('channelEvents');
                  }}
                  onView={() => props.onViewEvent(event)}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  function renderReviewsSection(): ReactElement {
    return props.onOpenMember ? (
      <ChannelGameReviewsSection channel={channel} onOpenMember={props.onOpenMember} />
    ) : (
      <ChannelGameReviewsSection channel={channel} />
    );
  }

  function renderChatSection(): ReactElement {
    return (
      <ChannelProfileChatSection
        channel={channel}
        channelBrandTheme={chrome.selectedBrandTheme}
        onNavigate={props.onNavigate}
        onOpenMember={props.onOpenChatMember ?? (() => undefined)}
        tagHandlers={props.tagHandlers}
      />
    );
  }

  function renderAboutSection(): ReactElement {
    return (
      <section className="channel-profile-section channel-profile-about">
        <div className="channel-profile-about-intro">
          <h2>About {channel.name}</h2>
          <p>{channel.tagline}</p>

          {trailerUrl ? (
            <div className="channel-profile-about-trailer">
              <h3>Game trailer</h3>
              <video
                className="channel-profile-about-trailer-player"
                controls
                playsInline
                preload="metadata"
                src={trailerUrl}
              />
            </div>
          ) : null}

          <div className="channel-profile-about-meta">
            <span>{channel.handle}</span>
            <span>{channel.genre}</span>
            <span>{channel.platforms.join(' · ')}</span>
            <span>{channel.subscribers.toLocaleString()} subscribers</span>
          </div>
        </div>

        <div className="channel-profile-about-block">
          <h3>Studio</h3>
          <div className="channel-profile-studio-row">
            <span>{chrome.developerProfile.name}</span>
            <i className={gameVerificationClass(channel)}>{gameVerificationLabel(channel)}</i>
            <button
              className="surface-studio-link"
              onClick={() => props.onOpenStudioProfile?.(chrome.developerProfile)}
              type="button"
            >
              Open studio
            </button>
          </div>
        </div>

        <div className="channel-profile-about-block">
          <h3>Official links</h3>
          <div className="profile-link-icon-row">{verifiedLinks.map((link) => renderOfficialLinkIcon(link))}</div>
        </div>

        <div className="channel-profile-about-block">
          <h3>Badges</h3>
          <div className="channel-profile-badge-strip">
            {officialBadgeIcons.map((badge) => renderBadgeIcon(badge, 'official'))}
            {customBadgeIcons.map((badge) => renderBadgeIcon(badge, 'custom'))}
          </div>
        </div>

        <div className="channel-profile-about-block channel-profile-related-block">
          <h3>Related channels</h3>
          <div
            aria-label="Related game channels"
            className="channel-profile-related-strip"
            ref={relatedChannelStripRef}
            role="region"
            tabIndex={0}
          >
            <div className="channel-profile-related-tile-grid">
              {relatedChannels.map((channel) => {
                const channelTheme = getChannelBrandThemeForTile(channel.id);

                return (
                  <RelatedChannelCoverTile
                    brandPrimary={channelTheme.primary}
                    brandSoft={channelTheme.secondary}
                    channel={channel}
                    key={channel.id}
                    onOpen={() => props.onOpenProfile?.(channel)}
                  />
                );
              })}
            </div>
          </div>
        </div>

      </section>
    );
  }

  function updateOwnerBrandColor(index: number, color: string): void {
    const nextPalette = ownerBrandPalette
      .map((currentColor, currentIndex) => (currentIndex === index ? color : currentColor))
      .slice(0, 4);

    setOwnerBrandPalette(nextPalette);
    saveOwnerBrandPalette(nextPalette);
  }

  function resetOwnerBrandPalette(): void {
    const defaultPalette = ['#4da3ff', '#e11d48', '#34d399', '#f97316'];

    setOwnerBrandPalette(defaultPalette);
    saveOwnerBrandPalette(defaultPalette);
  }

  function renderOwnerSection(): ReactElement {
    return (
      <ChannelOwnerSection
        channel={channel}
        isEliteOwner={chrome.isEliteChannelOwner}
        onChangeBrandColor={updateOwnerBrandColor}
        onResetBrandPalette={resetOwnerBrandPalette}
        ownerBrandPalette={ownerBrandPalette}
      />
    );
  }

  function renderActiveSection(): ReactElement | null {
    if (activeSection === 'news') {
      return renderNewsSection();
    }

    if (activeSection === 'events') {
      return renderEventsSection();
    }

    if (activeSection === 'reviews') {
      return renderReviewsSection();
    }

    if (activeSection === 'about') {
      return renderAboutSection();
    }

    if (activeSection === 'owner') {
      if (chrome.isChannelOwner) {
        return renderOwnerSection();
      }

      return renderNewsSection();
    }

    if (activeSection === 'chat') {
      return renderChatSection();
    }

    return renderNewsSection();
  }

  return (
    <>
      {preApprovedOwnerView ? (
        <div className="preapproved-game-owner-banner" role="status">
          <strong>Pre-approved workspace</strong>
          <p>
            Your game channel is hidden from other users until Nami Officials approve it. Prepare hidden
            events, upload banner covers, and save promotion drafts now. Purchases, partner banner
            tickets, emoji uploads, and banner sends unlock after approval.
          </p>
        </div>
      ) : null}
      <ChannelProfileShell
        activeSection={activeSection}
        mode={activeSection === 'chat' ? 'chat' : 'profile'}
        bannerAlertsEnabled={chrome.bannerAlertsEnabled}
        bannerNotice={chrome.bannerNotice}
        boostNotice={chrome.boostNotice}
        channel={channel}
        channelBoostPower={chrome.channelBoostPower}
        channelIsSubscribed={chrome.channelIsSubscribed}
        developerName={chrome.developerProfile.name}
        eventCount={gameEvents.length}
        isChannelOwner={chrome.isChannelOwner}
        {...(chrome.isChannelOwner
          ? { pageEyebrow: 'My game channel', pageTitle: 'My Profile' }
          : {})}
        {...(heroBackgroundUrl ? { heroBackgroundUrl } : {})}
        {...(chrome.isChannelOwner
          ? {
              profileEditMode,
              tabOrder: ownerLayout.tabOrder,
              onReorderTabs: (tabOrder) => reorderProfileTabs(channel.id, tabOrder),
            }
          : {})}
        {...(preApprovedOwnerView ? { preApprovedOwnerView: true } : {})}
        showMemberConsumerActions={chrome.showMemberConsumerActions && !preApprovedOwnerView}
        onBannerAlertsToggle={chrome.handleBannerAlertsToggle}
        onBoostChannel={chrome.handleBoostChannel}
        onNavigate={props.onNavigate}
        onSelectSection={handleSelectSection}
        onSubscribe={chrome.handleSubscribe}
        profileBrandStyle={chrome.profileBrandStyle}
        returnLabel={props.returnLabel}
        returnPage={props.returnPage}
        reviewCount={reviewCount}
        selfMember={chrome.selfMember}
        subscribeNotice={chrome.subscribeNotice}
      >
        {renderActiveSection()}
      </ChannelProfileShell>

      {selectedNewsArticle ? (
        <ChannelNewsDetailOverlay
          article={selectedNewsArticle}
          channelName={channel.name}
          onClose={() => setSelectedNewsId(null)}
        />
      ) : null}
    </>
  );
}

