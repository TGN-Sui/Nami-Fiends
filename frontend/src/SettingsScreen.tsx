import { useEffect, useState, type ReactElement } from 'react';

import { AccountConnectSection } from './account-connect.js';
import { BoostCycleSettingsCard } from './BoostCycleSettingsCard.js';
import { MemberDailyStatusSettingsField } from './MemberDailyStatusEditor.js';
import { EmbeddedFeedLinksPanel } from './EmbeddedFeedLinksPanel.js';
import { MembershipAccessCard } from './MembershipAccessCard.js';
import { MembershipFulfillmentPanel } from './MembershipFulfillmentPanel.js';
import { NamiOwnerAdvancedPanel } from './NamiOwnerAdvancedPanel.js';
import { OwnerAccessPrompt } from './OwnerAccessPrompt.js';
import { OwnerPassportLabelsPanel } from './OwnerPassportLabelsPanel.js';
import { OwnerHubCurationPanel } from './OwnerHubCurationPanel.js';
import { OwnerTicketReviewPanel } from './OwnerTicketReviewPanel.js';
import { PassportClaimSettingsPanel } from './PassportClaimSettingsPanel.js';
import { PlatformLinkSettingsPanel } from './PlatformLinkSettingsPanel.js';
import { TagNotificationsPanel } from './TagNotificationsPanel.js';
import {
  countBlockedMembers,
  countMutedMembers,
} from './member-preference-store.js';
import { ProtocolStatusBar } from './ProtocolStatusBar.js';
import { readSafetyReportCount } from './safety-report-store.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { ChannelOwnerPromotionsStatusCard } from './ChannelOwnerPromotionsStatusCard.js';
import { isGameChannelOwner } from './channel-owner-access.js';
import { getSelfMember } from './member-access.js';
import { useProtocolOwner } from './wallet.js';
import {
  canConfigureEmbeddedFeedSurface,
  getConfigurableEmbeddedFeedSurfaces,
  readEmbeddedFeedEnabled,
  canManageChannelBrandPalette,
  readUserSurfaceRole,
  saveEmbeddedFeedEnabled,
  subscribeSurfaceRole,
  type EmbeddedFeedSurface,
  type UserSurfaceRole,
} from './surface-preferences.js';
import { DemoPerspectivePanel } from './DemoPerspectivePanel.js';
import { UserSuggestionsSettingsPanel } from './UserSuggestionsSettingsPanel.js';
import { useDemoPerspective } from './demo-perspective-store.js';
import { useNamiAdminStore } from './nami-admin-store.js';
import { countPendingGameSubmissionTickets } from './nami-officials-submission-counts.js';
import { countPendingPartnerBannerSubmissions } from './partner-banner-submission-store.js';
import { requestProfileEditFocus } from './member-avatar-store.js';
import { ThemeSettingsPanel } from './theme.js';
import { members, type NamiMember, type NamiPage } from './uiMockData.js';

import {
  consumeSettingsSectionFocus,
  requestSettingsSection,
  type SettingsSection,
} from './settings-navigation.js';

export type { SettingsSection } from './settings-navigation.js';
export { requestSettingsSection } from './settings-navigation.js';

const SECTION_LABELS: Record<SettingsSection, string> = {
  overview: 'Overview',
  account: 'Account',
  membership: 'Membership',
  feeds: 'Feeds',
  feedback: 'Feedback',
  safety: 'Safety',
  appearance: 'Look & Feel',
  advanced: 'Advanced',
};

