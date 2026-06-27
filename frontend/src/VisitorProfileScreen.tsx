import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { BadgeCollectorsBook } from './BadgeCollectorsBook.js';
import { ChatComposerWithEmojis } from './ChatComposerWithEmojis.js';
import { ChatPokeButton } from './ChatPokeButton.js';
import { EmbeddedSocialPanel } from './EmbeddedSocialPanel.js';
import { MemberAudienceSubchannelHub } from './MemberAudienceSubchannelHub.js';
import { MemberAvatarUploadCard } from './MemberAvatarUploadCard.js';
import { MemberProfileActions } from './MemberProfileActions.js';
import {
  MemberProfileShowcase,
  type ShowcaseTab,
} from './MemberProfileShowcase.js';
import { usePokeReceivedCount } from './chat-poke-store.js';
import { ProfilePassportCarousel } from './ProfilePassportCarousel.js';
import { SharePassportButton } from './SharePassportButton.js';
import { TcgFoilPassportCard } from './TcgFoilPassportCard.js';
import {
  canMessageOtherMembers,
  canReportMemberProfile,
} from './member-access.js';
import {
  readProfileCardLayout,
  saveProfileCardLayout,
  type ProfileCardLayout,
} from './profile-card-layout.js';
import { isSelfMember } from './surface-preferences.js';
import { useProfileGroupAffiliations } from './use-profile-group-affiliations.js';
import { usePlayerScoreSnapshot } from './use-player-score.js';
import { useMemberStreamingOnline } from './member-online-store.js';
import {
  readMemberPreference,
  saveMemberPreference,
} from './member-preference-store.js';
import {
  readSafetyActions,
  readSafetyReports,
  saveSafetyReport,
} from './safety-report-store.js';
import { sendPrivateMessage } from './messages-store.js';
import type { NamiGuildRecord, NamiSquadRecord } from './nami-affiliations.js';
import type { NamiChannel, NamiMember, NamiPage } from './uiMockData.js';
import type { TagNavigationHandlers } from './TaggedMessageBody.js';

type VisitorProfileSection = 'home' | 'activity' | 'social';

const VISITOR_PROFILE_SECTIONS: Array<{ id: VisitorProfileSection; label: string; hint: string }> = [
  { id: 'home', label: 'Home', hint: 'Chats & highlights' },
  { id: 'activity', label: 'Activity', hint: 'Time & boosts' },
  { id: 'social', label: 'Social', hint: 'Groups & audience' },
];

function readMemberSignalReview(
  memberId: string,
  fallbackSignal: NamiChannel['signal']
): NamiChannel['signal'] {
  try {
    const savedReviews = window.localStorage.getItem('nami-member-signal-reviews');

    if (!savedReviews) {
      return fallbackSignal;
    }

    const parsedReviews = JSON.parse(savedReviews) as Record<string, NamiChannel['signal']>;

    return parsedReviews[memberId] ?? fallbackSignal;
  } catch {
    return fallbackSignal;
  }
}

