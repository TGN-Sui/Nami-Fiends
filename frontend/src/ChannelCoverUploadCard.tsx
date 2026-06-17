import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import {
  isChannelPreferencesApiAvailable,
  uploadChannelCoverToBackend,
} from './channel-preferences-api.js';
import {
  clearChannelCoverOverride,
  readChannelCoverOverride,
  resolveChannelCoverUrl,
  saveChannelCoverOverride,
} from './channel-cover-store.js';
import { type NamiChannel } from './uiMockData.js';
import { useProtocolOwner } from './wallet.js';

const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read image.'));
        return;
      }

      const commaIndex = reader.result.indexOf(',');

      if (commaIndex < 0) {
        reject(new Error('Could not read image.'));
        return;
      }

      resolve(reader.result.slice(commaIndex + 1));
    };

    reader.onerror = () => reject(new Error('Could not read image.'));
    reader.readAsDataURL(file);
  });
}

export function ChannelCoverUploadCard(props: { channel: NamiChannel }): ReactElement {
  const { owner } = useProtocolOwner();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const override = readChannelCoverOverride(props.channel.id);
  const activeCover = resolveChannelCoverUrl(props.channel);
  const hasOwnerUpload = override !== null && override.length > 0;
  const storageHint = isChannelPreferencesApiAvailable()
    ? 'Synced to the receiving server for this channel owner wallet.'
    : 'Stored locally until the backend API is available.';

  function openFilePicker(): void {
    fileInputRef.current?.click();
  }

  async function persistCover(file: File, dataUrl: string): Promise<void> {
    if (isChannelPreferencesApiAvailable() && owner?.startsWith('0x')) {
      const dataBase64 = await fileToBase64(file);
      const uploaded = await uploadChannelCoverToBackend({
        owner,
        channelId: props.channel.id,
        contentType: file.type,
        dataBase64,
      });

      if (uploaded?.url) {
        saveChannelCoverOverride(props.channel.id, uploaded.url);
        return;
      }
    }

    saveChannelCoverOverride(props.channel.id, dataUrl);
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
      void (async () => {
        try {
          if (typeof reader.result !== 'string') {
            setErrorMessage('Could not read that image. Try another file.');
            return;
          }

          await persistCover(file, reader.result);
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : 'Upload failed. Try again.');
        } finally {
          setIsReadingFile(false);
        }
      })();
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
            : 'Upload a cover for this channel card and hub surfaces.'}
        </small>
      </div>

      {activeCover ? (
        <div
          className="channel-cover-upload-preview"
          style={{ backgroundImage: 'url(' + JSON.stringify(activeCover) + ')' }}
        />
      ) : null}

      <div className="media-upload-prep-details">
        <span>PNG, JPG, WebP</span>
        <span>{storageHint}</span>
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
          {isReadingFile ? 'Uploading cover…' : 'Upload cover image'}
        </button>

        {hasOwnerUpload ? (
          <button className="nami-surface-button" onClick={removeCover} type="button">
            Remove upload
          </button>
        ) : null}
      </div>

      {errorMessage ? <p className="member-avatar-upload-error">{errorMessage}</p> : null}
    </article>
  );
}