import { useState, type ReactElement } from 'react';

import {
  markAllTagNotificationsRead,
  markTagNotificationRead,
  readTagMentionNotificationsEnabled,
  saveTagMentionNotificationsEnabled,
  useTagNotifications,
  type TagNotification,
} from './nami-notifications-store.js';

type TagNotificationsPanelProps = {
  onOpenMember?: (memberId: string) => void;
  onNavigateGuilds?: () => void;
  compact?: boolean;
};

function formatNotificationTime(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function notificationCopy(notification: TagNotification): string {
  return (
    notification.authorName +
    ' tagged ' +
    notification.tagLabel +
    ' in ' +
    notification.contextLabel
  );
}

export function TagNotificationsPanel(props: TagNotificationsPanelProps): ReactElement {
  const notifications = useTagNotifications();
  const [enabled, setEnabled] = useState(() => readTagMentionNotificationsEnabled());
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  function toggleEnabled(nextEnabled: boolean): void {
    setEnabled(nextEnabled);
    saveTagMentionNotificationsEnabled(nextEnabled);
  }

  function openNotification(notification: TagNotification): void {
    markTagNotificationRead(notification.id);

    if (notification.tagKind === 'member') {
      props.onOpenMember?.(notification.targetId);
      return;
    }

    if (notification.tagKind === 'guild' || notification.tagKind === 'squad') {
      props.onNavigateGuilds?.();
    }
  }

  return (
    <article className={'panel settings-card tag-notifications-panel' + (props.compact ? ' is-compact-tag-panel' : '')}>
      <div className="profile-panel-heading">
        <h2>Tag Mentions</h2>
        <p>
          Get notified when someone tags you, your guild, or your squad in chat. Tagged names stay
          clickable for everyone in the room.
        </p>
      </div>

      <label className="tag-notification-toggle-row">
        <input
          checked={enabled}
          onChange={(event) => toggleEnabled(event.target.checked)}
          type="checkbox"
        />
        <span>Tag mention notifications</span>
      </label>

      <div className="tag-notification-summary-row">
        <span>{unreadCount} unread</span>
        {unreadCount > 0 ? (
          <button className="secondary-action" onClick={markAllTagNotificationsRead} type="button">
            Mark all read
          </button>
        ) : null}
      </div>

      <div className="tag-notification-list">
        {notifications.length === 0 ? (
          <p className="tag-notification-empty">No tag mentions yet. Try @Nozomi or &amp;Wave Raiders in chat.</p>
        ) : (
          notifications.slice(0, props.compact ? 5 : 12).map((notification) => (
            <button
              className={
                'tag-notification-row' + (notification.read ? ' is-read-tag-notification' : '')
              }
              key={notification.id}
              onClick={() => openNotification(notification)}
              type="button"
            >
              <strong>{notificationCopy(notification)}</strong>
              <p>{notification.bodyPreview}</p>
              <small>{formatNotificationTime(notification.createdAt)}</small>
            </button>
          ))
        )}
      </div>
    </article>
  );
}