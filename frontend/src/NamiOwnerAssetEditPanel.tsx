import { useRef, type ChangeEvent, type ReactElement } from 'react';

import { ARCADE_BACKGROUND_SLOT_ID } from './arcade-background.js';
import {
  arcadeBackgroundAcceptAttribute,
  clearArcadeBackgroundMedia,
  isArcadeBackgroundVideoRef,
  prepareArcadeBackgroundUpload,
  resolveArcadeBackgroundMedia,
  validateArcadeBackgroundFile,
} from './arcade-background-store.js';
import { ARCADE_STAGE_BACKGROUND_SLOT_ID } from './arcade-stage-background.js';
import {
  arcadeStageBackgroundAcceptAttribute,
  clearArcadeStageBackgroundMedia,
  isArcadeStageBackgroundVideoRef,
  prepareArcadeStageBackgroundUpload,
  resolveArcadeStageBackgroundMedia,
  validateArcadeStageBackgroundFile,
} from './arcade-stage-background-store.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { useChannelOwnerMediaVersion } from './channel-owner-media-store.js';
import {
  OWNER_ASSET_ACCEPTED_FORMATS,
  OWNER_ASSET_SLOTS,
  clearOwnerAsset,
  ownerAssetSaveErrorMessage,
  prepareOwnerAssetImage,
  readAllOwnerAssets,
  saveOwnerAssets,
  useNamiOwnerAssets,
  validateOwnerAssetFile,
} from './nami-owner-assets-store.js';
import {
  enterNamiOwnerEditMode,
  resolveOwnerAssetUrl,
  setOwnerAssetDraft,
  useNamiOwnerEditMode,
} from './nami-owner-edit-mode-store.js';
import { useProtocolOwner } from './wallet.js';

export function NamiOwnerAssetEditPanel(props: {
  embedded?: boolean;
  onEnterEditMode: () => void;
}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const editMode = useNamiOwnerEditMode();
  const persistedAssets = useNamiOwnerAssets();
  const mediaVersion = useChannelOwnerMediaVersion();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingSlotRef = useRef<string | null>(null);
  if (!isOfficialOwner(owner)) {
    return null;
  }

  function openSlotPicker(slotId: string): void {
    pendingSlotRef.current = slotId;

    if (fileInputRef.current) {
      fileInputRef.current.accept =
        slotId === ARCADE_BACKGROUND_SLOT_ID
          ? arcadeBackgroundAcceptAttribute()
          : slotId === ARCADE_STAGE_BACKGROUND_SLOT_ID
            ? arcadeStageBackgroundAcceptAttribute()
            : 'image/png,image/jpeg,image/webp,image/gif';
    }

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
    const validationError =
      slotId === ARCADE_BACKGROUND_SLOT_ID
        ? validateArcadeBackgroundFile(file)
        : slotId === ARCADE_STAGE_BACKGROUND_SLOT_ID
          ? validateArcadeStageBackgroundFile(file)
          : validateOwnerAssetFile(file, slot?.category ?? 'brand');

    if (validationError) {
      window.alert(validationError);
      return;
    }

    try {
      const storedAsset =
        slotId === ARCADE_BACKGROUND_SLOT_ID
          ? await prepareArcadeBackgroundUpload(file)
          : slotId === ARCADE_STAGE_BACKGROUND_SLOT_ID
            ? await prepareArcadeStageBackgroundUpload(file)
            : await prepareOwnerAssetImage(file, slot?.category ?? 'brand');

      if (editMode.active) {
        setOwnerAssetDraft(slotId, storedAsset);
        return;
      }

      const saveError = await saveOwnerAssets(
        {
          ...readAllOwnerAssets(),
          [slotId]: storedAsset,
        },
        owner
      );

      if (saveError) {
        window.alert(ownerAssetSaveErrorMessage(saveError));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not read that media file.';
      window.alert(message);
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
          Accepted formats: {OWNER_ASSET_ACCEPTED_FORMATS}, plus MP4 or WebM for Arcade backgrounds
          (in-cabinet and full-page stage). Images are optimized automatically on upload. Save
          before returning to Owner Dashboard.
        </p>
      </div>

      <div className="nami-owner-asset-catalog nami-owner-advanced-scroll-region">
        {OWNER_ASSET_SLOTS.map((slot) => {
          const storedValue = resolveOwnerAssetUrl(slot.id, persistedAssets);
          const arcadeMedia =
            slot.id === ARCADE_BACKGROUND_SLOT_ID
              ? resolveArcadeBackgroundMedia(storedValue)
              : slot.id === ARCADE_STAGE_BACKGROUND_SLOT_ID
                ? resolveArcadeStageBackgroundMedia(storedValue)
                : null;
          const previewUrl =
            arcadeMedia?.kind === 'video' || arcadeMedia?.kind === 'image'
              ? arcadeMedia.url
              : storedValue;
          const isVideoPreview =
            storedValue !== null &&
            (slot.id === ARCADE_BACKGROUND_SLOT_ID
              ? isArcadeBackgroundVideoRef(storedValue)
              : slot.id === ARCADE_STAGE_BACKGROUND_SLOT_ID
                ? isArcadeStageBackgroundVideoRef(storedValue)
                : false);

          return (
            <article className="nami-owner-asset-card" key={slot.id}>
              <button
                className={
                  'nami-owner-asset-card-button' + (previewUrl ? ' has-owner-asset-image' : '')
                }
                onClick={() => openSlotPicker(slot.id)}
                type="button"
              >
                {isVideoPreview && previewUrl ? (
                  <video
                    aria-hidden="true"
                    autoPlay
                    className="nami-owner-asset-card-preview"
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    src={previewUrl}
                  />
                ) : previewUrl ? (
                  <img alt="" className="nami-owner-asset-card-preview" src={previewUrl} />
                ) : (
                  <span className="nami-owner-asset-card-placeholder">Upload</span>
                )}
              </button>
              <div className="nami-owner-asset-card-copy">
                <strong>{slot.label}</strong>
                <small>{slot.hint}</small>
                {previewUrl ? (
                  <button
                    className="profile-secondary-link"
                    onClick={() => {
                      void (async () => {
                        if (editMode.active) {
                          setOwnerAssetDraft(slot.id, null);

                          if (slot.id === ARCADE_BACKGROUND_SLOT_ID) {
                            await clearArcadeBackgroundMedia();
                          }

                          if (slot.id === ARCADE_STAGE_BACKGROUND_SLOT_ID) {
                            await clearArcadeStageBackgroundMedia();
                          }

                          return;
                        }

                        if (slot.id === ARCADE_BACKGROUND_SLOT_ID) {
                          await clearArcadeBackgroundMedia();
                        }

                        if (slot.id === ARCADE_STAGE_BACKGROUND_SLOT_ID) {
                          await clearArcadeStageBackgroundMedia();
                        }

                        const saveError = await clearOwnerAsset(slot.id, owner);

                        if (saveError) {
                          window.alert(ownerAssetSaveErrorMessage(saveError));
                        }
                      })();
                    }}
                    type="button"
                  >
                    Remove artwork
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <input
        accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
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