import { useSyncExternalStore } from 'react';

const COMMENTS_KEY = 'nami.channel-game-review-comments';

let cachedComments: ChannelGameReviewComment[] | null = null;

export type ChannelGameReviewComment = {
  id: string;
  reviewId: string;
  channelId: string;
  authorMemberId: string;
  authorName: string;
  body: string;
  createdAtLabel: string;
};

function invalidateCommentsCache(): void {
  cachedComments = null;
}

function readComments(): ChannelGameReviewComment[] {
  if (cachedComments) {
    return cachedComments;
  }

  try {
    const stored = window.localStorage.getItem(COMMENTS_KEY);

    if (!stored) {
      cachedComments = [];
      return cachedComments;
    }

    const parsed = JSON.parse(stored);

    cachedComments = Array.isArray(parsed) ? (parsed as ChannelGameReviewComment[]) : [];
    return cachedComments;
  } catch {
    cachedComments = [];
    return cachedComments;
  }
}

function writeComments(comments: ChannelGameReviewComment[]): void {
  window.localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  invalidateCommentsCache();
  window.dispatchEvent(new CustomEvent('nami-channel-game-review-comments-changed'));
}

export function getCommentsForReview(reviewId: string): ChannelGameReviewComment[] {
  return readComments().filter((comment) => comment.reviewId === reviewId);
}

export function submitChannelOwnerReviewComment(input: {
  reviewId: string;
  channelId: string;
  authorMemberId: string;
  authorName: string;
  body: string;
}): { ok: true; comment: ChannelGameReviewComment } | { ok: false; reason: string } {
  const body = input.body.trim();

  if (!body) {
    return { ok: false, reason: 'Add a comment before posting.' };
  }

  const comment: ChannelGameReviewComment = {
    id: 'review-comment-' + input.reviewId + '-' + Date.now().toString(36),
    reviewId: input.reviewId,
    channelId: input.channelId,
    authorMemberId: input.authorMemberId,
    authorName: input.authorName,
    body,
    createdAtLabel: 'Commented just now',
  };

  writeComments([comment, ...readComments()]);

  return { ok: true, comment };
}

function subscribe(listener: () => void): () => void {
  window.addEventListener('nami-channel-game-review-comments-changed', listener);

  return () => {
    window.removeEventListener('nami-channel-game-review-comments-changed', listener);
  };
}

function getCommentsSnapshot(): ChannelGameReviewComment[] {
  return readComments();
}

export function useChannelGameReviewComments(): ChannelGameReviewComment[] {
  return useSyncExternalStore(subscribe, getCommentsSnapshot, getCommentsSnapshot);
}