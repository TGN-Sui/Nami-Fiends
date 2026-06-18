import { useEffect, useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import {
  clearChannelCoverOverride,
  readChannelCoverOverride,
  resolveChannelCoverUrl,
  saveChannelCoverOverride,
} from './channel-cover-store.js';
import {
  MEDIA_UPLOAD_ACCEPTED_LABEL,
  persistMediaImage,
  readFileAsDataUrl,
  validateMediaFile,
} from './media-upload-service.js';
import {
  hydrateChannelCoverPreference,
  isPreferencesApiAvailable,
  preferencesStorageHint,
} from './preferences-sync.js';
import { type NamiChannel } from './uiMockData.js';
import { useProtocolOwner } from './wallet.js';

export function ChannelCoverUploadCard(props: { channel: NamiChannel }): ReactElement {
  const { owner } = useProtocolOwner();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const override = readChannelCoverOverride(props.channel.id);
  const activeCover = resolveChannelCoverUrl(props.channel);
  const hasOwnerUpload = override !== null && override.length > 0;

  useEffect(() => {
    void hydrateChannelCoverPreference(props.channel.id);
  }, [props.channel.id]);

  function openFilePicker(): void {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    const validationError = validateMediaFile(file, 'channel-cover');

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage(null);
    setIsReadingFile(true);

    void (async () => {
      try {
        const dataUrl = await readFileAsDataUrl(file);

        await persistMediaImage({
          kind: 'channel-cover',
          owner,
          file,
          dataUrl,
          channelId: props.channel.id,
          isApiAvailable: isPreferencesApiAvailable('channel'),
          onSaved: (url) => saveChannelCoverOverride(props.channel.id, url),
          onLocalFallback: (url) => saveChannelCoverOverride(props.channel.id, url),
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Upload failed. Try again.');
      } finally {
        setIsReadingFile(false);
      }
    })();
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
        <span>{MEDIA_UPLOAD_ACCEPTED_LABEL}</span>
        <span>{preferencesStorageHint('channel')}</span>
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