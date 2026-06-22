import { useMemo, useRef, type ChangeEvent, type ReactElement } from 'react';

import {
  arcadeBackgroundAcceptAttribute,
  ARCADE_BACKGROUND_SLOT_ID,
  prepareArcadeBackgroundUpload,
  resolveArcadeBackgroundMedia,
  validateArcadeBackgroundFile,
} from './arcade-background-store.js';
import { DEFAULT_ARCADE_BACKGROUND_URL } from './arcade-background.js';
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

export function ArcadeBackgroundMedia(): ReactElement {
  const editMode = useNamiOwnerEditMode();
  const persistedAssets = useNamiOwnerAssets();
  const mediaVersion = useChannelOwnerMediaVersion();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const storedValue = resolveOwnerAssetUrl(ARCADE_BACKGROUND_SLOT_ID, persistedAssets);
  const media = useMemo(
    () => resolveArcadeBackgroundMedia(storedValue),
    [storedValue, mediaVersion],
  );
  const editable = editMode.active;
  const hasCustomMedia = media.kind !== 'default';

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

    const validationError = validateArcadeBackgroundFile(file);

    if (validationError) {
      window.alert(validationError);
      return;
    }

    try {
      const storedAsset = await prepareArcadeBackgroundUpload(file);
      setOwnerAssetDraft(ARCADE_BACKGROUND_SLOT_ID, storedAsset);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not read that media file.';
      window.alert(message);
    }
  }

  const className =
    'arcade-screen-background-media owner-editable-image' +
    (editable ? ' is-edit-target' : '') +
    (hasCustomMedia ? ' has-owner-asset-image' : ' is-owner-asset-placeholder') +
    (media.kind === 'video' ? ' has-arcade-background-video' : '');

  return (
    <>
      <span
        aria-label={
          editable
            ? 'Upload image or video for Arcade background'
            : hasCustomMedia
              ? 'Arcade background'
              : 'Arcade background placeholder'
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
            <strong>Arcade background</strong>
            <small>
              Click to upload · {OWNER_ASSET_ACCEPTED_FORMATS} · MP4 or WebM
            </small>
          </span>
        ) : null}
      </span>

      <input
        accept={arcadeBackgroundAcceptAttribute()}
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