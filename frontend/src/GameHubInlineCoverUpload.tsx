import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import {
  clearChannelCoverOverride,
  resolveChannelCoverUrl,
  saveChannelCoverOverride,
} from './channel-cover-store.js';
import { canUploadMediaToBackend, persistMediaImage, validateMediaFile } from './media-upload-service.js';
import { ownerMediaSpecForSlot } from './owner-media-specs.js';
import { isPreferencesApiAvailable } from './preferences-sync.js';
import type { NamiChannel } from './uiMockData.js';
import { useProtocolOwner } from './wallet.js';

export function GameHubInlineCoverUpload(props: {
  channel: NamiChannel;
  className?: string;
  label?: string;
}): ReactElement {
  const { owner } = useProtocolOwner();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [notice, setNotice] = useState('');
  const spec = ownerMediaSpecForSlot('channel-cover');
  const hasCover = Boolean(resolveChannelCoverUrl(props.channel));

  function openPicker(event: React.MouseEvent | React.KeyboardEvent): void {
    event.stopPropagation();
    event.preventDefault();
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    event.stopPropagation();
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const validationError = validateMediaFile(file, spec.uploadKind);

    if (validationError) {
      setNotice(validationError);
      return;
    }

    void (async () => {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read image.'));
        reader.readAsDataURL(file);
      });

      try {
        const result = await persistMediaImage({
          kind: 'channel-cover',
          owner,
          file,
          dataUrl,
          channelId: props.channel.id,
          isApiAvailable: isPreferencesApiAvailable('channel'),
          onSaved: (url) => saveChannelCoverOverride(props.channel.id, url),
          onLocalFallback: (url) => saveChannelCoverOverride(props.channel.id, url),
        });

        setNotice(
          result.destination === 'server'
            ? 'Cover synced.'
            : canUploadMediaToBackend(owner)
              ? 'Cover saved locally.'
              : 'Cover saved locally — connect wallet to sync.',
        );
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Upload failed.');
      }
    })();
  }

  function handleRemove(event: React.MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    clearChannelCoverOverride(props.channel.id);
    setNotice('Cover removed.');
  }

  return (
    <div
      className={['gamehub-inline-cover-upload', props.className].filter(Boolean).join(' ')}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <input
        accept="image/*"
        className="gamehub-inline-cover-upload-input"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />
      <button
        className="gamehub-inline-cover-upload-button"
        onClick={openPicker}
        title={props.label ?? 'Upload cover image'}
        type="button"
      >
        {hasCover ? 'Change cover' : 'Add cover'}
      </button>
      {hasCover ? (
        <button className="gamehub-inline-cover-upload-remove" onClick={handleRemove} type="button">
          Remove
        </button>
      ) : null}
      {notice ? <span className="gamehub-inline-cover-upload-notice">{notice}</span> : null}
    </div>
  );
}