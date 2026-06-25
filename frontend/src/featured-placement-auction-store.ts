import { useEffect, useSyncExternalStore } from 'react';

import { currentBoostWeekId, getChannelBoostPower } from './channel-boost-store.js';
import { ownsGameChannel, resolveOwnedGameChannel } from './channel-owner-access.js';
import {
  formatBoostCycleResetCentral,
  getNextBoostCycleResetMs,
} from './boost-cycle.js';
import { getSelfMember, isMemberVerified } from './member-access.js';
import type { NamiMember } from './uiMockData.js';

const STORAGE_KEY = 'nami.featured-placement-auction';

export const FEATURED_AUCTION_TOTAL_SLOTS = 6;
export const FEATURED_AUCTION_RISING_SLOTS = 1;
export const FEATURED_AUCTION_OPEN_SLOTS = FEATURED_AUCTION_TOTAL_SLOTS - FEATURED_AUCTION_RISING_SLOTS;
export const FEATURED_AUCTION_RISING_BOOST_CAP = 12;

export type FeaturedAuctionPool = 'rising' | 'open';

export type FeaturedAuctionBid = {
  id: string;
  channelId: string;
  channelName: string;
  ownerMemberId: string;
  pool: FeaturedAuctionPool;
  bidAmount: number;
  weekId: number;
  submittedAtMs: number;
};

export type FeaturedAuctionWinner = {
  channelId: string;
  channelName: string;
  pool: FeaturedAuctionPool;
  bidAmount: number;
};

type FeaturedAuctionWeekRecord = {
  weekId: number;
  status: 'open' | 'closed';
  bids: FeaturedAuctionBid[];
  winners: FeaturedAuctionWinner[];
  closedAtMs: number | null;
};

export type FeaturedAuctionStatus = {
  weekId: number;
  isOpen: boolean;
  closesAtLabel: string;
  risingHidden: boolean;
  bids: FeaturedAuctionBid[];
  winners: FeaturedAuctionWinner[];
};

export type SubmitFeaturedAuctionBidResult =
  | { ok: true; bid: FeaturedAuctionBid }
  | {
      ok: false;
      reason:
        | 'auction-closed'
        | 'not-eligible'
        | 'invalid-bid'
        | 'wrong-pool'
        | 'not-channel-owner';
    };

const listeners = new Set<() => void>();
let cachedStatus: FeaturedAuctionStatus | null = null;

function emit(): void {
  cachedStatus = null;
  listeners.forEach((listener) => listener());
}

function readAllWeeks(): FeaturedAuctionWeekRecord[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as FeaturedAuctionWeekRecord[]) : [];
  } catch {
    return [];
  }
}

function persistWeeks(weeks: FeaturedAuctionWeekRecord[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(weeks));
}

function writeAllWeeks(weeks: FeaturedAuctionWeekRecord[]): void {
  persistWeeks(weeks);
  emit();
}

function emptyWeekRecord(weekId: number): FeaturedAuctionWeekRecord {
  return {
    weekId,
    status: 'open',
    bids: [],
    winners: [],
    closedAtMs: null,
  };
}

export function isRisingPoolEligibleChannel(channelId: string, weekId = currentBoostWeekId()): boolean {
  return getChannelBoostPower(channelId, weekId) <= FEATURED_AUCTION_RISING_BOOST_CAP;
}

export function canBidFeaturedPlacementAuction(
  member: NamiMember = getSelfMember(),
  channelId?: string
): boolean {
  if (!isMemberVerified(member) || member.signal === 'Black') {
    return false;
  }

  const owned = resolveOwnedGameChannel();

  if (!owned || !ownsGameChannel(owned.id)) {
    return false;
  }

  if (channelId) {
    return owned.id === channelId;
  }

  return true;
}

function resolveWinners(
  bids: FeaturedAuctionBid[],
  weekId: number
): FeaturedAuctionWinner[] {
  const risingCandidates = bids
    .filter((bid) => bid.pool === 'rising' && isRisingPoolEligibleChannel(bid.channelId, weekId))
    .sort((left, right) => right.bidAmount - left.bidAmount || right.submittedAtMs - left.submittedAtMs);

  const risingWinner = risingCandidates[0];
  const winners: FeaturedAuctionWinner[] = [];

  if (risingWinner) {
    winners.push({
      channelId: risingWinner.channelId,
      channelName: risingWinner.channelName,
      pool: 'rising',
      bidAmount: risingWinner.bidAmount,
    });
  }

  const openCandidates = bids
    .filter(
      (bid) =>
        bid.pool === 'open' &&
        (!risingWinner || bid.channelId !== risingWinner.channelId)
    )
    .sort((left, right) => right.bidAmount - left.bidAmount || right.submittedAtMs - left.submittedAtMs)
    .slice(0, FEATURED_AUCTION_OPEN_SLOTS);

  for (const bid of openCandidates) {
    winners.push({
      channelId: bid.channelId,
      channelName: bid.channelName,
      pool: 'open',
      bidAmount: bid.bidAmount,
    });
  }

  return winners;
}

function closeWeekRecord(record: FeaturedAuctionWeekRecord): FeaturedAuctionWeekRecord {
  if (record.status === 'closed') {
    return record;
  }

  return {
    ...record,
    status: 'closed',
    winners: resolveWinners(record.bids, record.weekId),
    closedAtMs: Date.now(),
  };
}

