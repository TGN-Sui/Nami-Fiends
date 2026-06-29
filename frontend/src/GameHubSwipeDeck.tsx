import { useEffect, useRef, type CSSProperties, type PointerEvent, type ReactElement } from 'react';

import { resolveChannelCoverUrl } from './channel-cover-store.js';
import { useGameCardTilt } from './game-card-tilt.js';
import type { GameHubBrowserDeckEntry } from './gamehub-browser-deck.js';
import { GameHubInlineCoverUpload } from './GameHubInlineCoverUpload.js';
import { getStoredChannelBrandTheme } from './channel-profile-brand.js';
import { useGameHubSwipeDeck, type GameHubSwipeDeckMotion } from './useGameHubSwipeDeck.js';
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

function gameVerificationBadgeLabel(channel: NamiChannel): string {
  const tier = gameVerificationTier(channel);

  if (tier === 'verified-game') return 'Verified game proof';
  if (tier === 'studio-approved') return 'Studio approved';

  return 'Community listed';
}

function developerVerificationClass(developer: (typeof developers)[number]): string {
  if (developer.proofStatus === 'Verified Studio') return 'is-verified-studio-logo';
  if (developer.approved) return 'is-approved-studio-logo';

  return 'is-community-studio-logo';
}

function developerShortProofLabel(developer: (typeof developers)[number]): string {
  if (developer.proofStatus === 'Verified Studio') return 'VS';
  if (developer.approved) return 'AP';

  return 'CS';
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

function deckMotionClassName(motion: GameHubSwipeDeckMotion): string {
  if (motion === 'next') return 'is-deck-flip-next';
  if (motion === 'previous') return 'is-deck-flip-previous';
  if (motion === 'settle') return 'is-deck-settle';
  if (motion === 'reshuffle') return 'is-deck-reshuffle';

  return '';
}

export function GameHubSwipeDeck(props: {
  entries: GameHubBrowserDeckEntry[];
  fallbackChannel: NamiChannel;
  canEditChannelCover: (channelId: string) => boolean;
  onOpenProfile: (channel: NamiChannel) => void;
}): ReactElement {
  const { deckEntries, deckIndex, deckMotion, reshuffleCount, canGoPrevious, advanceDeck } =
    useGameHubSwipeDeck(props.entries);
  const swipeCardTilt = useGameCardTilt();
  const dragStartXRef = useRef<number | null>(null);

  const activeEntry = deckEntries[deckIndex] ?? deckEntries[0];
  const activeChannel = activeEntry?.channel ?? props.fallbackChannel;
  const nextChannel = deckEntries[deckIndex + 1]?.channel ?? activeChannel;
  const thirdChannel = deckEntries[deckIndex + 2]?.channel ?? nextChannel;
  const activeDeveloper = channelDeveloper(activeChannel);
  const deckLength = deckEntries.length;
  const motionClassName = deckMotionClassName(deckMotion);
  const deckInteractionEnabled = deckMotion === 'idle';

  useEffect(() => {
    swipeCardTilt.resetTilt();
  }, [activeChannel.id, deckIndex, reshuffleCount, swipeCardTilt.resetTilt]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    dragStartXRef.current = event.clientX;
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>): void {
    const startX = dragStartXRef.current;

    dragStartXRef.current = null;

    if (startX === null) {
      return;
    }

    const deltaX = event.clientX - startX;

    if (deltaX <= -48) {
      advanceDeck('next');
      return;
    }

    if (deltaX >= 48) {
      advanceDeck('previous');
    }
  }

  function handlePointerCancel(): void {
    dragStartXRef.current = null;
  }

  return (
    <section className="gamehub-swipe-stage" aria-label="Swipe deck channel browser">
      <div className="gamehub-swipe-copy channel-profile-about-intro" key={activeChannel.id + '-' + reshuffleCount}>
        <strong className="gamehub-swipe-deck-counter">
          {deckLength === 0
            ? '0 / 0'
            : (deckIndex + 1).toLocaleString() + ' / ' + deckLength.toLocaleString()}
        </strong>
        {deckMotion === 'reshuffle' ? (
          <span className="gamehub-swipe-deck-reshuffle-note" role="status">
            Deck reshuffled
          </span>
        ) : null}
      </div>

      <div
        className="gamehub-swipe-deck-column"
        onPointerCancel={handlePointerCancel}
        onPointerDownCapture={handlePointerDown}
        onPointerUpCapture={handlePointerUp}
      >
        <div className={'gamehub-swipe-deck' + (motionClassName ? ' ' + motionClassName : '')}>
          <div className="gamehub-swipe-shadow-card is-third" aria-hidden="true">
            <strong>{thirdChannel.name}</strong>
          </div>
          <div className="gamehub-swipe-shadow-card is-second" aria-hidden="true">
            <strong>{nextChannel.name}</strong>
          </div>

          <button
            key={activeChannel.id + '-' + deckIndex + '-' + reshuffleCount}
            aria-label={'Open ' + activeChannel.name + ' profile'}
            className={
              'gamehub-swipe-card gamehub-swipe-cover-card is-swipe-card-open is-deck-active is-verified-foil ' +
              gameVerificationClass(activeChannel) +
              (deckInteractionEnabled && swipeCardTilt.tiltClassName
                ? ' ' + swipeCardTilt.tiltClassName
                : '')
            }
            onClick={() => props.onOpenProfile(activeChannel)}
            onPointerEnter={
              deckInteractionEnabled ? swipeCardTilt.tiltHandlers.onPointerEnter : undefined
            }
            onPointerLeave={
              deckInteractionEnabled ? swipeCardTilt.tiltHandlers.onPointerLeave : undefined
            }
            onPointerMove={
              deckInteractionEnabled ? swipeCardTilt.tiltHandlers.onPointerMove : undefined
            }
            style={
              {
                '--game-card-brand': getStoredChannelBrandTheme(activeChannel.id).primary,
                '--game-card-brand-soft': getStoredChannelBrandTheme(activeChannel.id).secondary,
                ...(deckInteractionEnabled ? swipeCardTilt.tiltStyle : {}),
              } as CSSProperties
            }
            type="button"
          >
            <div
              className={
                'gamehub-swipe-cover-art' +
                (resolveChannelCoverUrl(activeChannel) ? ' has-game-cover-image' : '')
              }
              aria-hidden="true"
              style={gameCoverAssetVariables(activeChannel)}
            >
              <span>{activeChannel.name.slice(0, 2).toUpperCase()}</span>
            </div>

            {props.canEditChannelCover(activeChannel.id) ? (
              <GameHubInlineCoverUpload
                channel={activeChannel}
                className="is-swipe-deck-upload"
                label="Upload swipe deck cover"
              />
            ) : null}

            <div className="gamehub-swipe-cover-overlay">
              <div className="gamehub-swipe-card-top">
                <span
                  className={'gamehub-dev-logo ' + developerVerificationClass(activeDeveloper)}
                  title={activeDeveloper.name + ' · ' + activeDeveloper.proofStatus}
                >
                  {activeDeveloper.logoSeed}
                </span>

                <span className="gamehub-cover-icons">
                  <i
                    className={'gamehub-proof-icon ' + gameVerificationClass(activeChannel)}
                    title={gameVerificationBadgeLabel(activeChannel)}
                  >
                    {gameVerificationShortLabel(activeChannel)}
                  </i>
                  <i
                    className={'gamehub-studio-proof-icon ' + developerVerificationClass(activeDeveloper)}
                    title={activeDeveloper.proofStatus}
                  >
                    {developerShortProofLabel(activeDeveloper)}
                  </i>
                </span>
              </div>

              <div className="gamehub-swipe-card-copy">
                <div className="gamehub-swipe-taxonomy-row">
                  <span className="gamehub-swipe-surface-label">
                    <i aria-hidden="true">▣</i>
                    Game
                  </span>
                  <i className={gameVerificationClass(activeChannel)}>
                    {gameVerificationShortLabel(activeChannel)}
                  </i>
                  <em>{developerShortProofLabel(activeDeveloper)}</em>
                </div>

                <h3>{activeChannel.name}</h3>
                <p>{activeChannel.genre} · {activeChannel.platforms.join(' / ')}</p>
              </div>

              <div className="gamehub-swipe-meta">
                <span>{activeChannel.subscribers.toLocaleString()}</span>
                <span>{activeChannel.handle}</span>
                <span>{gameVerificationBadgeLabel(activeChannel)}</span>
              </div>
            </div>
          </button>
        </div>

        <div className="gamehub-swipe-actions">
          <button
            aria-label="Previous card"
            className="gamehub-swipe-arrow-button is-swipe-previous"
            disabled={!canGoPrevious || deckMotion !== 'idle'}
            onClick={() => advanceDeck('previous')}
            type="button"
          />
          <button
            aria-label="Next card"
            className="gamehub-swipe-arrow-button is-swipe-next"
            disabled={deckLength === 0 || deckMotion !== 'idle'}
            onClick={() => advanceDeck('next')}
            type="button"
          />
        </div>
      </div>
    </section>
  );
}