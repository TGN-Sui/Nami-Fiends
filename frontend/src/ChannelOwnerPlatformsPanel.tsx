import { useMemo, useState, type ReactElement } from 'react';

import {
  readChannelOwnerProfileEdits,
  saveChannelOwnerPlatforms,
  supportedPlatformOptions,
} from './channel-owner-profile-store.js';
import { normalizeSupportedPlatforms } from './platform-genre-options.js';
import type { NamiChannel } from './uiMockData.js';

function togglePlatform(platforms: string[], platform: string): string[] {
  return platforms.includes(platform)
    ? platforms.filter((entry) => entry !== platform)
    : [...platforms, platform];
}

export function ChannelOwnerPlatformsPanel(props: { channel: NamiChannel }): ReactElement {
  const storedEdits = readChannelOwnerProfileEdits(props.channel.id);
  const initialPlatforms = useMemo(() => {
    return (
      storedEdits?.platforms ??
      normalizeSupportedPlatforms(props.channel.platforms)
    );
  }, [props.channel.id, props.channel.platforms, storedEdits?.platforms]);

  const [platforms, setPlatforms] = useState<string[]>(initialPlatforms);
  const [notice, setNotice] = useState<string | null>(null);

  function handleSave(): void {
    const normalized = normalizeSupportedPlatforms(platforms);

    if (normalized.length === 0) {
      setNotice('Select at least one supported platform.');
      return;
    }

    saveChannelOwnerPlatforms(props.channel.id, normalized);
    setPlatforms(normalized);
    setNotice('Supported platforms updated on your game channel.');
  }

  return (
    <article className="panel channel-owner-layout-panel channel-owner-platforms-panel">
      <div className="profile-panel-heading">
        <h3>Supported platforms</h3>
        <p>Choose every platform where players can access your game.</p>
      </div>

      <fieldset className="profile-edit-chip-field">
        <legend>Platforms</legend>
        <div className="profile-edit-chip-row">
          {supportedPlatformOptions().map((platform) => (
            <button
              className={
                'nami-surface-button profile-edit-chip-button' +
                (platforms.includes(platform) ? ' is-active-view' : '')
              }
              key={platform}
              onClick={() => {
                setPlatforms((current) => togglePlatform(current, platform));
                setNotice(null);
              }}
              type="button"
            >
              {platform}
            </button>
          ))}
        </div>
      </fieldset>

      {notice ? <p className="protocol-hint">{notice}</p> : null}

      <button className="nami-surface-button is-primary-surface-button" onClick={handleSave} type="button">
        Save platforms
      </button>
    </article>
  );
}