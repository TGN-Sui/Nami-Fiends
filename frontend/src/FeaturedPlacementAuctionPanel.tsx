import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { resolveOwnedGameChannel } from './channel-owner-access.js';
import { getChannelBoostPower } from './channel-boost-store.js';
import {
  canBidFeaturedPlacementAuction,
  canViewFeaturedPlacementAuctionPanel,
  FEATURED_AUCTION_OPEN_SLOTS,
  FEATURED_AUCTION_RISING_BOOST_CAP,
  FEATURED_AUCTION_RISING_SLOTS,
  isRisingPoolEligibleChannel,
  submitFeaturedAuctionBid,
  useFeaturedPlacementAuctionStatus,
  type FeaturedAuctionPool,
} from './featured-placement-auction-store.js';
import { useSelfMember } from './member-avatar-store.js';

export function FeaturedPlacementAuctionPanel(props: { compact?: boolean } = {}): ReactElement | null {
  const selfMember = useSelfMember();
  const status = useFeaturedPlacementAuctionStatus();
  const ownedChannel = resolveOwnedGameChannel();
  const [pool, setPool] = useState<FeaturedAuctionPool>('open');
  const [bidAmount, setBidAmount] = useState('25');
  const [notice, setNotice] = useState<string | null>(null);
  const canView = canViewFeaturedPlacementAuctionPanel();
  const canBid = canBidFeaturedPlacementAuction(selfMember, ownedChannel?.id);
  const risingEligible = ownedChannel
    ? isRisingPoolEligibleChannel(ownedChannel.id, status.weekId)
    : false;
  const channelBoostPower = ownedChannel ? getChannelBoostPower(ownedChannel.id, status.weekId) : 0;

  useEffect(() => {
    setPool(risingEligible ? 'rising' : 'open');
  }, [risingEligible, ownedChannel?.id]);

  const standings = useMemo(() => {
    return {
      rising: status.bids
        .filter((bid) => bid.pool === 'rising')
        .sort((left, right) => right.bidAmount - left.bidAmount)
        .slice(0, FEATURED_AUCTION_RISING_SLOTS),
      open: status.bids
        .filter((bid) => bid.pool === 'open')
        .sort((left, right) => right.bidAmount - left.bidAmount)
        .slice(0, FEATURED_AUCTION_OPEN_SLOTS),
    };
  }, [status.bids]);

  if (!canView) {
    return null;
  }

  function placeBid(): void {
    if (!ownedChannel) {
      setNotice('Claim a game channel before bidding on featured placement.');
      return;
    }

    const result = submitFeaturedAuctionBid({
      channelId: ownedChannel.id,
      channelName: ownedChannel.name,
      pool,
      bidAmount: Number(bidAmount),
      member: selfMember,
    });

    if (!result.ok) {
      if (result.reason === 'wrong-pool') {
        setNotice(
          risingEligible
            ? 'Low-boost channels must bid in the Rising pool this week.'
            : 'Channels above the rising boost cap must use the Open pool.'
        );
      } else if (result.reason === 'auction-closed') {
        setNotice('This week\'s auction is closed. Winners appear in Hub after the cycle reset.');
      } else if (result.reason === 'not-eligible') {
        setNotice('Verified channel owners with good conduct can bid on featured placement.');
      } else {
        setNotice('Enter a bid amount of at least 1.');
      }

      return;
    }

    setNotice('Bid placed for ' + ownedChannel.name + ' in the ' + pool + ' pool.');
  }

  return (
    <article
      className={
        'panel featured-placement-auction-panel' + (props.compact ? ' is-compact-auction-panel' : '')
      }
    >
      <header className="featured-placement-auction-head">
        <div>
          <span className="mini-badge">Model D auction</span>
          <h2>Featured placement auction</h2>
          <p>
            {FEATURED_AUCTION_RISING_SLOTS} rising slot stays hidden in Hub until{' '}
            {status.closesAtLabel}. {FEATURED_AUCTION_OPEN_SLOTS} open slots fill the carousel after
            close.
          </p>
        </div>
        <div
          className={
            'featured-placement-auction-status-pill' +
            (status.isOpen ? ' is-auction-open-pill' : ' is-auction-closed-pill')
          }
        >
          {status.isOpen ? 'Bidding open' : 'Auction closed'}
        </div>
      </header>

      <div className="featured-placement-auction-meta-row">
        <div className="featured-placement-auction-meta-card">
          <span>Rising pool</span>
          <strong>{FEATURED_AUCTION_RISING_SLOTS} hidden slot</strong>
        </div>
        <div className="featured-placement-auction-meta-card">
          <span>Open pool</span>
          <strong>{FEATURED_AUCTION_OPEN_SLOTS} carousel slots</strong>
        </div>
        <div className="featured-placement-auction-meta-card">
          <span>Boost cap</span>
          <strong>{FEATURED_AUCTION_RISING_BOOST_CAP} power</strong>
        </div>
      </div>

      {ownedChannel ? (
        <p className="featured-placement-auction-channel-copy">
          Bidding as <strong>{ownedChannel.name}</strong> · {channelBoostPower} weekly boost power
          {risingEligible
            ? ' · eligible for Rising pool'
            : ' · bid in Open pool (above ' + FEATURED_AUCTION_RISING_BOOST_CAP + ' boost cap)'}
        </p>
      ) : (
        <p className="featured-placement-auction-channel-copy">
          Claim a verified game channel to enter the weekly featured placement auction.
        </p>
      )}

      {canBid && status.isOpen ? (
        <div className="featured-placement-auction-bid-form">
          <div className="featured-placement-auction-pool-picker" role="group" aria-label="Auction pool">
            <button
              aria-pressed={pool === 'rising'}
              className={
                'featured-placement-auction-pool-option' + (pool === 'rising' ? ' is-active-pool' : '')
              }
              disabled={!risingEligible}
              onClick={() => setPool('rising')}
              type="button"
            >
              <strong>Rising pool</strong>
              <span>Low-boost channels only</span>
            </button>
            <button
              aria-pressed={pool === 'open'}
              className={
                'featured-placement-auction-pool-option' + (pool === 'open' ? ' is-active-pool' : '')
              }
              disabled={risingEligible}
              onClick={() => setPool('open')}
              type="button"
            >
              <strong>Open pool</strong>
              <span>Above rising boost cap</span>
            </button>
          </div>

          <div className="featured-placement-auction-bid-controls">
            <label className="featured-placement-auction-bid-field">
              <span>Bid amount</span>
              <input
                min={1}
                onChange={(event) => setBidAmount(event.target.value)}
                type="number"
                value={bidAmount}
              />
            </label>
            <button className="featured-placement-auction-place-bid-btn" onClick={placeBid} type="button">
              Place bid
            </button>
          </div>
        </div>
      ) : null}

      <div className="featured-placement-auction-standings">
        <section>
          <h3>Rising pool</h3>
          {standings.rising.length === 0 ? (
            <p className="protocol-hint">No rising bids yet.</p>
          ) : (
            <ul>
              {standings.rising.map((bid) => (
                <li key={bid.id}>
                  <strong>{bid.channelName}</strong> · {bid.bidAmount}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3>Open pool</h3>
          {standings.open.length === 0 ? (
            <p className="protocol-hint">No open bids yet.</p>
          ) : (
            <ul>
              {standings.open.map((bid) => (
                <li key={bid.id}>
                  <strong>{bid.channelName}</strong> · {bid.bidAmount}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {!status.isOpen && status.winners.length > 0 ? (
        <div className="featured-placement-auction-winners">
          <h3>This week&apos;s winners</h3>
          <ul>
            {status.winners.map((winner) => (
              <li key={winner.channelId + '-' + winner.pool}>
                <strong>{winner.channelName}</strong> · {winner.pool} pool · {winner.bidAmount}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {notice ? <p className="featured-placement-auction-notice">{notice}</p> : null}
    </article>
  );
}