function sectionToShowcaseTab(section: VisitorProfileSection): ShowcaseTab | null {
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

export function VisitorProfileScreen(props: {
  member: NamiMember;
  onNavigate: (page: NamiPage) => void;
  onOpenMember: (member: NamiMember) => void;
  onOpenGuild: (guild: NamiGuildRecord) => void;
  onOpenSquad: (squad: NamiSquadRecord) => void;
  onOpenProfile: (channel: NamiChannel) => void;
  onOpenThread: (memberId: string) => void;
  onNavigateGuilds: () => void;
  returnPage: NamiPage;
  returnLabel: string;
  tagHandlers?: TagNavigationHandlers;
}): ReactElement {
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [reportQueued, setReportQueued] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeSection, setActiveSection] = useState<VisitorProfileSection>('home');
  const [profileCarouselSlide, setProfileCarouselSlide] = useState<'passport' | 'badges'>('passport');
  const [profileCardLayout, setProfileCardLayout] = useState<ProfileCardLayout>(() =>
    readProfileCardLayout()
  );
  const [privateDraft, setPrivateDraft] = useState('');

  const reviewedSignal = readMemberSignalReview(props.member.id, props.member.signal);
  const memberPlayerScore = usePlayerScoreSnapshot();
  const canMessage = canMessageOtherMembers() && props.member.id !== 'm1';
  const canReport = canReportMemberProfile();
  const isStreamingOnline = useMemberStreamingOnline(props.member.id);
  const pokesReceived = usePokeReceivedCount(props.member.id);
  const { guildAffiliations, squadAffiliations } = useProfileGroupAffiliations(props.member.id);

  const memberReports = useMemo(() => {
    return readSafetyReports().filter((report) => report.targetId === props.member.id);
  }, [props.member.id, refreshKey]);

  const memberActions = useMemo(() => {
    return readSafetyActions().filter((action) => action.targetId === props.member.id);
  }, [props.member.id, refreshKey]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    const savedPreference = readMemberPreference(props.member.id);
    setIsMuted(savedPreference.muted);
    setIsBlocked(savedPreference.blocked);
    setReportQueued(false);
    setProfileCarouselSlide('passport');
    setRefreshKey((value) => value + 1);
  }, [props.member.id]);

  function chooseProfileCardLayout(layout: ProfileCardLayout): void {
    setProfileCardLayout(layout);
    saveProfileCardLayout(layout);
  }

  function savePreference(nextMuted: boolean, nextBlocked: boolean): void {
    setIsMuted(nextMuted);
    setIsBlocked(nextBlocked);
    saveMemberPreference(props.member.id, { muted: nextMuted, blocked: nextBlocked });
  }

  function reportMember(): void {
    if (!canReportMemberProfile()) {
      return;
    }

    saveSafetyReport({
      source: 'member',
      targetId: props.member.id,
      targetName: props.member.name,
      reason: 'Member profile report',
      channelName: 'Nami',
    });

    setReportQueued(true);
    setRefreshKey((value) => value + 1);
  }

  const showcaseTab = sectionToShowcaseTab(activeSection);

  return (
    <div className="my-profile-modern visitor-profile-modern">
      <header className="visitor-profile-topbar">
        <button
          className="nami-surface-button member-return-button"
          onClick={() => props.onNavigate(props.returnPage)}
          type="button"
        >
          {props.returnLabel}
        </button>

        <div className="visitor-profile-topbar-copy">
          <p className="my-profile-eyebrow">Member profile</p>
          <h1>{props.member.name}</h1>
        </div>

        <div className="member-profile-page-title-actions">
          {!isSelfMember(props.member.id) ? <ChatPokeButton target={props.member} /> : null}
        </div>
      </header>

      <section className="my-profile-passport-anchor is-passport-anchor-bare visitor-profile-passport-stage">
        <ProfilePassportCarousel
          activeSlide={profileCarouselSlide}
          badgeBookView={<BadgeCollectorsBook key={props.member.id} member={props.member} />}
          leadRail={
            <div className="visitor-profile-passport-lead-rail">
              <div
                aria-label="Passport layout"
                className="nami-profile-layout-switch nami-profile-stable-layout-switch visitor-profile-passport-layout-switch"
                role="group"
              >
                {(['vertical', 'horizontal'] as ProfileCardLayout[]).map((layout) => (
                  <button
                    aria-pressed={profileCardLayout === layout}
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
                className="profile-passport-carousel-actions visitor-profile-passport-view-tabs"
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
          }
          passportLayout={profileCardLayout}
          passportView={
            <TcgFoilPassportCard
              layout={profileCardLayout}
              member={props.member}
              playerScore={isSelfMember(props.member.id) ? (memberPlayerScore?.total ?? null) : null}
              pokesReceived={pokesReceived}
              signal={reviewedSignal}
            />
          }
          sideRail={
            <div className="visitor-profile-passport-side-rail">
              <div className="visitor-profile-passport-safety-group" role="group" aria-label="Profile safety actions">
                <button
                  className={isMuted ? 'preference-button is-muted-active' : 'preference-button'}
                  onClick={() => savePreference(!isMuted, isBlocked)}
                  type="button"
                >
                  {isMuted ? 'Muted' : 'Mute'}
                </button>
                <button
                  className={
                    isBlocked ? 'preference-button is-blocked-active' : 'preference-button danger-preference'
                  }
                  onClick={() => savePreference(isMuted, !isBlocked)}
                  type="button"
                >
                  {isBlocked ? 'Blocked' : 'Block'}
                </button>
                {canReport ? (
                  <button className="preference-button report-preference" onClick={reportMember} type="button">
                    Report
                  </button>
                ) : null}
                <button
                  className="nami-surface-button visitor-profile-safety-button"
                  onClick={() => props.onNavigate('safetyCenter')}
                  type="button"
                >
                  Safety
                </button>
              </div>

              {canMessage ? (
                <button
                  className="nami-surface-button is-primary-surface-button visitor-profile-message-button"
                  onClick={() => props.onOpenThread(props.member.id)}
                  type="button"
                >
                  Message
                </button>
              ) : null}

              <SharePassportButton
                className="visitor-profile-share-passport-button"
                member={props.member}
              />
            </div>
          }
        />
      </section>

      <nav aria-label="Member profile sections" className="my-profile-tab-nav" role="tablist">
        {VISITOR_PROFILE_SECTIONS.map((section) => (
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

      <section className="my-profile-tab-panel">
        {showcaseTab ? (
          <MemberProfileShowcase
            activeSection={showcaseTab}
            guildAffiliations={guildAffiliations}
            hideHeroMetrics
            hideIdentityToolbar
            hideTabNav
            isStreamingOnline={isStreamingOnline}
            member={props.member}
            mode="visitor"
            squadAffiliations={squadAffiliations}
            onOpenChannel={props.onOpenProfile}
            onOpenGuild={props.onOpenGuild}
            onOpenSquad={props.onOpenSquad}
            onNavigate={props.onNavigate}
            onSectionChange={(section) => {
              if (section === 'overview') {
                setActiveSection('home');
              } else if (section === 'activity') {
                setActiveSection('activity');
              } else {
                setActiveSection('social');
              }
            }}
            belowShowcase={
              <>
                {activeSection === 'social' ? (
                  <>
                    <MemberProfileActions member={props.member} onNavigateGuilds={props.onNavigateGuilds} />
                    <MemberAudienceSubchannelHub
                      isStreamingOnline={isStreamingOnline}
                      member={props.member}
                      onOpenMember={props.onOpenMember}
                      {...(props.tagHandlers ? { tagHandlers: props.tagHandlers } : {})}
                    />
                  </>
                ) : null}

                {activeSection === 'home' ? (
                  <>
                    {canMessage ? (
                      <details className="panel member-profile-collapsible-panel">
                        <summary>
                          <strong>Private Message</strong>
                          <small>Send a direct message</small>
                        </summary>
                        <ChatComposerWithEmojis
                          ariaLabel={'Private message to ' + props.member.name}
                          canSend={canMessage}
                          className="chat-composer-row message-log-composer"
                          onChange={setPrivateDraft}
                          onSend={() => {
                            if (!privateDraft.trim()) {
                              return;
                            }

                            sendPrivateMessage(props.member.id, props.member.name, privateDraft);
                            setPrivateDraft('');
                            props.onOpenThread(props.member.id);
                          }}
                          placeholder={'Write to ' + props.member.name}
                          value={privateDraft}
                        />
                      </details>
                    ) : null}

                    <details className="panel member-profile-collapsible-panel" open={isStreamingOnline}>
                      <summary>
                        <strong>Member Feed</strong>
                        <small>Live & social embeds</small>
                      </summary>
                      <EmbeddedSocialPanel
                        feedOwnerMemberId={props.member.id}
                        surface="member"
                        title="Member Feed"
                      />
                    </details>
                  </>
                ) : null}

                {reportQueued ? <p className="report-pulse">Report added to moderation queue.</p> : null}
                {isSelfMember(props.member.id) ? <MemberAvatarUploadCard /> : null}
              </>
            }
            safetyPanel={
              <details className="panel member-showcase-safety-drawer">
                <summary>
                  <span className="mini-badge">Moderation</span>
                  <strong>Safety history</strong>
                  <small>Reports and actions connected to this member</small>
                </summary>
                <div className="member-history-stack">
                  {memberReports.length === 0 && memberActions.length === 0 ? (
                    <span className="empty-safety-note">No safety history for this member.</span>
                  ) : null}

                  {memberReports.map((report) => (
                    <div className="member-history-card" key={report.id}>
                      <span className="mini-badge">{report.status}</span>
                      <strong>{report.source} report</strong>
                      <p>{report.reason}</p>
                      <small>
                        {report.channelName} · {report.createdAt}
                      </small>
                    </div>
                  ))}

                  {memberActions.map((action) => (
                    <div className="member-history-card" key={action.id}>
                      <span className="mini-badge">{action.action}</span>
                      <strong>{action.note}</strong>
                      <p>{action.channelName}</p>
                      <small>{action.createdAt}</small>
                    </div>
                  ))}
                </div>
              </details>
            }
          />
        ) : null}
      </section>
    </div>
  );
}