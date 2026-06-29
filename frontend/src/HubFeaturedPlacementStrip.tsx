import type { ReactElement } from 'react';

import { FeaturedPlacementAuctionPanel } from './FeaturedPlacementAuctionPanel.js';
import {
  canViewFeaturedPlacementAuctionPanel,
  type FeaturedAuctionStatus,
} from './featured-placement-auction-store.js';
import { formatHubFeaturedBannerLabel, type HubFeaturedBannerContext } from './hub-featured-showcase.js';
import type { NamiChannel } from './uiMockData.js';

export function HubFeaturedPlacementStrip(props: {
  auctionStatus: FeaturedAuctionStatus;
  showcaseChannels: NamiChannel[];
  activeChannelId: string;
  activeBannerContext: HubFeaturedBannerContext;
  onSelectChannel: (channel: NamiChannel) => void;
  onSelectShowcaseIndex: (index: number) => void;
}): ReactElement {
  const hasAuctionWinners = !props.auctionStatus.isOpen && props.auctionStatus.winners.length > 0;
  const canViewAuction = canViewFeaturedPlacementAuctionPanel();

  return (
    <section className="hub-featured-placement-strip">
      <div className="hub-featured-placement-strip-head">
        <div>
          <span className="mini-badge">Discovery placement</span>
          <h2>Featured showcase</h2>
          <p>
            {canViewAuction
              ? props.auctionStatus.isOpen
                ? 'Auction bids close at ' +
                  props.auctionStatus.closesAtLabel +
                  '. Open-pool winners fill this carousel after close.'
                : hasAuctionWinners
                  ? 'Closed auction winners lead the Hub carousel, then paid hub-featured and discovery fill-ins.'
                  : 'Paid hub-featured slots and discovery rankings rotate here.'
              : 'Featured channels and discovery rankings rotate here.'}
          </p>
        </div>
        {canViewAuction ? (
          <span
            className={
              'hub-featured-placement-status-pill' +
              (props.auctionStatus.isOpen ? ' is-auction-open-pill' : ' is-auction-closed-pill')
            }
          >
            {props.auctionStatus.isOpen ? 'Bidding open' : 'Auction closed'}
          </span>
        ) : null}
      </div>

      {hasAuctionWinners ? (
        <ul className="hub-featured-placement-winners">
          {props.auctionStatus.winners.map((winner) => (
            <li key={winner.channelId + '-' + winner.pool}>
              <button
                className="hub-featured-placement-winner-chip"
                onClick={() => {
                  const channel = props.showcaseChannels.find((entry) => entry.id === winner.channelId);

                  if (channel) {
                    props.onSelectChannel(channel);
                  }
                }}
                type="button"
              >
                <span className="mini-badge">{winner.pool} pool</span>
                <strong>{winner.channelName}</strong>
                <small>{winner.bidAmount} bid</small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="hub-featured-placement-carousel-nav" role="tablist" aria-label="Featured showcase carousel">
        {props.showcaseChannels.map((channel, index) => (
          <button
            aria-selected={channel.id === props.activeChannelId}
            className={
              'hub-featured-placement-carousel-dot' +
              (channel.id === props.activeChannelId ? ' is-active-showcase-dot' : '')
            }
            key={channel.id + '-showcase-dot'}
            onClick={() => props.onSelectShowcaseIndex(index)}
            role="tab"
            title={channel.name}
            type="button"
          >
            <span>{channel.name}</span>
          </button>
        ))}
      </div>

      <p className="hub-featured-placement-active-label">
        Now showing: <strong>{formatHubFeaturedBannerLabel(props.activeBannerContext)}</strong>
      </p>

      <FeaturedPlacementAuctionPanel compact />
    </section>
  );
}