import type { ReactElement } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';
import {
  OWNER_ASSET_ACCEPTED_FORMATS,
  readPlatformOwnerAssetSlots,
} from './nami-owner-assets-store.js';
import { enterNamiOwnerEditMode } from './nami-owner-edit-mode-store.js';
import { OwnerAssetSlotCatalog } from './OwnerAssetSlotCatalog.js';
import { useProtocolOwner } from './wallet.js';

export function NamiOwnerAssetEditPanel(props: {
  embedded?: boolean;
  onEnterEditMode: () => void;
}): ReactElement | null {
  const { owner } = useProtocolOwner();

  if (!isOfficialOwner(owner)) {
    return null;
  }

  function handleEnterEditMode(): void {
    if (!enterNamiOwnerEditMode(owner)) {
      return;
    }

    props.onEnterEditMode();
  }

  return (
    <section
      className={
        'nami-owner-asset-edit panel' + (props.embedded ? ' nami-owner-advanced-embedded-panel' : '')
      }
    >
      {props.embedded ? null : (
        <div className="nami-owner-settings-header">
          <div>
            <span className="mini-badge">Visual Assets</span>
            <h2>Platform artwork editor</h2>
            <p>
              Upload badges, logos, button accents, and default profile portraits. Arcade media lives
              in the separate Arcade media console.
            </p>
          </div>
        </div>
      )}

      <div className="nami-owner-asset-edit-toolbar">
        <button className="onboarding-primary-btn" onClick={handleEnterEditMode} type="button">
          Enter Edit Mode
        </button>
        <p className="protocol-hint">
          Accepted formats: {OWNER_ASSET_ACCEPTED_FORMATS}. Images are optimized automatically on
          upload. Save before returning to Owner Dashboard.
        </p>
      </div>

      <OwnerAssetSlotCatalog compact slots={readPlatformOwnerAssetSlots()} />
    </section>
  );
}