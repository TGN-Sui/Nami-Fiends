import { useSyncExternalStore } from 'react';

import { hasChannelGameBadge, readMemberChannelBadgeLabel } from './channel-game-badge-store.js';
import { isGameChannelOwner } from './channel-owner-access.js';
import { isMemberVerified } from './member-access.js';
import { members, type NamiMember } from './uiMockData.js';

const REVIEWS_KEY = 'nami.channel-game-reviews';

let cachedReviews: ChannelGameReview[] | null = null;

function invalidateChannelGameReviewsCache(): void {
  cachedReviews = null;
}

export type ChannelGameReview = {
  id: string;
  channelId: string;
  memberId: string;
  memberName: string;
  rating: number;
  title: string;
  body: string;
  badgeLabel: string;
  createdAtLabel: string;
};

export type SubmitChannelGameReviewInput = {
  channelId: string;
  member: NamiMember;
  rating: number;
  title: string;
  body: string;
};

export type SubmitChannelGameReviewResult =
  | { ok: true; review: ChannelGameReview }
  | { ok: false; reason: 'not-verified' | 'missing-badge' | 'already-reviewed' | 'invalid-rating' | 'empty-content' };

const defaultReviews: ChannelGameReview[] = [
  {
    id: 'review-fiends-m8',
    channelId: 'fiends',
    memberId: 'm8',
    memberName: 'StormRelay',
    rating: 5,
    title: 'Best squad hangout on Nami',
    body:
      'The channel keeps events, news, and chat separated so it never feels chaotic. Badge holders get real signal in reviews instead of drive-by spam.',
    badgeLabel: 'Event Regular',
    createdAtLabel: 'Reviewed 3 days ago',
  },
  {
    id: 'review-fiends-m6',
    channelId: 'fiends',
    memberId: 'm6',
    memberName: 'KiteVoyager',
    rating: 4,
    title: 'Solid community rhythm',
    body:
      'Raids are easy to coordinate and the profile tabs make it obvious where official info lives. Would love more cross-guild scheduling tools.',
    badgeLabel: 'Guild Ally',
    createdAtLabel: 'Reviewed 1 week ago',
  },
  {
    id: 'review-fiends-m10',
    channelId: 'fiends',
    memberId: 'm10',
    memberName: 'NexusPilot',
    rating: 5,
    title: 'Feels like a real game home',
    body:
      'Owning a Founder Room badge makes the review wall meaningful. You can tell the notes come from people who actually play here.',
    badgeLabel: 'Founder Room',
    createdAtLabel: 'Reviewed 2 weeks ago',
  },
];

function isValidReview(entry: unknown): entry is ChannelGameReview {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  const review = entry as Partial<ChannelGameReview>;

  return (
    typeof review.id === 'string' &&
    typeof review.channelId === 'string' &&
    typeof review.memberId === 'string' &&
    typeof review.memberName === 'string' &&
    typeof review.rating === 'number' &&
    typeof review.title === 'string' &&
    typeof review.body === 'string' &&
    typeof review.badgeLabel === 'string' &&
    typeof review.createdAtLabel === 'string'
  );
}

export function readChannelGameReviews(): ChannelGameReview[] {
  if (cachedReviews) {
    return cachedReviews;
  }

  try {
    const stored = window.localStorage.getItem(REVIEWS_KEY);

    if (!stored) {
      cachedReviews = [...defaultReviews];
      return cachedReviews;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      cachedReviews = [...defaultReviews];
      return cachedReviews;
    }

    cachedReviews = parsed.filter(isValidReview);
    return cachedReviews;
  } catch {
    cachedReviews = [...defaultReviews];
    return cachedReviews;
  }
}

export function saveChannelGameReviews(reviews: ChannelGameReview[]): void {
  window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  invalidateChannelGameReviewsCache();
  window.dispatchEvent(new CustomEvent('nami-channel-game-reviews-changed'));
}

export function getChannelGameReviews(channelId: string): ChannelGameReview[] {
  return readChannelGameReviews()
    .filter((review) => review.channelId === channelId)
    .sort((left, right) => right.rating - left.rating || left.memberName.localeCompare(right.memberName));
}

export function hasMemberReviewedChannel(memberId: string, channelId: string): boolean {
  return readChannelGameReviews().some(
    (review) => review.memberId === memberId && review.channelId === channelId,
  );
}

export function canSubmitChannelGameReview(member: NamiMember, channelId: string): boolean {
  if (isGameChannelOwner()) {
    return false;
  }

  return isMemberVerified(member) && hasChannelGameBadge(member.id, channelId) && !hasMemberReviewedChannel(member.id, channelId);
}

export function getChannelGameReviewEligibility(
  member: NamiMember,
  channelId: string,
): 'eligible' | 'not-verified' | 'missing-badge' | 'already-reviewed' {
  if (!isMemberVerified(member)) {
    return 'not-verified';
  }

  if (!hasChannelGameBadge(member.id, channelId)) {
    return 'missing-badge';
  }

  if (hasMemberReviewedChannel(member.id, channelId)) {
    return 'already-reviewed';
  }

  return 'eligible';
}

export function submitChannelGameReview(input: SubmitChannelGameReviewInput): SubmitChannelGameReviewResult {
  const title = input.title.trim();
  const body = input.body.trim();
  const rating = Math.round(input.rating);

  if (!isMemberVerified(input.member)) {
    return { ok: false, reason: 'not-verified' };
  }

  if (!hasChannelGameBadge(input.member.id, input.channelId)) {
    return { ok: false, reason: 'missing-badge' };
  }

  if (hasMemberReviewedChannel(input.member.id, input.channelId)) {
    return { ok: false, reason: 'already-reviewed' };
  }

  if (rating < 1 || rating > 5) {
    return { ok: false, reason: 'invalid-rating' };
  }

  if (!title || !body) {
    return { ok: false, reason: 'empty-content' };
  }

  const badgeLabel = readMemberChannelBadgeLabel(input.member.id, input.channelId) ?? 'Channel Badge';

  const review: ChannelGameReview = {
    id: 'review-' + input.channelId + '-' + input.member.id + '-' + Date.now().toString(36),
    channelId: input.channelId,
    memberId: input.member.id,
    memberName: input.member.name,
    rating,
    title,
    body,
    badgeLabel,
    createdAtLabel: 'Reviewed just now',
  };

  saveChannelGameReviews([review, ...readChannelGameReviews()]);
  return { ok: true, review };
}

function subscribeToStore(listener: () => void): () => void {
  function onChange(): void {
    invalidateChannelGameReviewsCache();
    listener();
  }

  window.addEventListener('nami-channel-game-reviews-changed', onChange);
  window.addEventListener('nami-channel-game-badges-changed', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nami-channel-game-reviews-changed', onChange);
    window.removeEventListener('nami-channel-game-badges-changed', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useChannelGameReviewsStore(): ChannelGameReview[] {
  return useSyncExternalStore(subscribeToStore, readChannelGameReviews, readChannelGameReviews);
}

export function averageChannelGameReviewRating(channelId: string): number | null {
  const reviews = getChannelGameReviews(channelId);

  if (reviews.length === 0) {
    return null;
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);

  return Math.round((total / reviews.length) * 10) / 10;
}

export function memberById(memberId: string): NamiMember | undefined {
  return members.find((member) => member.id === memberId);
}