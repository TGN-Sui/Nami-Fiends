import { useEffect, type ReactElement } from 'react';

import { isDemoSimulationEnabled } from './app-config.js';
import { requestDemoPerspectiveFocus, useDemoPerspective } from './demo-perspective-store.js';
import { requestSettingsSection } from './settings-navigation.js';
import type { NamiPage } from './uiMockData.js';

export function DemoPerspectiveBar(props: {
  onNavigate: (page: NamiPage) => void;
  onRestoreOwner: () => void;
}): ReactElement | null {
  const demoEnabled = isDemoSimulationEnabled();
  const { activePerspective, isActive } = useDemoPerspective();

  useEffect(() => {
    if (!demoEnabled) {
      document.body.classList.remove('is-nami-demo-perspective');
      return;
    }

    document.body.classList.toggle('is-nami-demo-perspective', isActive);

    return () => {
      document.body.classList.remove('is-nami-demo-perspective');
    };
  }, [demoEnabled, isActive]);

  if (!demoEnabled || !isActive || !activePerspective) {
    return null;
  }

  function openPerspectiveSwitcher(): void {
    requestSettingsSection('membership');
    requestDemoPerspectiveFocus();
    props.onNavigate('settings');
  }

  return (
    <div className="nami-demo-perspective-bar" role="region" aria-label="Dashboard perspective preview">
      <div className="nami-demo-perspective-copy">
        <strong>Dashboard preview · {activePerspective.label}</strong>
        <span>{activePerspective.detail}</span>
      </div>

      <div className="nami-demo-perspective-actions">
        <button className="profile-secondary-link" onClick={openPerspectiveSwitcher} type="button">
          Switch dashboard
        </button>
        <button className="nami-surface-button is-primary-surface-button" onClick={props.onRestoreOwner} type="button">
          Back to my dashboard
        </button>
      </div>
    </div>
  );
}