function readChannelBrandPalette(): string[] {
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

function saveChannelBrandPalette(palette: string[]): void {
  window.localStorage.setItem('nami-channel-brand-palette', JSON.stringify(palette.slice(0, 4)));
}

function readSelectedChannelBrandColor(): string {
  try {
    return window.localStorage.getItem('nami-selected-channel-brand-color') ?? '#4da3ff';
  } catch {
    return '#4da3ff';
  }
}

function saveSelectedChannelBrandColor(color: string): void {
  window.localStorage.setItem('nami-selected-channel-brand-color', color);
}

function EmbeddedFeedSettingsPanel(): ReactElement {
  const selfMember = getSelfMember();
  const [role, setRole] = useState<UserSurfaceRole>(() => readUserSurfaceRole());
  const [revision, setRevision] = useState(0);

  useEffect(() => subscribeSurfaceRole(() => setRole(readUserSurfaceRole())), []);

  const surfaceLabels: Record<EmbeddedFeedSurface, string> = {
    member: 'Member feeds',
    studio: 'Studio feeds',
    game: 'Game feeds',
    guild: 'Guild feeds',
  };

  const visibleSurfaces = getConfigurableEmbeddedFeedSurfaces(role, selfMember);

  if (visibleSurfaces.length === 0) {
    return (
      <article className="panel settings-card settings-compact-card settings-section-wide">
        <div className="profile-panel-heading">
          <h2>Embedded Feeds</h2>
          <p>
            {role === 'member'
              ? 'Verified Pro or Elite members can enable member feeds here.'
              : 'No embedded feed options are available for the current surface role.'}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="panel settings-card settings-compact-card settings-section-wide">
      <div className="profile-panel-heading">
        <h2>Embedded Feeds</h2>
        <p>Turn surfaces on when ready. Link editors stay collapsed until a surface is enabled.</p>
      </div>

      <div className="settings-toggle-list" key={revision + role}>
        {visibleSurfaces.map((surface) => {
          const memberId = surface === 'member' ? selfMember.id : undefined;

          return (
            <button
              className="secondary-action settings-embedded-toggle"
              key={surface}
              onClick={() => {
                if (!canConfigureEmbeddedFeedSurface(surface, role, selfMember)) {
                  return;
                }

                saveEmbeddedFeedEnabled(surface, !readEmbeddedFeedEnabled(surface, memberId), memberId);
                setRevision((value) => value + 1);
              }}
              type="button"
            >
              {surfaceLabels[surface]}: {readEmbeddedFeedEnabled(surface, memberId) ? 'On' : 'Off'}
            </button>
          );
        })}
      </div>

      {visibleSurfaces.map((surface) => {
        const memberId = surface === 'member' ? selfMember.id : undefined;

        return (
          <EmbeddedFeedLinksPanel
            enabled={readEmbeddedFeedEnabled(surface, memberId)}
            key={surface + '-links-' + revision}
            {...(memberId ? { memberId } : {})}
            surface={surface}
          />
        );
      })}
    </article>
  );
}

function ChannelBrandPalettePanel(props: {
  palette: string[];
  onChangeColor: (index: number, color: string) => void;
  onReset: () => void;
}): ReactElement {
  return (
    <section className="panel settings-channel-brand-palette settings-channel-owner-controls settings-compact-card settings-section-wide">
      <div className="settings-brand-header">
        <div>
          <span className="mini-badge">Channel Owner</span>
          <h2>Brand Palette</h2>
          <p>Up to four approved colors members can pick on your Game Profile.</p>
        </div>
        <button className="profile-secondary-link settings-brand-reset-button" onClick={props.onReset} type="button">
          Reset
        </button>
      </div>

      <div className="settings-brand-preview-row" aria-label="Approved brand color preview">
        {props.palette.slice(0, 4).map((color) => (
          <span className="settings-brand-preview-dot" key={color} style={{ backgroundColor: color }} />
        ))}
      </div>

      <div className="settings-brand-color-grid settings-brand-color-grid-polished">
        {props.palette.slice(0, 4).map((color, index) => (
          <label className="settings-brand-color-chip settings-brand-color-chip-polished" key={index}>
            <span className="settings-brand-color-number">Color {index + 1}</span>
            <span className="settings-brand-color-preview" style={{ backgroundColor: color }} />
            <input
              aria-label={'Approved channel brand color ' + (index + 1)}
              onChange={(event) => props.onChangeColor(index, event.target.value)}
              type="color"
              value={color}
            />
            <small>{color.toUpperCase()}</small>
          </label>
        ))}
      </div>
    </section>
  );
}

export function SettingsScreen(props: {
  onNavigate?: (page: NamiPage) => void;
  onOpenMember?: (member: NamiMember) => void;
  onDemoPerspectiveApplied?: (page: NamiPage, channelId?: string) => void;
} = {}): ReactElement {
  const { owner } = useProtocolOwner();
  useDemoPerspective();
  const isOwnerDashboard = isOfficialOwner(owner);
  const showIndexedDataPanel = isOwnerDashboard;
  const { openPendingCount } = useNamiAdminStore();
  const openSubmittedCount =
    countPendingPartnerBannerSubmissions() + openPendingCount + countPendingGameSubmissionTickets();
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    () => consumeSettingsSectionFocus() ?? 'overview'
  );
  const memberIds = members.map((member) => member.id);
  const mutedCount = countMutedMembers(memberIds);
  const blockedCount = countBlockedMembers(memberIds);
  const reportCount = readSafetyReportCount();
  const channelOwnerView = isGameChannelOwner();
  const showChannelBrandPalette = canManageChannelBrandPalette() && !channelOwnerView;
  const [settingsChannelBrandPalette, setSettingsChannelBrandPalette] = useState<string[]>(() => {
    return readChannelBrandPalette();
  });

  function updateSettingsChannelBrandColor(index: number, color: string): void {
    const nextPalette = settingsChannelBrandPalette
      .map((currentColor, currentIndex) => (currentIndex === index ? color : currentColor))
      .slice(0, 4);

    setSettingsChannelBrandPalette(nextPalette);
    saveChannelBrandPalette(nextPalette);

    const selectedColor = readSelectedChannelBrandColor();

    if (!nextPalette.includes(selectedColor)) {
      saveSelectedChannelBrandColor(nextPalette[0] ?? color);
    }
  }

  function resetSettingsChannelBrandPalette(): void {
    const defaultPalette = ['#4da3ff', '#e11d48', '#34d399', '#f97316'];

    setSettingsChannelBrandPalette(defaultPalette);
    saveChannelBrandPalette(defaultPalette);
    saveSelectedChannelBrandColor(defaultPalette[0]!);
  }

  const sections: SettingsSection[] = [
    'overview',
    'account',
    'membership',
    'feeds',
    'feedback',
    'safety',
    'appearance',
    ...(showIndexedDataPanel ? (['advanced'] as const) : []),
  ];

  useEffect(() => {
    if (activeSection === 'advanced' && !showIndexedDataPanel) {
      setActiveSection('overview');
    }
  }, [activeSection, showIndexedDataPanel]);

  return (
    <div className="settings-screen-layout settings-screen-redesign" data-settings-screen="true">
      <header className="page-title settings-page-title">
        <p>{isOwnerDashboard ? 'Your account' : 'Preferences'}</p>
        <h1>{isOwnerDashboard ? 'Owner Dashboard' : 'Settings'}</h1>
      </header>

      <nav aria-label="Settings sections" className="settings-section-nav">
        {sections.map((section) => (
          <button
            aria-current={activeSection === section ? 'page' : undefined}
            className={
              'settings-section-nav-button' + (activeSection === section ? ' is-active-settings-section' : '')
            }
            key={section}
            onClick={() => setActiveSection(section)}
            type="button"
          >
            {SECTION_LABELS[section]}
          </button>
        ))}
      </nav>

      <section className="settings-page settings-page-redesign">
        {activeSection === 'overview' ? (
          <div className="settings-overview-grid">
            {isOwnerDashboard ? (
              <article className="panel settings-overview-card">
                <h2>Owner passport</h2>
                <p>Editable Nami CEO and Nami Fiend labels. Independent of scores, ranks, and memberships.</p>
                <button
                  className="profile-secondary-link"
                  onClick={() => setActiveSection('account')}
                  type="button"
                >
                  Edit passport labels
                </button>
              </article>
            ) : null}
            {isOwnerDashboard ? (
              <article className="panel settings-overview-card">
                <h2>Hub spotlight</h2>
                <p>Curate Community Growth channels and Member Spotlight accounts.</p>
                <button
                  className="profile-secondary-link"
                  onClick={() => setActiveSection('account')}
                  type="button"
                >
                  Curate hub sections
                </button>
              </article>
            ) : null}
            {isOwnerDashboard ? (
              <article className="panel settings-overview-card">
                <h2>Submitted tickets</h2>
                <p>
                  {openSubmittedCount > 0
                    ? openSubmittedCount + ' ticket(s) waiting for your review.'
                    : 'No tickets waiting for review.'}
                </p>
                <button
                  className="profile-secondary-link"
                  onClick={() => setActiveSection('account')}
                  type="button"
                >
                  Review tickets
                </button>
              </article>
            ) : null}
            {isOwnerDashboard ? (
              <article className="panel settings-overview-card">
                <h2>Platform console</h2>
                <p>Visual assets, emojis, security enforcement, and indexed protocol data.</p>
                <button
                  className="profile-secondary-link"
                  onClick={() => setActiveSection('advanced')}
                  type="button"
                >
                  Open advanced console
                </button>
              </article>
            ) : null}
            <article className="panel settings-overview-card">
              <h2>Safety snapshot</h2>
              <p>{mutedCount} muted · {blockedCount} blocked · {reportCount} reports</p>
              <button
                className="profile-secondary-link"
                onClick={() => setActiveSection('safety')}
                type="button"
              >
                Open safety settings
              </button>
            </article>
            <article className="panel settings-overview-card">
              <h2>Account & passport</h2>
              <p>Sign-in, passport claim, profile edits, and linked platforms.</p>
              <button
                className="profile-secondary-link"
                onClick={() => {
                  requestProfileEditFocus();
                  props.onNavigate?.('userProfile');
                }}
                type="button"
              >
                Edit Profile
              </button>
              <button
                className="profile-secondary-link"
                onClick={() => setActiveSection('account')}
                type="button"
              >
                Manage account
              </button>
            </article>
            {!channelOwnerView ? (
              <article className="panel settings-overview-card">
                <h2>Membership</h2>
                <p>Plans, fulfillment, and surface role for feeds.</p>
                <button
                  className="profile-secondary-link"
                  onClick={() => setActiveSection('membership')}
                  type="button"
                >
                  View membership
                </button>
              </article>
            ) : null}
            <article className="panel settings-overview-card">
              <h2>Feeds</h2>
              <p>Enable member, game, guild, or studio embeds.</p>
              <button
                className="profile-secondary-link"
                onClick={() => setActiveSection('feeds')}
                type="button"
              >
                Configure feeds
              </button>
            </article>
            <article className="panel settings-overview-card">
              <h2>Dashboard perspectives</h2>
              <p>
                {isOwnerDashboard
                  ? 'Preview what other tiers and roles see, then restore your owner dashboard.'
                  : 'Preview NPC, Elite, channel owner, guild owner, and official owner dashboards.'}
              </p>
              <button
                className="profile-secondary-link"
                onClick={() => setActiveSection('membership')}
                type="button"
              >
                Open perspective switcher
              </button>
            </article>
            <article className="panel settings-overview-card">
              <h2>Suggestions</h2>
              <p>Send product ideas and feedback directly to Nami Officials.</p>
              <button
                className="profile-secondary-link"
                onClick={() => setActiveSection('feedback')}
                type="button"
              >
                Open suggestions box
              </button>
            </article>
          </div>
        ) : null}

        {activeSection === 'account' ? (
          <div className="settings-section-stack">
            <OwnerAccessPrompt />
            {isOwnerDashboard ? <OwnerPassportLabelsPanel /> : null}
            {isOwnerDashboard ? <OwnerHubCurationPanel /> : null}
            {isOwnerDashboard ? <OwnerTicketReviewPanel /> : null}
            {channelOwnerView ? <ChannelOwnerPromotionsStatusCard /> : null}
            {!channelOwnerView ? <MemberDailyStatusSettingsField /> : null}
            <article className="panel settings-card settings-compact-card">
              <div className="profile-panel-heading">
                <h2>Edit Profile</h2>
                <p>Update your display name, bio, avatar, titles, badges, and cosmetics.</p>
              </div>
              <button
                className="nami-surface-button is-primary-surface-button"
                onClick={() => {
                  requestProfileEditFocus();
                  props.onNavigate?.('userProfile');
                }}
                type="button"
              >
                Edit Profile
              </button>
            </article>
            <AccountConnectSection />
            <PassportClaimSettingsPanel />
            <PlatformLinkSettingsPanel />
          </div>
        ) : null}

        {activeSection === 'membership' ? (
          <div className="settings-section-stack">
            {!channelOwnerView ? (
              <>
                <MembershipAccessCard />
                <BoostCycleSettingsCard />
                <MembershipFulfillmentPanel />
              </>
            ) : (
              <>
                <article className="panel settings-card settings-compact-card settings-section-wide">
                  <div className="profile-panel-heading">
                    <h2>Game channel owner</h2>
                    <p>
                      Membership upgrades, boosts, and purchases are managed through Owner tools on your game profile.
                    </p>
                  </div>
                  <button
                    className="nami-surface-button is-primary-surface-button"
                    onClick={() => props.onNavigate?.('userProfile')}
                    type="button"
                  >
                    Open My Game Profile
                  </button>
                </article>
                <ChannelOwnerPromotionsStatusCard />
              </>
            )}
            <DemoPerspectivePanel
              onNavigate={props.onNavigate}
              onPerspectiveApplied={props.onDemoPerspectiveApplied}
            />
          </div>
        ) : null}

        {activeSection === 'feeds' ? (
          <div className="settings-section-stack">
            <EmbeddedFeedSettingsPanel />
          </div>
        ) : null}

        {activeSection === 'feedback' ? (
          <div className="settings-section-stack">
            <UserSuggestionsSettingsPanel />
          </div>
        ) : null}

        {activeSection === 'safety' ? (
          <div className="settings-section-stack">
            <article className="panel settings-card settings-compact-card">
              <div className="profile-panel-heading">
                <h2>Safety Center</h2>
                <p>Muted members, blocked members, reports, and moderation history.</p>
              </div>
              <div className="safety-summary-row">
                <span>{mutedCount} muted</span>
                <span>{blockedCount} blocked</span>
                <span>{reportCount} reports</span>
              </div>
              <button
                className="profile-secondary-link"
                onClick={() => props.onNavigate?.('safetyCenter')}
                type="button"
              >
                Open Safety Center
              </button>
            </article>
            <TagNotificationsPanel
              onNavigateGuilds={() => props.onNavigate?.('guilds')}
              onOpenMember={(memberId) => {
                const member = members.find((entry) => entry.id === memberId);

                if (member) {
                  props.onOpenMember?.(member);
                }
              }}
            />
          </div>
        ) : null}

        {activeSection === 'appearance' ? (
          <div className="settings-section-stack">
            <ThemeSettingsPanel />
            {showChannelBrandPalette ? (
              <ChannelBrandPalettePanel
                onChangeColor={updateSettingsChannelBrandColor}
                onReset={resetSettingsChannelBrandPalette}
                palette={settingsChannelBrandPalette}
              />
            ) : null}
          </div>
        ) : null}

        {activeSection === 'advanced' ? (
          <div className="settings-section-stack">
            <NamiOwnerAdvancedPanel onEnterEditMode={() => props.onNavigate?.('hub')} />
          </div>
        ) : null}
      </section>

      <ProtocolStatusBar />
    </div>
  );
}