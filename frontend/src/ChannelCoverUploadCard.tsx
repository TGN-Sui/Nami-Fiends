import { useEffect, useState, type ReactElement } from 'react';

import {
  clearChannelCoverOverride,
  readChannelCoverOverride,
  resolveChannelCoverUrl,
  saveChannelCoverOverride,
} from './channel-cover-store.js';
import { persistMediaImage } from './media-upload-service.js';
import { OwnerMediaUploadField } from './OwnerMediaUploadField.js';
import {
  hydrateChannelCoverPreference,
  isPreferencesApiAvailable,
  preferencesStorageHint,
} from './preferences-sync.js';
import { type NamiChannel } from './uiMockData.js';
import { useProtocolOwner } from './wallet.js';

export function ChannelCoverUploadCard(props: { channel: NamiChannel }): ReactElement {
  const { owner } = useProtocolOwner();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);

  const override = readChannelCoverOverride(props.channel.id);
  const activeCover = resolveChannelCoverUrl(props.channel);
  const hasOwnerUpload = override !== null && override.length > 0;

  useEffect(() => {
    void hydrateChannelCoverPreference(props.channel.id);
  }, [props.channel.id]);

  function handleUpload(dataUrl: string, file: File): void {
    setErrorMessage(null);
    setIsReadingFile(true);

    void (async () => {
      try {
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
        setNotice('Cover image updated.');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Upload failed. Try again.');
      } finally {
        setIsReadingFile(false);
      }
    })();
  }

  return (
    <article className="panel channel-owner-tool-card channel-cover-upload-card">
      <div className="channel-owner-tool-card-head">
        <div>
          <span className="mini-badge">Game Channel media</span>
          <h3>Cover image</h3>
          <p>
            {hasOwnerUpload
              ? 'Owner upload active across Game Hub cards and channel surfaces.'
              : 'Upload a cover for this channel card and hub surfaces.'}
          </p>
        </div>
      </div>

      <OwnerMediaUploadField
        notice={notice || errorMessage}
        onRemove={() => {
          setErrorMessage(null);
          clearChannelCoverOverride(props.channel.id);
          setNotice('Cover image removed.');
        }}
        onUpload={(dataUrl, file) => handleUpload(dataUrl, file)}
        previewUrl={activeCover ?? null}
        slot="channel-cover"
        uploadLabel={isReadingFile ? 'Uploading cover…' : 'Upload cover image'}
      />

      <small className="channel-owner-tool-footnote">{preferencesStorageHint('channel')}</small>
    </article>
  );
}