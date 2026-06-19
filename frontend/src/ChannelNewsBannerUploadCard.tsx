import { useState, type ReactElement } from 'react';

import {
  clearChannelNewsBannerOverride,
  readChannelNewsBannerOverride,
  saveChannelNewsBannerOverride,
  useChannelOwnerMediaVersion,
} from './channel-owner-media-store.js';
import { OwnerMediaUploadField } from './OwnerMediaUploadField.js';
import type { NamiChannel } from './uiMockData.js';

export function ChannelNewsBannerUploadCard(props: { channel: NamiChannel }): ReactElement {
  useChannelOwnerMediaVersion();
  const [notice, setNotice] = useState('');

  const previewUrl = readChannelNewsBannerOverride(props.channel.id);

  return (
    <article className="panel channel-owner-tool-card channel-news-banner-upload-card">
      <div className="channel-owner-tool-card-head">
        <div>
          <span className="mini-badge">News tab</span>
          <h3>News section banner</h3>
          <p>Upload the wide banner shown above announcements on your News tab.</p>
        </div>
      </div>

      <OwnerMediaUploadField
        notice={notice || null}
        onRemove={() => {
          clearChannelNewsBannerOverride(props.channel.id);
          setNotice('News banner removed.');
        }}
        onUpload={(dataUrl, _file) => {
          saveChannelNewsBannerOverride(props.channel.id, dataUrl);
          setNotice('News section banner updated.');
        }}
        previewUrl={previewUrl}
        slot="news-section-banner"
        uploadLabel="Upload news banner"
      />
    </article>
  );
}