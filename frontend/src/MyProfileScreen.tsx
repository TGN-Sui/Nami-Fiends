import { useMemo, useState, type ReactElement } from 'react';

import { BadgeCollectorsBook } from './BadgeCollectorsBook.js';
import { usePokeReceivedCount } from './chat-poke-store.js';
import { EmbeddedSocialPanel } from './EmbeddedSocialPanel.js';
import { MemberAudienceSubchannelsPanel } from './MemberAudienceSubchannelsPanel.js';
import {
  MemberProfileShowcase,
  type ShowcaseTab,
} from './MemberProfileShowcase.js';
import { MemberPublicPinnedChat } from './MemberPublicPinnedChat.js';
import { MembershipAccessCard } from './MembershipAccessCard.js';
import { ProfileEditPanel } from './ProfileEditPanel.js';
import { ProfilePassportCarousel } from './ProfilePassportCarousel.js';
import { ProtocolStatusBar } from './ProtocolStatusBar.js';
import { SharePassportButton } from './SharePassportButton.js';
import { TcgFoilPassportCard } from './TcgFoilPassportCard.js';
import {
  memberProfileExclusiveBadgeLabel,
  isFiendMember,
} from './channel-surface.js';
import { memberFeatureTier } from './member-access.js';
import {
  maxAudienceSubchannelsForMember,
  readMemberAudienceSubchannels,
} from './member-audience-subchannels-store.js';
import { canShowMemberPublicChat } from './member-public-chat.js';
import { useProfileGroupAffiliations } from './use-profile-group-affiliations.js';
import {
  PROFILE_EDIT_PANEL_ID,
  requestProfileEditFocus,
  useSelfMember,
} from './member-avatar-store.js';
import { UniformMemberAvatar } from './member-avatar.js';
import { useMemberStreamingOnline } from './member-online-store.js';
import { useSelfProfileEdits } from './member-profile-store.js';
import {
  readProfileCardLayout,
  saveProfileCardLayout,
  type ProfileCardLayout,
} from './profile-card-layout.js';
import { requestSettingsSection } from './SettingsScreen.js';
import {
  readEmbeddedFeedEnabled,
  saveEmbeddedFeedEnabled,
} from './surface-preferences.js';
import { useSubscribedChannels } from './subscriptions-store.js';
import { usePlayerScoreSnapshot } from './use-player-score.js';
import type { NamiGuildRecord, NamiSquadRecord } from './nami-affiliations.js';
import type { NamiChannel, NamiMember, NamiPage } from './uiMockData.js';
import type { TagNavigationHandlers } from './TaggedMessageBody.js';

/**
 * Gamer-profile navigation pattern (Steam / Xbox / Discord inspired):
 * identity + passport anchor at top, one tab row, content below.
 */
type MyProfileSection = 'home' | 'activity' | 'social' | 'customize';

const MY_PROFILE_SECTIONS: Array<{ id: MyProfileSection; label: string; hint: string }> = [
  { id: 'home', label: 'Home', hint: 'Chats & highlights' },
  { id: 'activity', label: 'Activity', hint: 'Time & boosts' },
  { id: 'social', label: 'Social', hint: 'Groups & audience' },
  { id: 'customize', label: 'Customize', hint: 'Edit profile' },
];

function sectionToShowcaseTab(section: MyProfileSection): ShowcaseTab | null {
  if (section === 'home') {
    return 'overview';
  }

  if (section === 'activity') {
    return 'activity';
  }

  if (section === 'social') {
    return 'groups';
  }

  return null;
}

