import { useSyncExternalStore } from 'react';

import {
  applyPartnerBannerOfficialReview,
  type PartnerCarouselTicket,
  type PromotionDuration,
} from './channel-owner-promotions-store.js';
import { readGameOwnerSession } from './game-owner-session-store.js';
import { channels } from './uiMockData.js';

const SUBMISSIONS_KEY = 'nami.partner.banner.submissions';

export type PartnerBannerSubmissionStatus = 'submitted' | 'approved' | 'rejected';

export type PartnerBannerSubmission = {
  id: string;
  channelId: string;
  channelTitle: string;
  coverUrl: string;
  title: string;
  description: string;
  duration: PromotionDuration;
  status: PartnerBannerSubmissionStatus;
  submittedAtMs: number;
  reviewedAtMs?: number;
  reviewedBy?: string;
  expiresAtMs: number | null;
};

let cachedSubmissions: PartnerBannerSubmission[] | undefined;

function invalidateCache(): void {
  cachedSubmissions = undefined;
}

function emitChange(): void {
  invalidateCache();
  window.dispatchEvent(new CustomEvent('nami-partner-banner-submissions-changed'));
}

function resolveChannelTitle(channelId: string): string {
  const channel = channels.find((entry) => entry.id === channelId);

  if (channel) {
    return channel.name;
  }

  const session = readGameOwnerSession();

  if (session?.provisionalChannelId === channelId) {
    return session.gameTitle;
  }

  return channelId;
}

function readSubmissions(): PartnerBannerSubmission[] {
  if (cachedSubmissions) {
    return cachedSubmissions;
  }

  try {
    const stored = window.localStorage.getItem(SUBMISSIONS_KEY);

    if (!stored) {
      cachedSubmissions = [];
      return cachedSubmissions;
    }

    const parsed = JSON.parse(stored) as PartnerBannerSubmission[];
    cachedSubmissions = Array.isArray(parsed) ? parsed : [];
    return cachedSubmissions;
  } catch {
    cachedSubmissions = [];
    return cachedSubmissions;
  }
}

function writeSubmissions(submissions: PartnerBannerSubmission[]): void {
  window.localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions.slice(0, 200)));
  emitChange();
}

function subscribe(onStoreChange: () => void): () => void {
  function handleChange(): void {
    onStoreChange();
  }

  window.addEventListener('nami-partner-banner-submissions-changed', handleChange);

  return () => {
    window.removeEventListener('nami-partner-banner-submissions-changed', handleChange);
  };
}

export function usePartnerBannerSubmissions(): PartnerBannerSubmission[] {
  return useSyncExternalStore(subscribe, readSubmissions, readSubmissions);
}

export function listPartnerBannerSubmissionsSorted(): PartnerBannerSubmission[] {
  return [...readSubmissions()].sort((left, right) => right.submittedAtMs - left.submittedAtMs);
}

export function countPendingPartnerBannerSubmissions(): number {
  return readSubmissions().filter((entry) => entry.status === 'submitted').length;
}

export function resetPartnerBannerSubmissionsStoreForTests(): void {
  invalidateCache();

  try {
    window.localStorage.removeItem(SUBMISSIONS_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}

export function upsertPartnerBannerSubmission(ticket: PartnerCarouselTicket): PartnerBannerSubmission {
  const submissions = readSubmissions();
  const index = submissions.findIndex((entry) => entry.id === ticket.id);
  const submittedAtMs = ticket.submittedAtMs ?? Date.now();

  const next: PartnerBannerSubmission = {
    id: ticket.id,
    channelId: ticket.channelId,
    channelTitle: resolveChannelTitle(ticket.channelId),
    coverUrl: ticket.coverUrl,
    title: ticket.title,
    description: ticket.description,
    duration: ticket.duration,
    status:
      ticket.status === 'approved'
        ? 'approved'
        : ticket.status === 'rejected'
          ? 'rejected'
          : 'submitted',
    submittedAtMs,
    expiresAtMs: ticket.expiresAtMs,
    ...(index >= 0 && submissions[index]?.reviewedAtMs
      ? { reviewedAtMs: submissions[index]!.reviewedAtMs }
      : {}),
    ...(index >= 0 && submissions[index]?.reviewedBy
      ? { reviewedBy: submissions[index]!.reviewedBy }
      : {}),
  };

  if (index >= 0) {
    submissions[index] = next;
  } else {
    submissions.unshift(next);
  }

  writeSubmissions(submissions);

  return next;
}

function durationToMs(duration: PromotionDuration): number {
  if (duration === '24h') {
    return 24 * 60 * 60 * 1000;
  }

  if (duration === '72h') {
    return 72 * 60 * 60 * 1000;
  }

  return 7 * 24 * 60 * 60 * 1000;
}

export function updatePartnerBannerSubmissionStatus(
  submissionId: string,
  status: PartnerBannerSubmissionStatus,
  reviewedBy?: string,
): PartnerBannerSubmission | null {
  const submissions = readSubmissions();
  const index = submissions.findIndex((entry) => entry.id === submissionId);

  if (index < 0) {
    return null;
  }

  const current = submissions[index]!;
  const expiresAtMs =
    status === 'approved' ? Date.now() + durationToMs(current.duration) : current.expiresAtMs;

  const next: PartnerBannerSubmission = {
    ...current,
    status,
    reviewedAtMs: Date.now(),
    expiresAtMs,
    ...(reviewedBy ? { reviewedBy } : {}),
  };

  submissions[index] = next;
  writeSubmissions(submissions);

  if (status === 'approved' || status === 'rejected') {
    applyPartnerBannerOfficialReview(submissionId, status, expiresAtMs);
  }

  return next;
}

if (typeof window !== 'undefined') {
  window.addEventListener('nami-partner-banner-ticket-updated', (event) => {
    const ticket = (event as CustomEvent<PartnerCarouselTicket>).detail;

    if (!ticket || typeof ticket.id !== 'string') {
      return;
    }

    upsertPartnerBannerSubmission(ticket);
  });
}