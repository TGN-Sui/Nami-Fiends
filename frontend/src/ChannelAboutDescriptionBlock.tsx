import { useEffect, useMemo, useState, type ReactElement } from 'react';

import {
  saveChannelOwnerTagline,
  useChannelOwnerProfileVersion,
  withChannelOwnerProfile,
} from './channel-owner-profile-store.js';
import type { NamiChannel } from './uiMockData.js';

export function ChannelAboutDescriptionBlock(props: {
  channel: NamiChannel;
  isChannelOwner: boolean;
}): ReactElement {
  const ownerProfileVersion = useChannelOwnerProfileVersion();
  const channel = useMemo(
    () => withChannelOwnerProfile(props.channel),
    [props.channel, ownerProfileVersion],
  );
  const [draft, setDraft] = useState(channel.tagline);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setDraft(channel.tagline);
    setSavedNotice(false);
  }, [channel.id, channel.tagline]);

  if (!props.isChannelOwner) {
    return <p>{channel.tagline}</p>;
  }

  function saveDescription(): void {
    saveChannelOwnerTagline(channel.id, props.channel, draft);
    setSavedNotice(true);
  }

  return (
    <div className="channel-about-description-editor">
      <label className="profile-edit-field channel-about-description-field">
        <span>Game description</span>
        <textarea
          maxLength={600}
          onChange={(event) => {
            setDraft(event.target.value);
            setSavedNotice(false);
          }}
          placeholder="Describe your game for visitors browsing the hub and reading your About section."
          rows={5}
          value={draft}
        />
      </label>

      <div className="channel-about-description-actions">
        <button className="nami-surface-button is-primary-surface-button" onClick={saveDescription} type="button">
          Save description
        </button>
        {savedNotice ? <span className="channel-about-description-saved">Description saved.</span> : null}
      </div>
    </div>
  );
}