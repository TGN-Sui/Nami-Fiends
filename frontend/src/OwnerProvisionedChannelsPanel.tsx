import { useMemo, useState, type ReactElement } from 'react';

import { saveActiveOwnerProvisionedChannelId } from './channel-owner-access.js';
import { buildOwnerProvisionedGameChannel } from './owner-provisioned-game-channel.js';
import { GAME_ONBOARDING_GENRES } from './game-genres.js';
import { isOfficialOwner } from './nami-capabilities.js';
import {
  createOwnerProvisionedChannel,
  listOwnerProvisionedChannelsSorted,
  type OwnerProvisionedChannel,
  useOwnerProvisionedChannels,
} from './owner-provisioned-channels-store.js';
import { SUPPORTED_PLATFORMS } from './platform-genre-options.js';
import type { NamiChannel } from './uiMockData.js';
import { useProtocolOwner } from './wallet.js';

function statusLabel(status: string): string {
  if (status === 'unclaimed') {
    return 'Unclaimed';
  }

  if (status === 'claim-pending') {
    return 'Claim pending';
  }

  if (status === 'transfer-pending') {
    return 'Transfer pending';
  }

  return 'Claimed';
}

export function OwnerProvisionedChannelsPanel(props: {
  embedded?: boolean;
  onOpenChannel?: (channel: NamiChannel) => void;
} = {}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const channels = useOwnerProvisionedChannels();
  const [gameTitle, setGameTitle] = useState('');
  const [handle, setHandle] = useState('');
  const [genre, setGenre] = useState<string>(GAME_ONBOARDING_GENRES[0] ?? 'Indie');
  const [platforms, setPlatforms] = useState<string[]>(['PC']);
  const [tagline, setTagline] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = isOfficialOwner(owner);

  const sortedChannels = useMemo(() => listOwnerProvisionedChannelsSorted(), [channels]);

  if (!canManage) {
    return null;
  }

  function togglePlatform(platform: string): void {
    setPlatforms((current) => {
      if (current.includes(platform)) {
        return current.filter((entry) => entry !== platform);
      }

      return [...current, platform];
    });
  }

  function openProvisionedChannel(channel: OwnerProvisionedChannel): void {
    saveActiveOwnerProvisionedChannelId(channel.channelId);
    props.onOpenChannel?.(buildOwnerProvisionedGameChannel(channel));
  }

  function handleCreateChannel(): void {
    setNotice(null);
    setError(null);

    const result = createOwnerProvisionedChannel(
      {
        gameTitle,
        handle,
        genre,
        platforms,
        tagline,
      },
      owner
    );

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setGameTitle('');
    setHandle('');
    setTagline('');
    setNotice(result.message);

    if (result.channel) {
      openProvisionedChannel(result.channel);
    }
  }

  return (
    <article
      className={
        'nami-owner-section panel owner-provisioned-channels-panel' +
        (props.embedded ? ' nami-owner-advanced-embedded-panel' : '')
      }
    >
      <div className="profile-panel-heading">
        <h3>Owner-provisioned game channels</h3>
        <p>
          Create claimable game channel shells for titles that have not onboarded yet. Game owners
          submit claim tickets with proof; you approve or disapprove before keys hand over.
        </p>
      </div>

      <div className="owner-provisioned-channel-form">
        <label className="onboarding-field">
          <span>Game title</span>
          <input
            onChange={(event) => setGameTitle(event.target.value)}
            placeholder="Reserved game name"
            type="text"
            value={gameTitle}
          />
        </label>
        <label className="onboarding-field">
          <span>Channel handle</span>
          <input
            onChange={(event) => setHandle(event.target.value)}
            placeholder="yourgame"
            type="text"
            value={handle}
          />
        </label>
        <label className="onboarding-field">
          <span>Primary genre</span>
          <select onChange={(event) => setGenre(event.target.value)} value={genre}>
            {GAME_ONBOARDING_GENRES.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="onboarding-quiz-question">
          <legend>Platforms</legend>
          <div className="onboarding-quiz-options onboarding-genre-options">
            {SUPPORTED_PLATFORMS.map((platform) => (
              <label className="onboarding-quiz-option" key={platform}>
                <input
                  checked={platforms.includes(platform)}
                  name={'owner-platform-' + platform}
                  onChange={() => togglePlatform(platform)}
                  type="checkbox"
                />
                <span>{platform}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="onboarding-field">
          <span>Tagline (optional)</span>
          <input
            onChange={(event) => setTagline(event.target.value)}
            placeholder="Short channel description"
            type="text"
            value={tagline}
          />
        </label>
        <button className="onboarding-primary-btn" onClick={handleCreateChannel} type="button">
          Create claimable channel
        </button>
      </div>

      {sortedChannels.length === 0 ? (
        <p className="protocol-hint">No owner-provisioned channels yet.</p>
      ) : (
        <ul className="nami-owner-claim-list owner-provisioned-channel-list">
          {sortedChannels.map((channel) => (
            <li className="nami-owner-claim-row" key={channel.channelId}>
              <span className="nami-owner-claim-summary">
                <strong>{channel.gameTitle}</strong>
                <span>@{channel.handle}</span>
                <span>
                  {channel.genre} · {channel.platforms.join(', ')}
                </span>
                <span className={'game-submission-ticket-status is-' + channel.status}>
                  {statusLabel(channel.status)}
                </span>
                <span className="protocol-hint">{channel.channelId}</span>
              </span>
              {channel.status !== 'claimed' ? (
                <button
                  className="profile-secondary-link"
                  onClick={() => openProvisionedChannel(channel)}
                  type="button"
                >
                  Edit channel
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="onboarding-field-error">{error}</p> : null}
      {notice ? <p className="protocol-hint nami-owner-action-notice">{notice}</p> : null}
    </article>
  );
}