import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PartnerCarouselTicket } from './channel-owner-promotions-store.js';
import {
  countPendingPartnerBannerSubmissions,
  resetPartnerBannerSubmissionsStoreForTests,
  upsertPartnerBannerSubmission,
  updatePartnerBannerSubmissionStatus,
} from './partner-banner-submission-store.js';

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

const sampleTicket: PartnerCarouselTicket = {
  id: 'partner-ticket-fiends',
  channelId: 'fiends',
  coverUrl: 'data:image/png;base64,abc',
  title: 'Night Raid Weekend',
  description: 'Featured partner carousel placement.',
  duration: '72h',
  status: 'submitted',
  submittedAtMs: Date.now(),
  expiresAtMs: null,
  updatedAtMs: Date.now(),
};

describe('partner-banner-submission-store', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      localStorage: createLocalStorageMock(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetPartnerBannerSubmissionsStoreForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('queues submitted partner banner tickets for officials', () => {
    upsertPartnerBannerSubmission(sampleTicket);

    expect(countPendingPartnerBannerSubmissions()).toBe(1);
  });

  it('lets officials approve partner banner submissions', () => {
    const submission = upsertPartnerBannerSubmission(sampleTicket);
    const updated = updatePartnerBannerSubmissionStatus(submission.id, 'approved', 'nami-official');

    expect(updated?.status).toBe('approved');
    expect(updated?.expiresAtMs).not.toBeNull();
    expect(countPendingPartnerBannerSubmissions()).toBe(0);
  });
});