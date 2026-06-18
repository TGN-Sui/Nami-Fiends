import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSelfMember } from './member-access.js';
import { members } from './uiMockData.js';

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

import {
  canSubmitChannelGameReview,
  getChannelGameReviewEligibility,
  getChannelGameReviews,
  hasMemberReviewedChannel,
  readChannelGameReviews,
  submitChannelGameReview,
} from './channel-game-reviews-store.js';
import { grantChannelGameBadge, hasChannelGameBadge } from './channel-game-badge-store.js';

describe('channel-game-reviews-store', () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();

    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a stable cached snapshot for useSyncExternalStore', () => {
    const firstRead = readChannelGameReviews();
    const secondRead = readChannelGameReviews();

    expect(secondRead).toBe(firstRead);
  });

  it('seeds fiends reviews for badge-holding verified members', () => {
    const reviews = getChannelGameReviews('fiends');

    expect(reviews.length).toBeGreaterThanOrEqual(3);
    expect(reviews.every((review) => review.channelId === 'fiends')).toBe(true);
  });

  it('allows verified badge owners to submit one review', () => {
    const selfMember = getSelfMember();

    expect(hasChannelGameBadge(selfMember.id, 'fiends')).toBe(true);
    expect(canSubmitChannelGameReview(selfMember, 'fiends')).toBe(true);

    const result = submitChannelGameReview({
      channelId: 'fiends',
      member: selfMember,
      rating: 5,
      title: 'Great channel',
      body: 'Verified badge holders keep reviews trustworthy.',
    });

    expect(result.ok).toBe(true);
    expect(hasMemberReviewedChannel(selfMember.id, 'fiends')).toBe(true);
    expect(canSubmitChannelGameReview(selfMember, 'fiends')).toBe(false);
  });

  it('rejects unverified members even with a badge grant', () => {
    const npcMember = members.find((member) => member.id === 'm4')!;

    grantChannelGameBadge(npcMember.id, 'fiends', 'Founder Room');

    expect(getChannelGameReviewEligibility(npcMember, 'fiends')).toBe('not-verified');
    expect(
      submitChannelGameReview({
        channelId: 'fiends',
        member: npcMember,
        rating: 4,
        title: 'Spam attempt',
        body: 'Should not post.',
      }).ok,
    ).toBe(false);
  });

  it('rejects verified members without a channel badge', () => {
    const verifiedMember = members.find((member) => member.id === 'm18')!;

    expect(getChannelGameReviewEligibility(verifiedMember, 'fiends')).toBe('missing-badge');
  });
});