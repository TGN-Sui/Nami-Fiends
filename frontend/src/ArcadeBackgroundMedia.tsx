import { useMemo, useRef, type ChangeEvent, type ReactElement } from 'react';

import { arcadeCabinetMediaSlotId } from './arcade-cabinet-media.js';
import {
  arcadeCabinetMediaAcceptAttribute,
  prepareArcadeCabinetMediaUpload,
  resolveArcadeCabinetViewportMedia,
  validateArcadeCabinetMediaFile,
} from './arcade-cabinet-media-store.js';
import {
  arcadeBackgroundAcceptAttribute,
  ARCADE_BACKGROUND_SLOT_ID,
  prepareArcadeBackgroundUpload,
  resolveArcadeBackgroundMedia,
  validateArcadeBackgroundFile,
} from './arcade-background-store.js';
import { DEFAULT_ARCADE_BACKGROUND_URL } from './arcade-background.js';
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

type ArcadeBackgroundMediaProps = {
  cabinetId?: string | null;
};

export function ArcadeBackgroundMedia(props: ArcadeBackgroundMediaProps): ReactElement {
  const editMode = useNamiOwnerEditMode();
  const persistedAssets = useNamiOwnerAssets();
  const mediaVersion = useChannelOwnerMediaVersion();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cabinet = props.cabinetId ? readArcadeCabinetById(props.cabinetId) : null;
  const editSlotId = props.cabinetId
    ? arcadeCabinetMediaSlotId(props.cabinetId, 'viewport')
    : ARCADE_BACKGROUND_SLOT_ID;

  const globalStoredValue = resolveOwnerAssetUrl(ARCADE_BACKGROUND_SLOT_ID, persistedAssets);
  const cabinetStoredValue = props.cabinetId
    ? resolveOwnerAssetUrl(editSlotId, persistedAssets)
    : null;

  const media = useMemo(() => {
    if (props.cabinetId) {
      const cabinetMedia = resolveArcadeCabinetViewportMedia(props.cabinetId, cabinetStoredValue);

      if (cabinetMedia.kind !== 'default') {
        return cabinetMedia;
      }
    }

    return resolveArcadeBackgroundMedia(globalStoredValue);
  }, [cabinetStoredValue, globalStoredValue, mediaVersion, props.cabinetId]);

  const editable = editMode.active;
  const hasCustomMedia = media.kind !== 'default';
  const editLabel = cabinet ? cabinet.title + ' cabinet viewport' : 'Arcade background';

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

    const validationError = props.cabinetId
      ? validateArcadeCabinetMediaFile(editSlotId, file)
      : validateArcadeBackgroundFile(file);

    if (validationError) {
      window.alert(validationError);
      return;
    }

    try {
      const storedAsset = props.cabinetId
        ? await prepareArcadeCabinetMediaUpload(editSlotId, file)
        : await prepareArcadeBackgroundUpload(file);
      setOwnerAssetDraft(editSlotId, storedAsset);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not read that media file.';
      window.alert(message);
    }
  }

  const className =
    'arcade-screen-background-media owner-editable-image' +
    (editable ? ' is-edit-target' : '') +
    (hasCustomMedia ? ' has-owner-asset-image' : ' is-owner-asset-placeholder') +
    (media.kind === 'video' ? ' has-arcade-background-video' : '') +
    (props.cabinetId ? ' is-cabinet-viewport-media' : '');

  return (
    <>
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
        {media.kind === 'video' ? (
          <video
            aria-hidden="true"
            autoPlay
            className="arcade-screen-background-video"
            loop
            muted
            playsInline
            preload="auto"
            src={media.url}
          />
        ) : media.kind === 'image' ? (
          <img
            alt=""
            className="arcade-screen-background-image owner-editable-image-asset"
            src={media.url}
          />
        ) : (
          <img
            alt=""
            className="arcade-screen-background-placeholder"
            src={DEFAULT_ARCADE_BACKGROUND_URL}
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
          props.cabinetId
            ? arcadeCabinetMediaAcceptAttribute(editSlotId)
            : arcadeBackgroundAcceptAttribute()
        }
        className="owner-editable-image-input"
        onChange={(event) => {
          void handleFileChange(event);
        }}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />
    </>
  );
}