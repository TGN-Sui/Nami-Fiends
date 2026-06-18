import { useEffect, useState, type ReactElement } from 'react';

import { AccountConnectSection } from './account-connect.js';
import { EmbeddedFeedLinksPanel } from './EmbeddedFeedLinksPanel.js';
import { MembershipAccessCard } from './MembershipAccessCard.js';
import { MembershipFulfillmentPanel } from './MembershipFulfillmentPanel.js';
import { NamiOwnerAdvancedPanel } from './NamiOwnerAdvancedPanel.js';
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
import { getSelfMember } from './member-access.js';
import { useProtocolOwner } from './wallet.js';
import {
  canConfigureEmbeddedFeedSurface,
  getConfigurableEmbeddedFeedSurfaces,
  readEmbeddedFeedEnabled,
  readUserSurfaceRole,
  saveEmbeddedFeedEnabled,
  saveUserSurfaceRole,
  subscribeSurfaceRole,
  type EmbeddedFeedSurface,
  type UserSurfaceRole,
} from './surface-preferences.js';
import { requestProfileEditFocus } from './member-avatar-store.js';
import { ThemeSettingsPanel } from './theme.js';
import { members, type NamiMember, type NamiPage } from './uiMockData.js';

export type SettingsSection =
  | 'overview'
  | 'account'
  | 'membership'
  | 'feeds'
  | 'safety'
  | 'appearance'
  | 'advanced';

const SETTINGS_SECTION_FOCUS_KEY = 'nami.settings.section-focus';

export function requestSettingsSection(section: SettingsSection): void {
  try {
    window.sessionStorage.setItem(SETTINGS_SECTION_FOCUS_KEY, section);
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

export function consumeSettingsSectionFocus(): SettingsSection | null {
  try {
    const stored = window.sessionStorage.getItem(SETTINGS_SECTION_FOCUS_KEY);

    if (!stored) {
      return null;
    }

    window.sessionStorage.removeItem(SETTINGS_SECTION_FOCUS_KEY);

    if (stored in SECTION_LABELS) {
      return stored as SettingsSection;
    }

    return null;
  } catch {
    return null;
  }
}

const SECTION_LABELS: Record<SettingsSection, string> = {
  overview: 'Overview',
  account: 'Account',
  membership: 'Membership',
  feeds: 'Feeds',
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



function SurfaceRoleSettingsPanel(): ReactElement {
  const selfMember = getSelfMember();
  const [role, setRole] = useState<UserSurfaceRole>(() => readUserSurfaceRole());

  useEffect(() => subscribeSurfaceRole(() => setRole(readUserSurfaceRole())), []);

  const roleOptions: Array<{ id: UserSurfaceRole; label: string; detail: string }> = [
    {
      id: 'member',
      label: 'Member',
      detail: 'Verified Pro+ members can enable member feeds only.',
    },
    {
      id: 'channel-owner',
      label: 'Game Channel Owner',
      detail: 'Game feed settings only.',
    },
    {
      id: 'guild-owner',
      label: 'Guild Owner',
      detail: 'Guild feed settings only.',
    },
  ];

  return (
    <article className="panel settings-card settings-compact-card">
      <div className="profile-panel-heading">
        <h2>Surface Role</h2>
        <p>Controls which embedded feed options appear for this account.</p>
      </div>

      <div className="settings-surface-role-row">
        {roleOptions.map((option) => (
          <button
            className={
              'secondary-action settings-surface-role-button' +
              (role === option.id ? ' is-active-surface-role' : '')
            }
            key={option.id}
            onClick={() => saveUserSurfaceRole(option.id)}
            type="button"
          >
            <strong>{option.label}</strong>
            <small>{option.detail}</small>
          </button>
        ))}
      </div>

      <p className="settings-surface-role-footnote">
        Tier {selfMember.tier}
        {selfMember.tier === 'Pro' || selfMember.tier === 'Elite' ? ' · feeds eligible' : ' · member feeds locked'}
      </p>
    </article>
  );
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
        {visibleSurfaces.map((surface) => (
          <button
            className="secondary-action settings-embedded-toggle"
            key={surface}
            onClick={() => {
              if (!canConfigureEmbeddedFeedSurface(surface, role, selfMember)) {
                return;
              }

              saveEmbeddedFeedEnabled(surface, !readEmbeddedFeedEnabled(surface));
              setRevision((value) => value + 1);
            }}
            type="button"
          >
            {surfaceLabels[surface]}: {readEmbeddedFeedEnabled(surface) ? 'On' : 'Off'}
          </button>
        ))}
      </div>

      {visibleSurfaces.map((surface) => (
        <EmbeddedFeedLinksPanel
          enabled={readEmbeddedFeedEnabled(surface)}
          key={surface + '-links-' + revision}
          surface={surface}
        />
      ))}
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
} = {}): ReactElement {
  const { owner } = useProtocolOwner();
  const showIndexedDataPanel = isOfficialOwner(owner);
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    () => consumeSettingsSectionFocus() ?? 'overview'
  );
  const memberIds = members.map((member) => member.id);
  const mutedCount = countMutedMembers(memberIds);
  const blockedCount = countBlockedMembers(memberIds);
  const reportCount = readSafetyReportCount();
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
        <p>Preferences</p>
        <h1>Settings</h1>
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
          </div>
        ) : null}

        {activeSection === 'account' ? (
          <div className="settings-section-stack">
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
            <MembershipAccessCard />
            <MembershipFulfillmentPanel />
            <SurfaceRoleSettingsPanel />
          </div>
        ) : null}

        {activeSection === 'feeds' ? (
          <div className="settings-section-stack">
            <EmbeddedFeedSettingsPanel />
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
            <ChannelBrandPalettePanel
              onChangeColor={updateSettingsChannelBrandColor}
              onReset={resetSettingsChannelBrandPalette}
              palette={settingsChannelBrandPalette}
            />
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