import { useEffect, useRef, type ReactElement } from 'react';

import { isDemoSimulationEnabled } from './app-config.js';
import {
  applyDemoPerspective,
  consumeDemoPerspectiveFocus,
  DEMO_PERSPECTIVE_PRESETS,
  readActiveDemoPerspectiveId,
  restoreOwnerDemoPerspective,
  type DemoPerspectiveId,
  useDemoPerspective,
} from './demo-perspective-store.js';
import { requestSettingsSection } from './settings-navigation.js';
import type { NamiPage } from './uiMockData.js';

export function DemoPerspectivePanel(props: {
  onNavigate?: ((page: NamiPage) => void) | undefined;
  onPerspectiveApplied?: ((page: NamiPage, channelId?: string) => void) | undefined;
}): ReactElement | null {
  const demoEnabled = isDemoSimulationEnabled();
  const panelRef = useRef<HTMLElement | null>(null);
  const { activePerspective, isActive } = useDemoPerspective();
  const activeId = readActiveDemoPerspectiveId();

  useEffect(() => {
    if (!demoEnabled || !consumeDemoPerspectiveFocus()) {
      return;
    }

    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [demoEnabled]);

  if (!demoEnabled) {
    return null;
  }

  function handleApply(perspectiveId: DemoPerspectiveId): void {
    const preset = applyDemoPerspective(perspectiveId);

    if (preset.id === 'nami-official-owner') {
      requestSettingsSection('advanced');
    }

    props.onPerspectiveApplied?.(preset.landingPage, preset.channelId);

    // Channel-owner perspectives navigate via onPerspectiveApplied (owner section).
    if (!preset.channelId) {
      props.onNavigate?.(preset.landingPage);
    }
  }

  function handleRestoreOwner(): void {
    restoreOwnerDemoPerspective();
    requestSettingsSection('advanced');
    props.onPerspectiveApplied?.('settings');
    props.onNavigate?.('settings');
  }

  return (
    <article
      className="panel settings-card settings-compact-card settings-section-wide"
      id="demo-perspective-panel"
      ref={panelRef}
    >
      <div className="profile-panel-heading">
        <h2>Dashboard Perspectives</h2>
        <p>
          Preview Nami as NPCs, Adventurers, Pro and Elite creators, game channel owners, guild
          owners, Nami Team, moderators, and official owners. UI gates update to match each role.
        </p>
      </div>

      {isActive && activePerspective ? (
        <p className="demo-perspective-active-note">
          Currently previewing <strong>{activePerspective.label}</strong>. Use the top bar or restore
          below to return to your owner dashboard.
        </p>
      ) : (
        <p className="demo-perspective-active-note">
          You are on your owner dashboard. Pick a perspective to audit what each tier and role can
          see.
        </p>
      )}

      <div className="demo-perspective-grid">
        {DEMO_PERSPECTIVE_PRESETS.map((preset) => (
          <button
            className={
              'secondary-action demo-perspective-card' +
              (activeId === preset.id ? ' is-active-demo-perspective' : '')
            }
            key={preset.id}
            onClick={() => handleApply(preset.id)}
            type="button"
          >
            <strong>{preset.label}</strong>
            <small>{preset.detail}</small>
            <span className="demo-perspective-meta">
              {preset.tier} · {preset.surfaceRole.replace('-', ' ')}
            </span>
          </button>
        ))}
      </div>

      <div className="demo-perspective-footer">
        <button
          className="nami-surface-button"
          disabled={!isActive}
          onClick={handleRestoreOwner}
          type="button"
        >
          Restore my owner dashboard
        </button>
      </div>
    </article>
  );
}