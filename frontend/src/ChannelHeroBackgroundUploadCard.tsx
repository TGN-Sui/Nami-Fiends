import { useState, type ReactElement } from 'react';

import {
  clearChannelHeroBackgroundOverride,
  readChannelHeroBackgroundOverride,
  saveChannelHeroBackgroundOverride,
  useChannelOwnerMediaVersion,
} from './channel-owner-media-store.js';
import { OwnerMediaUploadField } from './OwnerMediaUploadField.js';
import type { NamiChannel } from './uiMockData.js';

export function ChannelHeroBackgroundUploadCard(props: { channel: NamiChannel }): ReactElement {
  useChannelOwnerMediaVersion();
  const [notice, setNotice] = useState('');

  const previewUrl = readChannelHeroBackgroundOverride(props.channel.id);

  return (
    <article className="panel channel-owner-tool-card channel-hero-background-upload-card">
      <div className="channel-owner-tool-card-head">
        <div>
          <span className="mini-badge">Profile hero</span>
          <h3>Hero background image</h3>
          <p>Upload background art for the hero panel at the top of your game channel profile.</p>
        </div>
      </div>

      <OwnerMediaUploadField
        notice={notice || null}
        onRemove={() => {
          clearChannelHeroBackgroundOverride(props.channel.id);
          setNotice('Hero background removed.');
        }}
        onUpload={(dataUrl, _file) => {
          saveChannelHeroBackgroundOverride(props.channel.id, dataUrl);
          setNotice('Hero background updated.');
        }}
        previewUrl={previewUrl}
        slot="hero-background"
        uploadLabel="Upload hero background"
      />
    </article>
  );
}