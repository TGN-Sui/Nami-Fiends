import { useEffect, useState, type ReactElement } from 'react';

import { OwnerConsoleUnlockPanel } from './OwnerConsoleUnlockPanel.js';

import { AccountConnectSection } from './account-connect.js';
import { PartnerIntegrationPanel } from './PartnerIntegrationPanel.js';
import { BoostCycleSettingsCard } from './BoostCycleSettingsCard.js';
import { MemberDailyStatusSettingsField } from './MemberDailyStatusEditor.js';
import { EmbeddedFeedLinksPanel } from './EmbeddedFeedLinksPanel.js';
import { IndexedDataPanel } from './IndexedDataPanel.js';
import { LaunchOpsPanel } from './LaunchOpsPanel.js';
import { MembershipAccessCard } from './MembershipAccessCard.js';
import { MembershipFulfillmentPanel } from './MembershipFulfillmentPanel.js';
import { NamiOfficialsSubmissionsPanel } from './NamiOfficialsSubmissionsPanel.js';
import { NamiOwnerAssetEditPanel } from './NamiOwnerAssetEditPanel.js';
import { NamiOwnerEmojiPanel } from './NamiOwnerEmojiPanel.js';
import { NamiOwnerSettingsPanel } from './NamiOwnerSettingsPanel.js';
import { OfficialsRewardStudioPanel } from './OfficialsRewardStudioPanel.js';
import { OwnerAccessPrompt } from './OwnerAccessPrompt.js';
import { OwnerPassportLabelsPanel } from './OwnerPassportLabelsPanel.js';
import { OwnerHubCurationPanel } from './OwnerHubCurationPanel.js';
import { OwnerProvisionedChannelsPanel } from './OwnerProvisionedChannelsPanel.js';
import { OwnerTicketReviewPanel } from './OwnerTicketReviewPanel.js';
import { PassportClaimSettingsPanel } from './PassportClaimSettingsPanel.js';
import { PlatformLinkSettingsPanel } from './PlatformLinkSettingsPanel.js';
import { TagNotificationsPanel } from './TagNotificationsPanel.js';
import { countBlockedMembers, countMutedMembers } from './member-preference-store.js';
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
import { members, type NamiChannel, type NamiMember, type NamiPage } from './uiMockData.js';
import { SettingsSidebar } from './SettingsSidebar.js';
import {
  consumeSettingsNavFocus,
  requestOwnerAdvancedTab,
  requestSettingsNav,
  requestSettingsSection,
  settingsNavHint,
  settingsNavLabel,
  type SettingsNavId,
  type SettingsSection,
} from './settings-navigation.js';

export type { SettingsSection } from './settings-navigation.js';
export { requestOwnerAdvancedTab, requestSettingsNav, requestSettingsSection } from './settings-navigation.js';

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

function isOwnerNav(navId: SettingsNavId): boolean {
  return navId.startsWith('owner-');
}

