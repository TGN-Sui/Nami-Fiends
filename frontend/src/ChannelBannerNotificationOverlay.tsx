import { useEffect, type ReactElement } from 'react';

import {
  closeBannerNotificationOverlay,
  dismissActiveBannerNotification,
  openActiveBannerNotification,
  readActiveBannerNotification,
  readBannerNotifications,
  readWaitingBannerNotificationCount,
  resolveBannerNotificationChannel,
  startChannelBannerSimulation,
  useChannelBannerNotificationsStore,
} from './channel-banner-notifications-store.js';
import { type NamiChannel } from './uiMockData.js';

export function ChannelBannerNotificationOverlay(props: {
  onOpenChannel: (channel: NamiChannel) => void;
}): ReactElement | null {
  useChannelBannerNotificationsStore();

  useEffect(() => {
    return startChannelBannerSimulation();
  }, []);

  const activeNotification = readActiveBannerNotification();

  if (!activeNotification) {
    return null;
  }

  const channel = resolveBannerNotificationChannel(activeNotification);
  const queue = readBannerNotifications().filter((notification) => !notification.presented);
  const queueIndex = Math.max(
    queue.findIndex((notification) => notification.id === activeNotification.id) + 1,
    1,
  );
  const waitingCount = readWaitingBannerNotificationCount();
  const hasMore = waitingCount > 1;

  function handleOpenChannel(): void {
    if (channel) {
      props.onOpenChannel(channel);
    }

    openActiveBannerNotification();
  }

  function handleNextBanner(): void {
    dismissActiveBannerNotification();
  }

  function handleCloseOverlay(): void {
    closeBannerNotificationOverlay();
  }

  function handleDismissSurfaceClick(event: { target: EventTarget }): void {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (
      target.closest(
        '.channel-banner-popup-hero, .channel-banner-popup-advance, .channel-banner-popup-close',
      )
    ) {
      return;
    }

    handleCloseOverlay();
  }

  return (
    <div
      aria-labelledby="channel-banner-popup-title"
      className="channel-banner-popup-backdrop"
      onClick={handleDismissSurfaceClick}
      role="dialog"
    >
      <article className={'channel-banner-popup' + (hasMore ? ' has-banner-queue-nav' : '')}>
        <button
          aria-label="Close banner"
          className="channel-banner-popup-close"
          onClick={handleCloseOverlay}
          type="button"
        >
          ×
        </button>

        {hasMore ? (
          <button
            aria-label={'View next banner, ' + queueIndex + ' of ' + waitingCount}
            className="channel-banner-popup-advance"
            onClick={handleNextBanner}
            type="button"
          >
            ›
          </button>
        ) : null}

        <button
          className={
            'channel-banner-popup-hero' + (activeNotification.coverUrl ? ' has-banner-cover' : '')
          }
          onClick={handleOpenChannel}
          style={
            activeNotification.coverUrl
              ? { backgroundImage: 'url(' + JSON.stringify(activeNotification.coverUrl) + ')' }
              : undefined
          }
          type="button"
        >
          <div className="channel-banner-popup-hero-shade" aria-hidden="true" />

          {hasMore ? (
            <span className="channel-banner-popup-queue" aria-hidden="true">
              {queueIndex}/{waitingCount}
            </span>
          ) : null}

          <div className="channel-banner-popup-hero-copy">
            <h2 id="channel-banner-popup-title">{activeNotification.headline}</h2>
            {activeNotification.body ? (
              <p className="channel-banner-popup-hero-lede">{activeNotification.body}</p>
            ) : null}
          </div>
        </button>
      </article>
    </div>
  );
}