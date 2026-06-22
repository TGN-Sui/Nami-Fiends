import { type ReactElement } from 'react';

import { useChannelOwnerSettings } from './channel-owner-settings-context.js';
import {
  supportedGameGenreOptions,
  supportedPlatformOptions,
} from './channel-owner-profile-store.js';
import type { NamiChannel } from './uiMockData.js';

function togglePlatform(platforms: string[], platform: string): string[] {
  return platforms.includes(platform)
    ? platforms.filter((entry) => entry !== platform)
    : [...platforms, platform];
}

function toggleGenre(genres: string[], genre: string): string[] {
  return genres.includes(genre)
    ? genres.filter((entry) => entry !== genre)
    : [...genres, genre];
}

export function ChannelOwnerPlatformsPanel(props: { channel: NamiChannel }): ReactElement {
  const settings = useChannelOwnerSettings();
  const platforms = settings.draft.platforms;
  const genres = settings.draft.genres;

  return (
    <article className="panel channel-owner-layout-panel channel-owner-platforms-panel">
      <div className="profile-panel-heading">
        <h3>Supported platforms</h3>
        <p>Choose every platform and genre tag that describes your game.</p>
      </div>

      <fieldset className="profile-edit-chip-field">
        <legend>Game genre(s)</legend>
        <div className="profile-edit-chip-row">
          {supportedGameGenreOptions().map((genre) => (
            <button
              className={
                'nami-surface-button profile-edit-chip-button' +
                (genres.includes(genre) ? ' is-active-view' : '')
              }
              key={genre}
              onClick={() => settings.updateGenres(toggleGenre(genres, genre))}
              type="button"
            >
              {genre}
            </button>
          ))}
        </div>
      </fieldset>

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
        Platform and genre changes apply when you press Save settings.
      </p>
    </article>
  );
}