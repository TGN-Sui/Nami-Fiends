import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import {
  CHANNEL_TRAILER_ACCEPTED_LABEL,
  clearChannelTrailerOverride,
  readChannelTrailerOverride,
  saveChannelTrailerOverride,
  useChannelOwnerMediaVersion,
  validateChannelTrailerFile,
} from './channel-owner-media-store.js';
import type { NamiChannel } from './uiMockData.js';

export function ChannelTrailerUploadCard(props: { channel: NamiChannel }): ReactElement {
  useChannelOwnerMediaVersion();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [notice, setNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const previewUrl = readChannelTrailerOverride(props.channel.id);

  function openFilePicker(): void {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const validationError = validateChannelTrailerFile(file);

    if (validationError) {
      setErrorMessage(validationError);
      setNotice('');
      return;
    }

    setErrorMessage(null);
    setIsReadingFile(true);

    void saveChannelTrailerOverride(props.channel.id, file)
      .then(() => {
        setNotice('Game trailer updated.');
      })
      .catch((readError: unknown) => {
        setErrorMessage(
          readError instanceof Error
            ? readError.message
            : 'Could not save trailer. Try a smaller MP4 or WebM file.',
        );
      })
      .finally(() => {
        setIsReadingFile(false);
      });
  }

  return (
    <article className="panel channel-owner-tool-card channel-trailer-upload-card">
      <div className="channel-owner-tool-card-head">
        <div>
          <span className="mini-badge">About tab</span>
          <h3>Game trailer</h3>
          <p>
            Upload a trailer shown on your About tab. Recommended 1920 × 1080 (16:9), up to 24 MB.{' '}
            {CHANNEL_TRAILER_ACCEPTED_LABEL} only.
          </p>
        </div>
      </div>

      <div className={'channel-trailer-preview-frame' + (previewUrl ? ' has-channel-trailer' : '')}>
        {previewUrl ? (
          <video className="channel-trailer-preview-player" controls playsInline preload="metadata" src={previewUrl} />
        ) : (
          <span className="channel-trailer-preview-placeholder">Trailer preview</span>
        )}
      </div>

      <input
        accept="video/mp4,video/webm"
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
          {isReadingFile ? 'Reading video…' : 'Upload game trailer'}
        </button>

        {previewUrl ? (
          <button
            className="nami-surface-button"
            onClick={() => {
              clearChannelTrailerOverride(props.channel.id);
              setNotice('Game trailer removed.');
              setErrorMessage(null);
            }}
            type="button"
          >
            Remove trailer
          </button>
        ) : null}
      </div>

      {notice ? <p className="channel-owner-tool-notice is-success">{notice}</p> : null}
      {errorMessage ? <p className="channel-owner-tool-notice is-error">{errorMessage}</p> : null}
    </article>
  );
}