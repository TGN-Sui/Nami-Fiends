import { type ReactElement } from 'react';

import {
  openBannerReminderQueue,
  readActiveBannerNotification,
  readWaitingBannerNotificationCount,
  useChannelBannerNotificationsStore,
} from './channel-banner-notifications-store.js';

export function ChannelBannerReminderBar(): ReactElement | null {
  useChannelBannerNotificationsStore();

  const activeNotification = readActiveBannerNotification();
  const waitingCount = readWaitingBannerNotificationCount();

  if (waitingCount === 0 || activeNotification) {
    return null;
  }

  return (
    <button
      aria-label={'Open ' + waitingCount + ' waiting channel banner' + (waitingCount === 1 ? '' : 's')}
      className="channel-banner-reminder-bar"
      onClick={() => openBannerReminderQueue()}
      type="button"
    >
      <span className="channel-banner-reminder-pulse" aria-hidden="true" />
      <strong aria-hidden="true">{waitingCount}</strong>
    </button>
  );
}