import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import {
  clearChannelCoverOverride,
  readChannelCoverOverride,
  resolveChannelCoverUrl,
  saveChannelCoverOverride,
} from './channel-cover-store.js';
import { type NamiChannel } from './uiMockData.js';

const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function ChannelCoverUploadCard(props: { channel: NamiChannel }): ReactElement {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const override = readChannelCoverOverride(props.channel.id);
  const activeCover = resolveChannelCoverUrl(props.channel);
  const hasOwnerUpload = override !== null && override.length > 0;

  function openFilePicker(): void {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    if (!ACCEPTED_TYPES.has(file.type)) {
      setErrorMessage('Use a PNG, JPG, or WebP image.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage('Cover image must be 4 MB or smaller.');
      return;
    }

    setErrorMessage(null);
    setIsReadingFile(true);

    const reader = new FileReader();

    reader.onload = () => {
      setIsReadingFile(false);

      if (typeof reader.result !== 'string') {
        setErrorMessage('Could not read that image. Try another file.');
        return;
      }

      saveChannelCoverOverride(props.channel.id, reader.result);
    };

    reader.onerror = () => {
      setIsReadingFile(false);
      setErrorMessage('Could not read that image. Try another file.');
    };

    reader.readAsDataURL(file);
  }

  function removeCover(): void {
    setErrorMessage(null);
    clearChannelCoverOverride(props.channel.id);
  }

  return (
    <article className="media-upload-prep-card channel-cover-upload-card">
      <div className="media-upload-prep-copy">
        <span className="media-upload-prep-eyebrow">Game Channel media</span>
        <strong>Cover image</strong>
        <small>
          {hasOwnerUpload
            ? 'Owner upload active across Game Hub cards and channel surfaces.'
            : activeCover
              ? 'Demo cover active. Upload to replace it site-wide for this channel.'
              : 'No cover attached yet. Upload owner cover art for this game channel.'}
        </small>
      </div>

      {activeCover ? (
        <div
          aria-hidden="true"
          className="channel-cover-upload-preview"
          style={{ backgroundImage: 'url("' + activeCover.replace(/"/g, '\\u0022') + '")' }}
        />
      ) : null}

      <div className="media-upload-prep-details">
        <span>PNG, JPG, WebP</span>
        <span>Stored locally for this demo session</span>
      </div>

      <input
        accept="image/png,image/jpeg,image/webp"
        className="member-avatar-upload-input"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />

      <div className="member-avatar-upload-actions">
        <button
          className="nami-surface-button is-primary-surface-button"
          disabled={isReadingFile}
          onClick={openFilePicker}
          type="button"
        >
          {isReadingFile ? 'Reading image…' : 'Upload cover photo'}
        </button>

        {hasOwnerUpload ? (
          <button className="nami-surface-button" onClick={removeCover} type="button">
            Remove upload
          </button>
        ) : null}
      </div>

      {errorMessage ? <p className="member-avatar-upload-error">{errorMessage}</p> : null}

      <p>Uploaded covers replace Game Hub browser cards, swipe deck art, and channel avatars for members.</p>
    </article>
  );
}