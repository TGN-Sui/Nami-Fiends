import type { ReactElement } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';
import {
  OWNER_ASSET_ACCEPTED_FORMATS,
  readArcadeOwnerAssetSlotSections,
} from './nami-owner-assets-store.js';
import { enterNamiOwnerEditMode, useNamiOwnerEditMode } from './nami-owner-edit-mode-store.js';
import { OwnerAssetSlotCatalog } from './OwnerAssetSlotCatalog.js';
import { useProtocolOwner } from './wallet.js';

export function NamiOwnerArcadeAssetEditPanel(props: {
  embedded?: boolean;
  onEnterEditMode: () => void;
}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const editMode = useNamiOwnerEditMode();

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
        'nami-owner-asset-edit nami-owner-arcade-asset-edit panel' +
        (props.embedded ? ' nami-owner-advanced-embedded-panel' : '')
      }
    >
      {props.embedded ? null : (
        <div className="nami-owner-settings-header">
          <div>
            <span className="mini-badge">Arcade media</span>
            <h2>Arcade artwork & music</h2>
            <p>
              Upload CRT backgrounds, title-stage loops, lobby and per-game MP3s, plus per-cabinet
              walk-up intros and stage media.
            </p>
          </div>
        </div>
      )}

      <div className="nami-owner-asset-edit-toolbar">
        <button className="onboarding-primary-btn" onClick={handleEnterEditMode} type="button">
          Enter Edit Mode
        </button>
        <p className="protocol-hint">
          Accepted formats: {OWNER_ASSET_ACCEPTED_FORMATS}, plus MP4 or WebM for arcade video slots
          and MP3 for lobby and gameplay loops. Save before returning to Owner Dashboard.
          {editMode.active ? ' Edit mode is active — click placeholders in the arcade route too.' : ''}
        </p>
      </div>

      <OwnerAssetSlotCatalog compact sections={readArcadeOwnerAssetSlotSections()} />
    </section>
  );
}