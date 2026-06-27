import { useState, type ReactElement } from 'react';

import { BadgeCollectorsBook } from './BadgeCollectorsBook.js';
import { EmbeddedSocialPanel } from './EmbeddedSocialPanel.js';
import { MemberAudienceSubchannelsPanel } from './MemberAudienceSubchannelsPanel.js';
import { MemberProfileShowcase } from './MemberProfileShowcase.js';
import { MemberPublicPinnedChat } from './MemberPublicPinnedChat.js';
import { MembershipAccessCard } from './MembershipAccessCard.js';
import { PokeReceivedBadge } from './PokeReceivedBadge.js';
import { ProfileEditPanel } from './ProfileEditPanel.js';
import { ProfilePassportCarousel } from './ProfilePassportCarousel.js';
import { ProtocolStatusBar } from './ProtocolStatusBar.js';
import { SharePassportButton } from './SharePassportButton.js';
import { TcgFoilPassportCard } from './TcgFoilPassportCard.js';
import {
  memberProfileExclusiveBadgeLabel,
  isFiendMember,
} from './channel-surface.js';
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

type MyProfileTab = 'overview' | 'audience' | 'identity' | 'edit';

const MY_PROFILE_TABS: Array<{ id: MyProfileTab; label: string; hint: string }> = [
  { id: 'overview', label: 'Overview', hint: 'Activity & feeds' },
  { id: 'audience', label: 'Audience', hint: 'Subchannels & voice' },
  { id: 'identity', label: 'Identity', hint: 'Passport & badges' },
  { id: 'edit', label: 'Edit', hint: 'Profile settings' },
];

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
  const selfStreamingOnline = useMemberStreamingOnline(profileMember.id);
  const profileEdits = useSelfProfileEdits();
  const [activeTab, setActiveTab] = useState<MyProfileTab>('overview');
  const [profileCarouselSlide, setProfileCarouselSlide] = useState<'passport' | 'badges'>('passport');
  const [viewAsGuest, setViewAsGuest] = useState(false);
  const [profileCardLayout, setProfileCardLayout] = useState<ProfileCardLayout>(() =>
    readProfileCardLayout()
  );
  const memberFeedEnabled = readEmbeddedFeedEnabled('member', profileMember.id);
  const mySubscriptions = useSubscribedChannels();

  const { guildAffiliations, squadAffiliations } = useProfileGroupAffiliations(profileMember.id);

  function chooseProfileCardLayout(layout: ProfileCardLayout): void {
    setProfileCardLayout(layout);
    saveProfileCardLayout(layout);
  }

  function scrollToEditPanel(): void {
    requestProfileEditFocus();
    window.requestAnimationFrame(() => {
      document.getElementById(PROFILE_EDIT_PANEL_ID)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

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
              {profileEdits.dailyStatus.trim() || 'Set a daily status in Edit → Profile.'}
            </p>
            {profileEdits.bio.trim() ? <p className="my-profile-bio-line">{profileEdits.bio}</p> : null}
          </div>
        </div>

        <div className="my-profile-hero-side">
          <PokeReceivedBadge memberId={profileMember.id} />
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
          <nav aria-label="My profile sections" className="my-profile-tab-nav" role="tablist">
            {MY_PROFILE_TABS.map((tab) => (
              <button
                aria-selected={activeTab === tab.id}
                className={'my-profile-tab' + (activeTab === tab.id ? ' is-active' : '')}
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

          {activeTab === 'overview' ? (
            <section className="my-profile-tab-panel">
              <MemberProfileShowcase
                guildAffiliations={guildAffiliations}
                isStreamingOnline={selfStreamingOnline}
                member={profileMember}
                mode="self"
                squadAffiliations={squadAffiliations}
                subscriptions={mySubscriptions}
                onEditPhoto={scrollToEditPanel}
                onOpenFullProfileEditor={scrollToEditPanel}
                {...(props.onNavigate ? { onNavigate: props.onNavigate } : {})}
                {...(props.onOpenProfile ? { onOpenChannel: props.onOpenProfile } : {})}
                {...(props.onOpenGuild ? { onOpenGuild: props.onOpenGuild } : {})}
                {...(props.onOpenSquad ? { onOpenSquad: props.onOpenSquad } : {})}
                belowShowcase={
                  <>
                    <details className="panel member-profile-collapsible-panel" open={selfStreamingOnline}>
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
                    <details className="panel member-profile-collapsible-panel">
                      <summary>
                        <strong>Membership</strong>
                        <small>Plans and upgrades</small>
                      </summary>
                      <MembershipAccessCard />
                    </details>
                  </>
                }
              />
            </section>
          ) : null}

          {activeTab === 'audience' ? (
            <section className="my-profile-tab-panel">
              <MemberAudienceSubchannelsPanel editable member={profileMember} />
            </section>
          ) : null}

          {activeTab === 'identity' ? (
            <section className="my-profile-tab-panel my-profile-identity-panel">
              <div className="nami-profile-view-toolbar nami-profile-view-toolbar-stable">
                <div className="nami-profile-toolbar-slot nami-profile-toolbar-slot-layout">
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
                </div>

                <div className="nami-profile-toolbar-slot nami-profile-toolbar-slot-tabs">
                  <div
                    className="profile-passport-carousel-actions"
                    role="tablist"
                    aria-label="Profile card views"
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
                  />
                }
              />
            </section>
          ) : null}

          {activeTab === 'edit' ? (
            <section className="my-profile-tab-panel">
              <ProfileEditPanel />
            </section>
          ) : null}
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