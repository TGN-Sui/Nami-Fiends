import { useRef, type ChangeEvent, type CSSProperties, type ReactElement, type ReactNode } from 'react';

import {
  OWNER_ASSET_ACCEPTED_FORMATS,
  readImageFileAsDataUrl,
  readOwnerAssetSlot,
  validateOwnerAssetFile,
} from './nami-owner-assets-store.js';
import {
  resolveOwnerAssetUrl,
  setOwnerAssetDraft,
  useNamiOwnerEditMode,
} from './nami-owner-edit-mode-store.js';

export function OwnerEditableImage(props: {
  slotId: string;
  label: string;
  className?: string;
  imageClassName?: string;
  nested?: boolean;
  fallback: ReactNode;
}): ReactElement {
  const editMode = useNamiOwnerEditMode();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const slot = readOwnerAssetSlot(props.slotId);
  const imageUrl = resolveOwnerAssetUrl(props.slotId);
  const editable = editMode.active;

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

    const validationError = validateOwnerAssetFile(file, slot?.category ?? 'brand');

    if (validationError) {
      window.alert(validationError);
      return;
    }

    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setOwnerAssetDraft(props.slotId, dataUrl);
    } catch {
      window.alert('Could not read that image.');
    }
  }

  const style: CSSProperties | undefined = imageUrl
    ? {
        backgroundImage: 'url("' + imageUrl.replace(/"/g, '\\u0022') + '")',
      }
    : undefined;

  const className =
    'owner-editable-image' +
    (editable ? ' is-edit-target' : '') +
    (imageUrl ? ' has-owner-asset-image' : ' is-owner-asset-placeholder') +
    (props.nested ? ' is-nested-owner-editable-image' : '') +
    (props.className ? ' ' + props.className : '');

  const content = (
    <>
      {!imageUrl ? props.fallback : null}
      {imageUrl ? (
        <img
          alt=""
          className={'owner-editable-image-asset' + (props.imageClassName ? ' ' + props.imageClassName : '')}
          src={imageUrl}
        />
      ) : null}
      {editable ? (
        <span className="owner-editable-image-hint">
          <strong>{props.label}</strong>
          <small>Click to upload · {OWNER_ASSET_ACCEPTED_FORMATS}</small>
        </span>
      ) : null}
    </>
  );

  return (
    <>
      {props.nested ? (
        <span
          aria-label={
            editable
              ? 'Upload image for ' + props.label
              : imageUrl
                ? props.label
                : props.label + ' placeholder'
          }
          className={className}
          onClick={(event) => openPicker(event)}
          onKeyDown={(event) => {
            if (!editable) {
              return;
            }

            if (event.key === 'Enter' || event.key === ' ') {
              openPicker(event);
            }
          }}
          role={editable ? 'button' : undefined}
          style={style}
          tabIndex={editable ? 0 : -1}
        >
          {content}
        </span>
      ) : (
        <button
          aria-label={
            editable
              ? 'Upload image for ' + props.label
              : imageUrl
                ? props.label
                : props.label + ' placeholder'
          }
          className={className}
          disabled={!editable}
          onClick={() => openPicker()}
          style={style}
          type="button"
        >
          {content}
        </button>
      )}
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
    </>
  );
}