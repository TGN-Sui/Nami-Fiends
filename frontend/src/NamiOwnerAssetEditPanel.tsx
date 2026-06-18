import { useRef, type ChangeEvent, type ReactElement } from 'react';

import { isOfficialOwner } from './nami-capabilities.js';
import {
  OWNER_ASSET_ACCEPTED_FORMATS,
  OWNER_ASSET_SLOTS,
  readAllOwnerAssets,
  readImageFileAsDataUrl,
  readOwnerAsset,
  saveOwnerAssets,
  validateOwnerAssetFile,
} from './nami-owner-assets-store.js';
import { enterNamiOwnerEditMode, setOwnerAssetDraft, useNamiOwnerEditMode } from './nami-owner-edit-mode-store.js';
import { useProtocolOwner } from './wallet.js';

export function NamiOwnerAssetEditPanel(props: {
  embedded?: boolean;
  onEnterEditMode: () => void;
}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const editMode = useNamiOwnerEditMode();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingSlotRef = useRef<string | null>(null);

  if (!isOfficialOwner(owner)) {
    return null;
  }

  function openSlotPicker(slotId: string): void {
    pendingSlotRef.current = slotId;
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    const slotId = pendingSlotRef.current;
    event.target.value = '';
    pendingSlotRef.current = null;

    if (!file || !slotId) {
      return;
    }

    const slot = OWNER_ASSET_SLOTS.find((entry) => entry.id === slotId);
    const validationError = validateOwnerAssetFile(file, slot?.category ?? 'brand');

    if (validationError) {
      window.alert(validationError);
      return;
    }

    try {
      const dataUrl = await readImageFileAsDataUrl(file);

      if (editMode.active) {
        setOwnerAssetDraft(slotId, dataUrl);
        return;
      }

      saveOwnerAssets(
        {
          ...readAllOwnerAssets(),
          [slotId]: dataUrl,
        },
        owner
      );
    } catch {
      window.alert('Could not read that image.');
    }
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
              Upload badges, logos, button accents, and default profile portraits. Enter edit mode to
              click placeholders across the hub, or upload directly from this catalog.
            </p>
          </div>
        </div>
      )}

      <div className="nami-owner-asset-edit-toolbar">
        <button className="onboarding-primary-btn" onClick={handleEnterEditMode} type="button">
          Enter Edit Mode
        </button>
        <p className="protocol-hint">
          Accepted formats: {OWNER_ASSET_ACCEPTED_FORMATS}. Save before returning to Owner Dashboard.
        </p>
      </div>

      <div className="nami-owner-asset-catalog nami-owner-advanced-scroll-region">
        {OWNER_ASSET_SLOTS.map((slot) => {
          const imageUrl = readOwnerAsset(slot.id);

          return (
            <article className="nami-owner-asset-card" key={slot.id}>
              <button
                className={
                  'nami-owner-asset-card-button' + (imageUrl ? ' has-owner-asset-image' : '')
                }
                onClick={() => openSlotPicker(slot.id)}
                type="button"
              >
                {imageUrl ? (
                  <img alt="" className="nami-owner-asset-card-preview" src={imageUrl} />
                ) : (
                  <span className="nami-owner-asset-card-placeholder">Upload</span>
                )}
              </button>
              <div className="nami-owner-asset-card-copy">
                <strong>{slot.label}</strong>
                <small>{slot.hint}</small>
              </div>
            </article>
          );
        })}
      </div>

      <input
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="owner-editable-image-input"
        onChange={(event) => {
          void handleFileChange(event);
        }}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />
    </section>
  );
}