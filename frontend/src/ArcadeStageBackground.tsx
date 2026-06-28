import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import { arcadeCabinetMediaSlotId } from './arcade-cabinet-media.js';
import {
  arcadeCabinetMediaAcceptAttribute,
  prepareArcadeCabinetMediaUpload,
  resolveArcadeCabinetStageMedia,
  validateArcadeCabinetMediaFile,
} from './arcade-cabinet-media-store.js';
import { useArcadeStageCabinetId } from './arcade-session-store.js';
import {
  arcadeStageBackgroundAcceptAttribute,
  ARCADE_STAGE_BACKGROUND_SLOT_ID,
  prepareArcadeStageBackgroundUpload,
  resolveArcadeStageBackgroundMedia,
  validateArcadeStageBackgroundFile,
} from './arcade-stage-background-store.js';
import { DEFAULT_ARCADE_STAGE_BACKGROUND_URL } from './arcade-stage-background.js';
import { readArcadeCabinetById } from './arcade-cabinets.js';
import { useChannelOwnerMediaVersion } from './channel-owner-media-store.js';
import {
  OWNER_ASSET_ACCEPTED_FORMATS,
  useNamiOwnerAssets,
} from './nami-owner-assets-store.js';
import {
  resolveOwnerAssetUrl,
  setOwnerAssetDraft,
  useNamiOwnerEditMode,
} from './nami-owner-edit-mode-store.js';

export function ArcadeStageBackground(): ReactElement {
  const editMode = useNamiOwnerEditMode();
  const persistedAssets = useNamiOwnerAssets();
  const mediaVersion = useChannelOwnerMediaVersion();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageCabinetId = useArcadeStageCabinetId();
  const [cabinetStageFailed, setCabinetStageFailed] = useState(false);
  const cabinet = stageCabinetId ? readArcadeCabinetById(stageCabinetId) : null;
  const editSlotId = stageCabinetId
    ? arcadeCabinetMediaSlotId(stageCabinetId, 'stage')
    : ARCADE_STAGE_BACKGROUND_SLOT_ID;

  useEffect(() => {
    setCabinetStageFailed(false);
  }, [stageCabinetId]);

  const globalStoredValue = resolveOwnerAssetUrl(ARCADE_STAGE_BACKGROUND_SLOT_ID, persistedAssets);
  const cabinetStoredValue = stageCabinetId
    ? resolveOwnerAssetUrl(editSlotId, persistedAssets)
    : null;

  const ownerMedia = useMemo(
    () => resolveArcadeStageBackgroundMedia(globalStoredValue),
    [globalStoredValue, mediaVersion],
  );

  const cabinetMedia = useMemo(() => {
    if (!stageCabinetId) {
      return null;
    }

    return resolveArcadeCabinetStageMedia(stageCabinetId, cabinetStoredValue);
  }, [cabinetStoredValue, mediaVersion, stageCabinetId]);

  const useCabinetStage = stageCabinetId !== null && !cabinetStageFailed && cabinetMedia !== null;
  const activeMedia = useCabinetStage ? cabinetMedia : ownerMedia;
  const editable = editMode.active;
  const hasCustomMedia = activeMedia.kind !== 'default' && activeMedia.kind !== 'loading';
  const editLabel = cabinet ? cabinet.title + ' stage loop' : 'Arcade stage background';

  function openPicker(event?: { stopPropagation?: () => void; preventDefault?: () => void }): void {
    if (!editable) {
      return;
    }

    event?.stopPropagation?.();
    event?.preventDefault?.();
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const validationError = stageCabinetId
      ? validateArcadeCabinetMediaFile(editSlotId, file)
      : validateArcadeStageBackgroundFile(file);

    if (validationError) {
      window.alert(validationError);
      return;
    }

    try {
      const storedAsset = stageCabinetId
        ? await prepareArcadeCabinetMediaUpload(editSlotId, file)
        : await prepareArcadeStageBackgroundUpload(file);
      setOwnerAssetDraft(editSlotId, storedAsset);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not read that media file.';
      window.alert(message);
    }
  }

  const className =
    'arcade-stage-background-media owner-editable-image' +
    (editable ? ' is-edit-target' : '') +
    (hasCustomMedia ? ' has-owner-asset-image' : ' is-owner-asset-placeholder') +
    (activeMedia.kind === 'video' ? ' has-arcade-stage-background-video' : '') +
    (useCabinetStage ? ' is-cabinet-stage-media' : '');

  return (
    <div
      aria-hidden={!editMode.active}
      className={
        'arcade-stage-background-shell' +
        (editMode.active ? ' is-owner-edit-target-shell' : '') +
        (useCabinetStage ? ' is-cabinet-stage-active' : '')
      }
    >
      <span
        aria-label={
          editable
            ? 'Upload image or video for ' + editLabel
            : hasCustomMedia
              ? editLabel
              : editLabel + ' placeholder'
        }
        className={className}
        onClick={(event) => openPicker(event)}
        onPointerDown={(event) => {
          if (editable) {
            event.stopPropagation();
          }
        }}
        onKeyDown={(event) => {
          if (!editable) {
            return;
          }

          if (event.key === 'Enter' || event.key === ' ') {
            openPicker(event);
          }
        }}
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : -1}
      >
        {activeMedia.kind === 'loading' ? null : activeMedia.kind === 'video' ? (
          <video
            aria-hidden="true"
            autoPlay
            className="arcade-stage-background-video"
            key={activeMedia.url}
            loop
            muted
            onError={() => {
              if (useCabinetStage) {
                setCabinetStageFailed(true);
              }
            }}
            playsInline
            preload="auto"
            src={activeMedia.url}
          />
        ) : activeMedia.kind === 'image' ? (
          <img
            alt=""
            className="arcade-stage-background-image owner-editable-image-asset"
            src={activeMedia.url}
          />
        ) : (
          <img
            alt=""
            className="arcade-stage-background-placeholder"
            src={DEFAULT_ARCADE_STAGE_BACKGROUND_URL}
          />
        )}

        {editable ? (
          <span className="owner-editable-image-hint">
            <strong>{editLabel}</strong>
            <small>
              Click to upload · {OWNER_ASSET_ACCEPTED_FORMATS} · MP4 or WebM
            </small>
          </span>
        ) : null}
      </span>

      <input
        accept={
          stageCabinetId
            ? arcadeCabinetMediaAcceptAttribute(editSlotId)
            : arcadeStageBackgroundAcceptAttribute()
        }
        className="owner-editable-image-input"
        onChange={(event) => {
          void handleFileChange(event);
        }}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />
    </div>
  );
}