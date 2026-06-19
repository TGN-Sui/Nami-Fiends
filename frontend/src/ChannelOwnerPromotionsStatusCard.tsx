import { type ReactElement } from 'react';

import {
  readOwnerPromotionStatuses,
  useChannelOwnerPromotionsState,
} from './channel-owner-promotions-store.js';

export function ChannelOwnerPromotionsStatusCard(props: {
  compact?: boolean;
}): ReactElement {
  useChannelOwnerPromotionsState();
  const statuses = readOwnerPromotionStatuses();

  return (
    <article
      className={
        'panel channel-owner-promotions-status-card' + (props.compact ? ' is-compact-promotions-status' : '')
      }
    >
      <div className="channel-owner-tool-card-head">
        <div>
          <span className="mini-badge">Active promotions</span>
          <h3>Owner feature timers</h3>
          <p>Time left on purchased Super Banner access, Hub Featured, and Partner Carousel placements.</p>
        </div>
      </div>

      {statuses.length === 0 ? (
        <p className="channel-owner-promotions-status-empty">No active owner promotions yet.</p>
      ) : (
        <div className="channel-owner-promotions-status-list">
          {statuses.map((status) => (
            <div
              className={
                'channel-owner-promotions-status-row' + (status.isActive ? ' is-active-promotion-row' : '')
              }
              key={status.id}
            >
              <div>
                <strong>{status.label}</strong>
                <p>{status.detail}</p>
              </div>
              <span className="channel-owner-promotions-status-timer">
                {status.remainingLabel ?? '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}