import type { ReactElement } from 'react';

import { canUseDashboardPerspectives, isDemoSimulationEnabled } from './app-config.js';
import { applyDemoPerspective } from './demo-perspective-store.js';
import { OwnerAccessPrompt } from './OwnerAccessPrompt.js';
import { readResolvedProtocolOwner } from './protocol-owner-resolve.js';
import {
  requestSettingsNav,
  settingsNavHint,
  settingsNavLabel,
  type SettingsNavId,
} from './settings-navigation.js';

export function OwnerConsoleUnlockPanel(props: { navId: SettingsNavId }): ReactElement {
  const connectedOwner = readResolvedProtocolOwner();
  const demoEnabled =
    isDemoSimulationEnabled() || canUseDashboardPerspectives(connectedOwner);

  function unlockWithDemo(): void {
    applyDemoPerspective('nami-official-owner');
    requestSettingsNav(props.navId);
    window.dispatchEvent(new CustomEvent('nami-settings-owner-unlocked'));
  }

  return (
    <article className="panel settings-card settings-compact-card settings-section-wide settings-owner-unlock-card">
      <div className="profile-panel-heading">
        <span className="mini-badge">Owner console</span>
        <h2>{settingsNavLabel(props.navId)}</h2>
        <p>{settingsNavHint(props.navId)}</p>
      </div>

      <p className="protocol-hint">
        This workspace is reserved for the Nami official owner. Connect the configured owner wallet,
        or use demo perspective to preview owner tools locally.
      </p>

      {demoEnabled ? (
        <button
          className="nami-surface-button is-primary-surface-button"
          onClick={unlockWithDemo}
          type="button"
        >
          Switch to Nami Official Owner (demo)
        </button>
      ) : (
        <p className="protocol-hint">
          Demo perspectives are disabled on this deploy. Sign in with the official owner Google account
          so your zkLogin wallet matches <code>VITE_NAMI_OFFICIAL_OWNER</code>.
        </p>
      )}

      <OwnerAccessPrompt />
    </article>
  );
}