import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import {
  MEDIA_UPLOAD_ACCEPTED_LABEL,
  readFileAsDataUrl,
  validateMediaFile,
} from './media-upload-service.js';
import { ownerMediaDimensionNote, ownerMediaSpecForSlot, type OwnerMediaSlot } from './owner-media-specs.js';

export function OwnerMediaUploadField(props: {
  slot: OwnerMediaSlot;
  previewUrl?: string | null;
  uploadLabel: string;
  removeLabel?: string;
  onUpload: (dataUrl: string, file: File) => void;
  onRemove?: () => void;
  notice?: string | null;
}): ReactElement {
  const spec = ownerMediaSpecForSlot(props.slot);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  function openFilePicker(): void {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const validationError = validateMediaFile(file, spec.uploadKind);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage(null);
    setIsReadingFile(true);

    void readFileAsDataUrl(file)
      .then((dataUrl) => {
        props.onUpload(dataUrl, file);
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : 'Could not read image.');
      })
      .finally(() => {
        setIsReadingFile(false);
      });
  }

  return (
    <div className="owner-media-upload-field">
      <div className="owner-media-upload-copy">
        <strong>{spec.label}</strong>
        <small className="owner-media-dimension-note">{ownerMediaDimensionNote(props.slot)}</small>
        <small>{MEDIA_UPLOAD_ACCEPTED_LABEL}</small>
      </div>

      <div
        className={
          'owner-media-preview-frame ' +
          spec.previewClassName +
          (props.previewUrl ? ' has-owner-media-preview' : '')
        }
        style={
          props.previewUrl
            ? { backgroundImage: 'url(' + JSON.stringify(props.previewUrl) + ')' }
            : undefined
        }
      >
        {!props.previewUrl ? <span className="owner-media-preview-placeholder">Upload preview</span> : null}
      </div>

      <input
        accept="image/png,image/jpeg,image/webp"
        className="member-avatar-upload-input"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />

      <div className="channel-owner-tool-actions">
        <button
          className="nami-surface-button"
          disabled={isReadingFile}
          onClick={openFilePicker}
          type="button"
        >
          {isReadingFile ? 'Reading image…' : props.uploadLabel}
        </button>

        {props.previewUrl && props.onRemove ? (
          <button className="nami-surface-button" onClick={props.onRemove} type="button">
            {props.removeLabel ?? 'Remove upload'}
          </button>
        ) : null}
      </div>

      {props.notice ? <p className="channel-owner-tool-notice is-success">{props.notice}</p> : null}
      {errorMessage ? <p className="channel-owner-tool-notice is-error">{errorMessage}</p> : null}
    </div>
  );
}