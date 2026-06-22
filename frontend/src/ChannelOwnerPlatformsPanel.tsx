import { type ReactElement } from 'react';

import { useChannelOwnerSettings } from './channel-owner-settings-context.js';
import { supportedPlatformOptions } from './channel-owner-profile-store.js';
import type { NamiChannel } from './uiMockData.js';

function togglePlatform(platforms: string[], platform: string): string[] {
  return platforms.includes(platform)
    ? platforms.filter((entry) => entry !== platform)
    : [...platforms, platform];
}

export function ChannelOwnerPlatformsPanel(props: { channel: NamiChannel }): ReactElement {
  const settings = useChannelOwnerSettings();
  const platforms = settings.draft.platforms;

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
              onClick={() => settings.updatePlatforms(togglePlatform(platforms, platform))}
              type="button"
            >
              {platform}
            </button>
          ))}
        </div>
      </fieldset>

      <p className="channel-owner-tool-footnote">
        Platform changes apply when you press Save settings.
      </p>
    </article>
  );
}