import type { CSSProperties, ReactElement } from 'react';

import { resolveChannelCoverUrl } from './channel-cover-store.js';
import { developers, type NamiChannel } from './uiMockData.js';

type GameVerificationTier = 'verified-game' | 'studio-approved' | 'community-game';

function channelDeveloper(channel: NamiChannel): (typeof developers)[number] {
  return developers.find((developer) => developer.id === channel.developerId) ?? developers[0]!;
}

function gameVerificationTier(channel: NamiChannel): GameVerificationTier {
  const developerProfile = channelDeveloper(channel);

  if (channel.verifiedGame) {
    return 'verified-game';
  }

  if (developerProfile.approved) {
    return 'studio-approved';
  }

  return 'community-game';
}

function gameVerificationClass(channel: NamiChannel): string {
  const tier = gameVerificationTier(channel);

  if (tier === 'verified-game') {
    return 'is-verified-game-surface';
  }

  if (tier === 'studio-approved') {
    return 'is-studio-approved-surface';
  }

  return 'is-community-game-surface';
}

function gameVerificationShortLabel(channel: NamiChannel): string {
  const tier = gameVerificationTier(channel);

  if (tier === 'verified-game') {
    return 'VG';
  }

  if (tier === 'studio-approved') {
    return 'ST';
  }

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

export function RelatedChannelCoverTile(props: {
  channel: NamiChannel;
  brandPrimary: string;
  brandSoft: string;
  onOpen: () => void;
}): ReactElement {
  const hasCoverArt = Boolean(resolveChannelCoverUrl(props.channel));

  return (
    <button
      aria-label={'Open ' + props.channel.name}
      className={[
        'related-channel-cover-tile',
        props.channel.partner ? 'is-partner-related-tile' : '',
        gameVerificationClass(props.channel),
        hasCoverArt ? 'has-cover-art' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={props.onOpen}
      style={
        {
          '--game-card-brand': props.brandPrimary,
          '--game-card-brand-soft': props.brandSoft,
          ...gameCoverAssetVariables(props.channel),
        } as CSSProperties
      }
      title={props.channel.name}
      type="button"
    >
      <div className="related-channel-cover-tile-art" aria-hidden="true">
        <span className="related-channel-cover-tile-fallback">
          {props.channel.name.slice(0, 2).toUpperCase()}
        </span>
      </div>

      {props.channel.partner ? (
        <span className="related-channel-cover-tile-foil" aria-hidden="true" />
      ) : null}

      <div className="related-channel-cover-tile-badges" aria-hidden="true">
        <span className={'related-channel-cover-tile-proof ' + gameVerificationClass(props.channel)}>
          {gameVerificationShortLabel(props.channel)}
        </span>
        {props.channel.verifiedGame ? (
          <i className="related-channel-cover-tile-grade-icon" title="Verified game">
            ◆
          </i>
        ) : null}
        {props.channel.partner ? (
          <i className="related-channel-cover-tile-partner-icon" title="Official partner">
            ✦
          </i>
        ) : null}
      </div>
    </button>
  );
}