function materializeWeeksForRead(now = new Date()): FeaturedAuctionWeekRecord[] {
  const activeWeekId = currentBoostWeekId(now);
  const weeks = readAllWeeks();

  const nextWeeks = weeks.map((record) => {
    if (record.weekId < activeWeekId && record.status === 'open') {
      return closeWeekRecord(record);
    }

    return record;
  });

  if (!nextWeeks.some((record) => record.weekId === activeWeekId)) {
    nextWeeks.unshift(emptyWeekRecord(activeWeekId));
  }

  return nextWeeks;
}

function resolveWeekRecordForRead(
  weeks: readonly FeaturedAuctionWeekRecord[],
  weekId: number
): FeaturedAuctionWeekRecord {
  return weeks.find((entry) => entry.weekId === weekId) ?? emptyWeekRecord(weekId);
}

export function hydrateFeaturedAuctionStore(now = new Date()): boolean {
  const activeWeekId = currentBoostWeekId(now);
  const weeks = readAllWeeks();
  let changed = false;

  const nextWeeks = weeks.map((record) => {
    if (record.weekId < activeWeekId && record.status === 'open') {
      changed = true;
      return closeWeekRecord(record);
    }

    return record;
  });

  if (!nextWeeks.some((record) => record.weekId === activeWeekId)) {
    nextWeeks.unshift(emptyWeekRecord(activeWeekId));
    changed = true;
  }

  if (changed) {
    persistWeeks(nextWeeks);
    emit();
  }

  return changed;
}

export function readFeaturedAuctionStatus(now = new Date()): FeaturedAuctionStatus {
  const weekId = currentBoostWeekId(now);
  const record = resolveWeekRecordForRead(materializeWeeksForRead(now), weekId);
  const isOpen = record.status === 'open';

  return {
    weekId,
    isOpen,
    closesAtLabel: formatBoostCycleResetCentral(undefined),
    risingHidden: isOpen,
    bids: record.bids,
    winners: record.winners,
  };
}

export function submitFeaturedAuctionBid(input: {
  channelId: string;
  channelName: string;
  pool: FeaturedAuctionPool;
  bidAmount: number;
  member?: NamiMember;
}): SubmitFeaturedAuctionBidResult {
  const member = input.member ?? getSelfMember();
  const bidAmount = Math.round(input.bidAmount);

  if (!canBidFeaturedPlacementAuction(member, input.channelId)) {
    return { ok: false, reason: 'not-eligible' };
  }

  if (!Number.isFinite(bidAmount) || bidAmount < 1) {
    return { ok: false, reason: 'invalid-bid' };
  }

  const status = readFeaturedAuctionStatus();

  if (!status.isOpen) {
    return { ok: false, reason: 'auction-closed' };
  }

  if (input.pool === 'rising' && !isRisingPoolEligibleChannel(input.channelId, status.weekId)) {
    return { ok: false, reason: 'wrong-pool' };
  }

  if (input.pool === 'open' && isRisingPoolEligibleChannel(input.channelId, status.weekId)) {
    return { ok: false, reason: 'wrong-pool' };
  }

  const bid: FeaturedAuctionBid = {
    id: 'auction-bid-' + input.channelId + '-' + Date.now(),
    channelId: input.channelId,
    channelName: input.channelName,
    ownerMemberId: member.id,
    pool: input.pool,
    bidAmount,
    weekId: status.weekId,
    submittedAtMs: Date.now(),
  };

  const weeks = readAllWeeks();
  const index = weeks.findIndex((entry) => entry.weekId === status.weekId);
  const record = index >= 0 ? weeks[index]! : emptyWeekRecord(status.weekId);
  const withoutChannel = record.bids.filter((entry) => entry.channelId !== input.channelId);
  const nextRecord: FeaturedAuctionWeekRecord = {
    ...record,
    bids: [bid, ...withoutChannel],
  };

  if (index >= 0) {
    weeks[index] = nextRecord;
  } else {
    weeks.unshift(nextRecord);
  }

  writeAllWeeks(weeks);

  return { ok: true, bid };
}

export function readFeaturedAuctionHubChannelIds(now = new Date()): string[] {
  const status = readFeaturedAuctionStatus(now);

  if (status.isOpen || status.winners.length === 0) {
    return [];
  }

  return status.winners.map((winner) => winner.channelId);
}

export function closeFeaturedAuctionWeekForTests(weekId = currentBoostWeekId()): FeaturedAuctionWinner[] {
  const weeks = readAllWeeks();
  const index = weeks.findIndex((entry) => entry.weekId === weekId);
  const record = index >= 0 ? weeks[index]! : emptyWeekRecord(weekId);
  const closed = closeWeekRecord(record);

  if (index >= 0) {
    weeks[index] = closed;
  } else {
    weeks.unshift(closed);
  }

  writeAllWeeks(weeks);
  return closed.winners;
}

export function resetFeaturedPlacementAuctionForTests(): void {
  cachedStatus = null;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getFeaturedAuctionSnapshot(): FeaturedAuctionStatus {
  if (!cachedStatus) {
    cachedStatus = readFeaturedAuctionStatus();
  }

  return cachedStatus;
}

export function useFeaturedPlacementAuctionStatus(): FeaturedAuctionStatus {
  const status = useSyncExternalStore(
    subscribe,
    getFeaturedAuctionSnapshot,
    getFeaturedAuctionSnapshot
  );

  useEffect(() => {
    hydrateFeaturedAuctionStore();
  }, []);

  return status;
}

export function featuredAuctionClosesAtMs(now = new Date()): number {
  return getNextBoostCycleResetMs(now);
}