export function MyProfileScreen(props: {
  onOpenGuild?: (guild: NamiGuildRecord) => void;
  onOpenSquad?: (squad: NamiSquadRecord) => void;
  onOpenMember?: (member: NamiMember) => void;
  onOpenProfile?: (channel: NamiChannel) => void;
  onNavigate?: (page: NamiPage) => void;
  tagHandlers?: TagNavigationHandlers;
} = {}): ReactElement {
  const profileMember = useSelfMember();
  const profilePlayerScore = usePlayerScoreSnapshot();
  const pokesReceived = usePokeReceivedCount(profileMember.id);
  const selfStreamingOnline = useMemberStreamingOnline(profileMember.id);
  const profileEdits = useSelfProfileEdits();
  const [activeSection, setActiveSection] = useState<MyProfileSection>('home');
  const [profileCarouselSlide, setProfileCarouselSlide] = useState<'passport' | 'badges'>('passport');
  const [viewAsGuest, setViewAsGuest] = useState(false);
  const [profileCardLayout, setProfileCardLayout] = useState<ProfileCardLayout>(() =>
    readProfileCardLayout()
  );
  const memberFeedEnabled = readEmbeddedFeedEnabled('member', profileMember.id);
  const mySubscriptions = useSubscribedChannels();
  const audienceChannels = readMemberAudienceSubchannels(profileMember.id);
  const audienceLimit = maxAudienceSubchannelsForMember(profileMember);

  const { guildAffiliations, squadAffiliations } = useProfileGroupAffiliations(profileMember.id);

  const heroAnalytics = useMemo(
    () => [
      {
        label: 'Guilds',
        value: String(guildAffiliations.length),
        hint: 'Standing groups',
      },
      {
        label: 'Squads',
        value: String(squadAffiliations.length),
        hint: 'Active squads',
      },
      {
        label: 'Audience rooms',
        value: audienceChannels.length + '/' + audienceLimit,
        hint: memberFeatureTier(profileMember) + ' tier cap',
      },
      {
        label: 'Subscriptions',
        value: String(mySubscriptions.length),
        hint: 'Followed channels',
      },
      {
        label: 'Live',
        value: selfStreamingOnline ? 'ON' : 'OFF',
        hint: selfStreamingOnline ? 'Stream surface active' : 'Offline',
      },
    ],
    [
      audienceChannels.length,
      audienceLimit,
      guildAffiliations.length,
      mySubscriptions.length,
      profileMember,
      selfStreamingOnline,
      squadAffiliations.length,
    ]
  );

  function chooseProfileCardLayout(layout: ProfileCardLayout): void {
    setProfileCardLayout(layout);
    saveProfileCardLayout(layout);
  }

  function scrollToEditPanel(): void {
    setActiveSection('customize');
    requestProfileEditFocus();
    window.requestAnimationFrame(() => {
      document.getElementById(PROFILE_EDIT_PANEL_ID)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  const showcaseTab = sectionToShowcaseTab(activeSection);

  return (
    <div className="my-profile-modern">
      <header className="my-profile-hero">
        <div className="my-profile-hero-main">
          <UniformMemberAvatar className="my-profile-hero-avatar" member={profileMember} />
          <div className="my-profile-hero-copy">
            <p className="my-profile-eyebrow">My Profile</p>
            <h1>
              {profileEdits.displayName.trim() || profileMember.name}
              {memberProfileExclusiveBadgeLabel(profileMember) ? (
                <span
                  className={
                    'nami-team-badge' +
                    (isFiendMember(profileMember) ? ' is-nami-rainbow-foil-border' : '')
                  }
                >
                  {memberProfileExclusiveBadgeLabel(profileMember)}
                </span>
              ) : null}
            </h1>
            <p className="my-profile-status-line">
              {profileEdits.dailyStatus.trim() || 'Set your daily status in Customize.'}
            </p>
            {profileEdits.bio.trim() ? (
              <p className="my-profile-bio-line">{profileEdits.bio}</p>
            ) : (
              <p className="my-profile-bio-line is-placeholder-bio">
                Add a short bio so visitors know what you play and stream.
              </p>
            )}
          </div>
        </div>

        <div className="my-profile-hero-side">
          {!viewAsGuest ? <SharePassportButton member={profileMember} /> : null}
          <button
            aria-pressed={viewAsGuest}
            className={'nami-surface-button my-profile-guest-toggle' + (viewAsGuest ? ' is-active-view' : '')}
            onClick={() => setViewAsGuest((value) => !value)}
            type="button"
          >
            {viewAsGuest ? 'Exit guest view' : 'Preview as guest'}
          </button>
        </div>
      </header>

      {!viewAsGuest ? (
        <section aria-label="Community and audience analytics" className="my-profile-hero-analytics">
          {heroAnalytics.map((metric) => (
            <div className="my-profile-analytics-card" key={metric.label}>
              <span className="my-profile-analytics-label">{metric.label}</span>
              <strong className="my-profile-analytics-value">{metric.value}</strong>
              <span className="my-profile-analytics-hint">{metric.hint}</span>
            </div>
          ))}
        </section>
      ) : null}

      {viewAsGuest ? (
        <section className="my-profile-guest-shell">
          {memberFeedEnabled ? (
            <EmbeddedSocialPanel
              feedOwnerMemberId={profileMember.id}
              showFeedToggle={false}
              surface="member"
              title="Member Feed"
              viewerAccess="guest"
            />
          ) : (
            <article className="panel profile-guest-preview-empty">
              <div className="profile-panel-heading">
                <h2>Guest preview</h2>
                <p>Turn on Member feeds to preview how guests see your live embeds.</p>
              </div>
              <button
                className="profile-secondary-link"
                onClick={() => saveEmbeddedFeedEnabled('member', true, profileMember.id)}
                type="button"
              >
                Turn feeds on
              </button>
            </article>
          )}
        </section>
      ) : (
        <>
          <section className="my-profile-passport-anchor">
            <div className="my-profile-passport-toolbar">
              <div className="nami-profile-layout-switch nami-profile-stable-layout-switch">
                {(['vertical', 'horizontal'] as ProfileCardLayout[]).map((layout) => (
                  <button
                    className={profileCardLayout === layout ? 'is-selected-profile-layout' : ''}
                    key={layout}
                    onClick={() => chooseProfileCardLayout(layout)}
                    type="button"
                  >
                    {layout === 'vertical' ? 'Vertical' : 'Horizontal'}
                  </button>
                ))}
              </div>

              <div
                className="profile-passport-carousel-actions"
                role="tablist"
                aria-label="Passport card views"
              >
                <button
                  aria-selected={profileCarouselSlide === 'passport'}
                  className={
                    'nami-surface-button profile-passport-view-tab' +
                    (profileCarouselSlide === 'passport' ? ' is-active-view' : '')
                  }
                  onClick={() => setProfileCarouselSlide('passport')}
                  role="tab"
                  type="button"
                >
                  Passport
                </button>
                <button
                  aria-selected={profileCarouselSlide === 'badges'}
                  className={
                    'nami-surface-button profile-passport-view-tab' +
                    (profileCarouselSlide === 'badges' ? ' is-active-view' : '')
                  }
                  onClick={() => setProfileCarouselSlide('badges')}
                  role="tab"
                  type="button"
                >
                  Badge Book
                </button>
              </div>
            </div>

            <ProfilePassportCarousel
              activeSlide={profileCarouselSlide}
              badgeBookView={<BadgeCollectorsBook key={profileMember.id} member={profileMember} />}
              passportLayout={profileCardLayout}
              passportView={
                <TcgFoilPassportCard
                  layout={profileCardLayout}
                  member={profileMember}
                  onOpenPassport={() => props.onNavigate?.('passport')}
                  playerScore={profilePlayerScore?.total ?? null}
                  pokesReceived={pokesReceived}
                />
              }
            />
          </section>

          <nav aria-label="My profile sections" className="my-profile-tab-nav" role="tablist">
            {MY_PROFILE_SECTIONS.map((section) => (
              <button
                aria-selected={activeSection === section.id}
                className={'my-profile-tab' + (activeSection === section.id ? ' is-active' : '')}
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                role="tab"
                type="button"
              >
                <strong>{section.label}</strong>
                <span>{section.hint}</span>
              </button>
            ))}
          </nav>

          {activeSection === 'customize' ? (
            <section className="my-profile-tab-panel">
              <ProfileEditPanel />
              <article className="panel member-profile-collapsible-panel">
                <div className="profile-panel-heading">
                  <h2>Membership</h2>
                  <p>Plans, upgrades, and tier limits for audience rooms.</p>
                </div>
                <MembershipAccessCard />
              </article>
            </section>
          ) : (
            <section className="my-profile-tab-panel">
              {showcaseTab ? (
                <MemberProfileShowcase
                  activeSection={showcaseTab}
                  guildAffiliations={guildAffiliations}
                  hideHeroMetrics
                  hideIdentityToolbar
                  hideTabNav
                  isStreamingOnline={selfStreamingOnline}
                  member={profileMember}
                  mode="self"
                  squadAffiliations={squadAffiliations}
                  subscriptions={mySubscriptions}
                  onEditPhoto={scrollToEditPanel}
                  onOpenFullProfileEditor={scrollToEditPanel}
                  onSectionChange={(section) => {
                    if (section === 'overview') {
                      setActiveSection('home');
                    } else if (section === 'activity') {
                      setActiveSection('activity');
                    } else {
                      setActiveSection('social');
                    }
                  }}
                  {...(props.onNavigate ? { onNavigate: props.onNavigate } : {})}
                  {...(props.onOpenProfile ? { onOpenChannel: props.onOpenProfile } : {})}
                  {...(props.onOpenGuild ? { onOpenGuild: props.onOpenGuild } : {})}
                  {...(props.onOpenSquad ? { onOpenSquad: props.onOpenSquad } : {})}
                  belowShowcase={
                    <>
                      {activeSection === 'social' ? (
                        <MemberAudienceSubchannelsPanel editable member={profileMember} />
                      ) : null}
                      {activeSection === 'home' ? (
                        <details
                          className="panel member-profile-collapsible-panel"
                          open={selfStreamingOnline}
                        >
                          <summary>
                            <strong>Member Feed</strong>
                            <small>Live & social embeds</small>
                          </summary>
                          <EmbeddedSocialPanel
                            feedOwnerMemberId={profileMember.id}
                            onOpenFeedSettings={() => {
                              requestSettingsSection('feeds');
                              props.onNavigate?.('settings');
                            }}
                            showFeedSettings
                            surface="member"
                            title="Member Feed"
                          />
                        </details>
                      ) : null}
                    </>
                  }
                />
              ) : null}
            </section>
          )}
        </>
      )}

      {!viewAsGuest && canShowMemberPublicChat(profileMember, selfStreamingOnline) ? (
        <MemberPublicPinnedChat
          member={profileMember}
          onOpenMember={(member) => props.onOpenMember?.(member)}
          {...(props.tagHandlers ? { tagHandlers: props.tagHandlers } : {})}
        />
      ) : null}

      <ProtocolStatusBar />
    </div>
  );
}