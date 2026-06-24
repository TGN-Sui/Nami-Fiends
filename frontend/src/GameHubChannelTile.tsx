import type { CSSProperties, ReactElement } from 'react';

import { resolveChannelCoverUrl } from './channel-cover-store.js';
import { resetGameCardTilt, updateGameCardTilt } from './game-card-tilt.js';
import { GameHubInlineCoverUpload } from './GameHubInlineCoverUpload.js';
import { developers, type NamiChannel } from './uiMockData.js';

type GameVerificationTier = 'verified-game' | 'studio-approved' | 'community-game';

function channelDeveloper(channel: NamiChannel): (typeof developers)[number] {
  return developers.find((developer) => developer.id === channel.developerId) ?? developers[0]!;
}

function gameVerificationTier(channel: NamiChannel): GameVerificationTier {
  const developerProfile = channelDeveloper(channel);

  if (channel.verifiedGame) return 'verified-game';
  if (developerProfile.approved) return 'studio-approved';

  return 'community-game';
}

function gameVerificationClass(channel: NamiChannel): string {
  const tier = gameVerificationTier(channel);

  if (tier === 'verified-game') return 'is-verified-game-surface';
  if (tier === 'studio-approved') return 'is-studio-approved-surface';

  return 'is-community-game-surface';
}

function gameVerificationShortLabel(channel: NamiChannel): string {
  const tier = gameVerificationTier(channel);

  if (tier === 'verified-game') return 'VG';
  if (tier === 'studio-approved') return 'ST';

  return 'CM';
}

function cssAssetUrl(url: string): string {
  return 'url("' + url.replace(/"/g, '\\u0022') + '")';
}

function gameCoverAssetVariables(channel: NamiChannel): CSSProperties {
  const coverImageUrl = resolveChannelCoverUrl(channel)?.trim();

  if (!coverImageUrl) {
    return {
      '--game-cover-image': 'none',
      '--game-cover-image-opacity': '0',
    } as CSSProperties;
  }

  return {
    '--game-cover-image': cssAssetUrl(coverImageUrl),
    '--game-cover-image-opacity': '1',
  } as CSSProperties;
}

export function GameHubChannelTile(props: {
  channel: NamiChannel;
  brandPrimary: string;
  brandSoft: string;
  onOpen: () => void;
  showOwnerCoverUpload?: boolean;
}): ReactElement {
  const developerProfile = channelDeveloper(props.channel);
  const hasCoverArt = Boolean(resolveChannelCoverUrl(props.channel));
  const genreLabel = props.channel.genre.split('/')[0]?.trim() ?? props.channel.genre;

  return (
    <button
      className={[
        'gamehub-channel-tile',
        props.channel.partner ? 'is-partner-tile' : 'is-standard-tile',
        gameVerificationClass(props.channel),
        hasCoverArt ? 'has-cover-art' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={props.onOpen}
      onPointerLeave={(event) => resetGameCardTilt(event.currentTarget)}
      onPointerMove={(event) => updateGameCardTilt(event.currentTarget, event.clientX, event.clientY)}
      style={
        {
          '--game-card-brand': props.brandPrimary,
          '--game-card-brand-soft': props.brandSoft,
          ...gameCoverAssetVariables(props.channel),
        } as CSSProperties
      }
      type="button"
    >
      <span className="gamehub-channel-tile-slab" aria-hidden="true" />

      <div className="gamehub-channel-tile-art" aria-hidden="true">
        <span className="gamehub-channel-tile-fallback">{props.channel.name.slice(0, 2).toUpperCase()}</span>
      </div>

      {props.channel.partner ? <span className="gamehub-channel-tile-foil" aria-hidden="true" /> : null}

      <div className="gamehub-channel-tile-idle" aria-hidden="true">
        {props.channel.partner ? <span className="gamehub-channel-tile-partner-mark">Partner</span> : null}
        <span className={'gamehub-channel-tile-proof ' + gameVerificationClass(props.channel)}>
          {gameVerificationShortLabel(props.channel)}
        </span>
      </div>

      {props.showOwnerCoverUpload ? (
        <GameHubInlineCoverUpload
          channel={props.channel}
          className="is-tile-strip-upload"
          label="Upload tile cover"
        />
      ) : null}

      <div className="gamehub-channel-tile-hover">
        <div className="gamehub-channel-tile-hover-head">
          <span className="gamehub-channel-tile-dev-logo" title={developerProfile.name + ' developer mark'}>
            {developerProfile.logoSeed}
          </span>
          <span className="gamehub-channel-tile-badges">
            {props.channel.verifiedGame ? (
              <i className="gamehub-channel-tile-grade-icon" title="Verified game">
                ◆
              </i>
            ) : null}
            {props.channel.partner ? (
              <i className="gamehub-channel-tile-partner-icon" title="Official partner">
                ✦
              </i>
            ) : null}
          </span>
        </div>
        <strong>{props.channel.name}</strong>
        <p>
          {props.channel.platforms.slice(0, 2).join(' / ')} · {genreLabel}
        </p>
        <span className="gamehub-channel-tile-cta">View channel</span>
      </div>
    </button>
  );
}