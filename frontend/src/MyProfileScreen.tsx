import { useState, type ReactElement } from 'react';

import { BadgeCollectorsBook } from './BadgeCollectorsBook.js';
import { usePokeReceivedCount } from './chat-poke-store.js';
import { EmbeddedSocialPanel } from './EmbeddedSocialPanel.js';
import { MemberAudienceSubchannelHub } from './MemberAudienceSubchannelHub.js';
import {
  MemberProfileShowcase,
  type ShowcaseTab,
} from './MemberProfileShowcase.js';
import { MembershipAccessCard } from './MembershipAccessCard.js';
import { ProfileEditPanel } from './ProfileEditPanel.js';
import { ProfilePassportCarousel } from './ProfilePassportCarousel.js';
import { ProfilePassportViewToolbar } from './ProfilePassportViewToolbar.js';
import { ProtocolStatusBar } from './ProtocolStatusBar.js';
import { SharePassportButton } from './SharePassportButton.js';
import { TcgFoilPassportCard } from './TcgFoilPassportCard.js';
import {
  PROFILE_EDIT_PANEL_ID,
  requestProfileEditFocus,
  useSelfMember,
} from './member-avatar-store.js';
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
import { useProfileGroupAffiliations } from './use-profile-group-affiliations.js';
import { usePlayerScoreSnapshot } from './use-player-score.js';
import type { NamiGuildRecord, NamiSquadRecord } from './nami-affiliations.js';
import type { NamiChannel, NamiMember, NamiPage } from './uiMockData.js';
import type { TagNavigationHandlers } from './TaggedMessageBody.js';

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
  const { guildAffiliations, squadAffiliations } = useProfileGroupAffiliations(profileMember.id);

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
      {viewAsGuest ? (
        <section className="my-profile-guest-shell">
          <div className="my-profile-passport-toolbar is-guest-toolbar">
            <p className="my-profile-eyebrow">Guest preview</p>
            <button
              aria-pressed={viewAsGuest}
              className={'nami-surface-button my-profile-guest-toggle' + (viewAsGuest ? ' is-active-view' : '')}
              onClick={() => setViewAsGuest(false)}
              type="button"
            >
              Exit guest view
            </button>
          </div>
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
          <section className="my-profile-passport-anchor is-passport-anchor-bare">
            <div className="my-profile-passport-header">
              <p className="my-profile-eyebrow">My Profile</p>

              <div className="my-profile-passport-side-actions">
                <SharePassportButton member={profileMember} />
                <button
                  aria-pressed={viewAsGuest}
                  className={'nami-surface-button my-profile-guest-toggle' + (viewAsGuest ? ' is-active-view' : '')}
                  onClick={() => setViewAsGuest(true)}
                  type="button"
                >
                  Preview as guest
                </button>
              </div>
            </div>

            <ProfilePassportCarousel
              activeSlide={profileCarouselSlide}
              badgeBookView={<BadgeCollectorsBook key={profileMember.id} member={profileMember} />}
              passportLayout={profileCardLayout}
              toolbar={
                <ProfilePassportViewToolbar
                  activeSlide={profileCarouselSlide}
                  onLayoutChange={chooseProfileCardLayout}
                  onSlideChange={setProfileCarouselSlide}
                  profileCardLayout={profileCardLayout}
                />
              }
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
                        <MemberAudienceSubchannelHub
                          editable
                          isStreamingOnline={selfStreamingOnline}
                          member={profileMember}
                          {...(props.onOpenMember ? { onOpenMember: props.onOpenMember } : {})}
                          {...(props.tagHandlers ? { tagHandlers: props.tagHandlers } : {})}
                        />
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

      <ProtocolStatusBar />
    </div>
  );
}