export function SettingsScreen(props: {
  onNavigate?: (page: NamiPage) => void;
  onOpenMember?: (member: NamiMember) => void;
  onOpenChannel?: (channel: NamiChannel) => void;
  onDemoPerspectiveApplied?: (page: NamiPage, channelId?: string) => void;
} = {}): ReactElement {
  const { owner } = useProtocolOwner();
  useDemoPerspective();
  const isOwnerDashboard = isOfficialOwner(owner);
  const { openPendingCount } = useNamiAdminStore();
  const openSubmittedCount =
    countPendingPartnerBannerSubmissions() + openPendingCount + countPendingGameSubmissionTickets();
  const [activeNav, setActiveNav] = useState<SettingsNavId>(() => consumeSettingsNavFocus() ?? 'home');
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

  useEffect(() => {
    if (isOwnerNav(activeNav) && !isOwnerDashboard) {
      setActiveNav('home');
    }
  }, [activeNav, isOwnerDashboard]);

  useEffect(() => {
    function handleOwnerUnlocked(): void {
      setActiveNav(consumeSettingsNavFocus() ?? 'owner-border-art');
    }

    window.addEventListener('nami-settings-owner-unlocked', handleOwnerUnlocked);

    return () => {
      window.removeEventListener('nami-settings-owner-unlocked', handleOwnerUnlocked);
    };
  }, []);

  function renderOwnerWorkspace(navId: SettingsNavId, content: ReactElement): ReactElement {
    if (!isOwnerDashboard) {
      return <OwnerConsoleUnlockPanel navId={navId} />;
    }

    return content;
  }

  function renderHome(): ReactElement {
    return (
      <div className="settings-home-grid">
        <article className="panel settings-home-status-card">
          <h3>Safety</h3>
          <p>
            {mutedCount} muted · {blockedCount} blocked · {reportCount} reports
          </p>
          <button className="profile-secondary-link" onClick={() => setActiveNav('safety')} type="button">
            Open safety
          </button>
        </article>

        <article className="panel settings-home-status-card">
          <h3>Account</h3>
          <p>Sign-in, passport claim, profile edits, and linked platforms.</p>
          <button className="profile-secondary-link" onClick={() => setActiveNav('account')} type="button">
            Manage account
          </button>
        </article>

        <article className="panel settings-home-status-card">
          <h3>{channelOwnerView ? 'Boosts' : 'Membership'}</h3>
          <p>{channelOwnerView ? 'Weekly discovery boosts for your channel.' : 'Plans, fulfillment, and demo perspectives.'}</p>
          <button className="profile-secondary-link" onClick={() => setActiveNav('membership')} type="button">
            Open membership
          </button>
        </article>

        {isOwnerDashboard ? (
          <article className="panel settings-home-status-card is-owner-highlight-card">
            <span className="mini-badge">Owner</span>
            <h3>Border Art studio</h3>
            <p>Upload chat border cosmetics and define who unlocks each reward.</p>
            <button
              className="nami-surface-button is-primary-surface-button"
              onClick={() => setActiveNav('owner-border-art')}
              type="button"
            >
              Open Border Art
            </button>
          </article>
        ) : null}

        {isOwnerDashboard && openSubmittedCount > 0 ? (
          <article className="panel settings-home-status-card">
            <h3>Tickets waiting</h3>
            <p>{openSubmittedCount} submission(s) need review.</p>
            <button className="profile-secondary-link" onClick={() => setActiveNav('owner-submissions')} type="button">
              Review submissions
            </button>
          </article>
        ) : null}
      </div>
    );
  }

  function renderWorkspaceBody(): ReactElement | null {
    switch (activeNav) {
      case 'home':
        return renderHome();

      case 'account':
        return (
          <div className="settings-workspace-stack">
            <OwnerAccessPrompt />
            {isOwnerDashboard ? <OwnerPassportLabelsPanel /> : null}
            {isOwnerDashboard ? <OwnerHubCurationPanel /> : null}
            {isOwnerDashboard ? (
              <OwnerProvisionedChannelsPanel
                {...(props.onOpenChannel ? { onOpenChannel: props.onOpenChannel } : {})}
              />
            ) : null}
            {isOwnerDashboard ? <OwnerTicketReviewPanel /> : null}
            {channelOwnerView ? <ChannelOwnerPromotionsStatusCard /> : null}
            <BoostCycleSettingsCard />
            {!channelOwnerView ? <MemberDailyStatusSettingsField /> : null}
            <article className="panel settings-card settings-compact-card">
              <div className="profile-panel-heading">
                <h2>Edit Profile</h2>
                <p>Update display name, bio, avatar, titles, badges, and chat border cosmetics.</p>
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
            <PartnerIntegrationPanel />
            <PassportClaimSettingsPanel />
            <PlatformLinkSettingsPanel />
          </div>
        );

      case 'membership':
        return (
          <div className="settings-workspace-stack">
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
                    <p>Promotion purchases and owner tools live on your game profile.</p>
                  </div>
                  <button
                    className="nami-surface-button is-primary-surface-button"
                    onClick={() => props.onNavigate?.('userProfile')}
                    type="button"
                  >
                    Open My Game Profile
                  </button>
                </article>
                <BoostCycleSettingsCard />
                <ChannelOwnerPromotionsStatusCard />
              </>
            )}
            <DemoPerspectivePanel
              onNavigate={props.onNavigate}
              onPerspectiveApplied={props.onDemoPerspectiveApplied}
            />
          </div>
        );

      case 'feeds':
        return (
          <div className="settings-workspace-stack">
            <EmbeddedFeedSettingsPanel />
          </div>
        );

      case 'feedback':
        return (
          <div className="settings-workspace-stack">
            <UserSuggestionsSettingsPanel />
          </div>
        );

      case 'safety':
        return (
          <div className="settings-workspace-stack">
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
        );

      case 'appearance':
        return (
          <div className="settings-workspace-stack">
            <ThemeSettingsPanel />
            {showChannelBrandPalette ? (
              <ChannelBrandPalettePanel
                onChangeColor={updateSettingsChannelBrandColor}
                onReset={resetSettingsChannelBrandPalette}
                palette={settingsChannelBrandPalette}
              />
            ) : null}
          </div>
        );

      case 'owner-platform':
        return renderOwnerWorkspace(
          'owner-platform',
          <div className="settings-workspace-stack">
            <OwnerPassportLabelsPanel />
            <OwnerHubCurationPanel />
            <OwnerProvisionedChannelsPanel
              {...(props.onOpenChannel ? { onOpenChannel: props.onOpenChannel } : {})}
            />
            <OwnerTicketReviewPanel />
          </div>
        );

      case 'owner-border-art':
        return renderOwnerWorkspace(
          'owner-border-art',
          <OfficialsRewardStudioPanel embedded />
        );

      case 'owner-visual-assets':
        return renderOwnerWorkspace(
          'owner-visual-assets',
          <NamiOwnerAssetEditPanel embedded onEnterEditMode={() => props.onNavigate?.('hub')} />
        );

      case 'owner-emojis':
        return renderOwnerWorkspace('owner-emojis', <NamiOwnerEmojiPanel embedded />);

      case 'owner-submissions':
        return renderOwnerWorkspace(
          'owner-submissions',
          <NamiOfficialsSubmissionsPanel embedded />
        );

      case 'owner-security':
        return renderOwnerWorkspace(
          'owner-security',
          <NamiOwnerSettingsPanel
            embedded
            {...(props.onOpenChannel ? { onOpenChannel: props.onOpenChannel } : {})}
          />
        );

      case 'owner-data':
        return renderOwnerWorkspace('owner-data', <IndexedDataPanel embedded />);

      case 'owner-launch':
        return renderOwnerWorkspace('owner-launch', <LaunchOpsPanel embedded />);

      default:
        return null;
    }
  }

  return (
    <div
      className="settings-screen-layout settings-screen-redesign settings-master-detail"
      data-settings-screen="true"
      data-settings-shell="v2"
    >
      <header className="page-title settings-page-title settings-shell-header">
        <div className="settings-shell-header-copy">
          <p>{isOwnerDashboard ? 'Owner dashboard' : 'Member preferences'}</p>
          <h1>{isOwnerDashboard ? 'Settings & console' : 'Settings'}</h1>
        </div>
        <span
          className={
            'settings-shell-mode-pill' + (isOwnerDashboard ? ' is-owner-mode-pill' : ' is-member-mode-pill')
          }
        >
          {isOwnerDashboard ? 'Owner mode' : 'Member mode'}
        </span>
      </header>

      <div className="settings-master-detail-body">
        <SettingsSidebar
          activeNav={activeNav}
          onSelect={setActiveNav}
          pendingTicketCount={openSubmittedCount}
          showOwnerConsole={isOwnerDashboard}
        />

        <section className="settings-workspace">
          <header className="settings-workspace-header">
            <h2>{settingsNavLabel(activeNav)}</h2>
            <p>{settingsNavHint(activeNav)}</p>
          </header>
          <div className="settings-workspace-body">{renderWorkspaceBody()}</div>
        </section>
      </div>

      <ProtocolStatusBar />
    </div>
  );
}