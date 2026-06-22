import { useSyncExternalStore } from 'react';

import { canReviewNodenameClaims } from './nami-capabilities.js';
import type { PromotionDuration } from './channel-owner-promotions-store.js';

const STORAGE_KEY = 'nami.admin.submittedTickets';

export type SubmittedTicketKind =
  | 'partner-carousel'
  | 'nodename-claim'
  | 'game-ticket'
  | 'channel-claim';

export type SubmittedTicketStatus = 'submitted' | 'approved' | 'rejected';

export type SubmittedTicket = {
  id: string;
  kind: SubmittedTicketKind;
  status: SubmittedTicketStatus;
  title: string;
  description: string;
  channelId: string | null;
  coverUrl: string | null;
  duration: PromotionDuration | null;
  submitterLabel: string;
  submitterDetail: string | null;
  referenceId: string | null;
  submittedAtMs: number;
  reviewedAtMs: number | null;
  reviewedBy: string | null;
};

type SubmittedTicketsSnapshot = {
  tickets: SubmittedTicket[];
  openSubmittedCount: number;
};

let cachedSnapshot: SubmittedTicketsSnapshot | null = null;

function buildSnapshot(): SubmittedTicketsSnapshot {
  const tickets = readSubmittedTickets();

  return {
    tickets,
    openSubmittedCount: tickets.filter((ticket) => ticket.status === 'submitted').length,
  };
}

function getSnapshot(): SubmittedTicketsSnapshot {
  if (!cachedSnapshot) {
    cachedSnapshot = buildSnapshot();
  }

  return cachedSnapshot;
}

function invalidateSnapshot(): void {
  cachedSnapshot = null;
}

function dispatchChange(): void {
  invalidateSnapshot();
  window.dispatchEvent(new CustomEvent('nami-submitted-tickets-changed'));
}

function readJsonArray<T>(key: string): T[] {
  try {
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeTickets(tickets: SubmittedTicket[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  dispatchChange();
}

export function readSubmittedTickets(): SubmittedTicket[] {
  return readJsonArray<SubmittedTicket>(STORAGE_KEY);
}

export function readOpenSubmittedTickets(): SubmittedTicket[] {
  return readSubmittedTickets().filter((ticket) => ticket.status === 'submitted');
}

export function enqueueSubmittedTicket(
  ticket: Omit<SubmittedTicket, 'status' | 'reviewedAtMs' | 'reviewedBy'> & {
    status?: SubmittedTicketStatus;
  }
): SubmittedTicket {
  const nextTicket: SubmittedTicket = {
    ...ticket,
    status: ticket.status ?? 'submitted',
    reviewedAtMs: null,
    reviewedBy: null,
  };

  const tickets = readSubmittedTickets().filter((entry) => entry.id !== nextTicket.id);
  writeTickets([nextTicket, ...tickets]);

  return nextTicket;
}

export function approveSubmittedTicket(
  ticketId: string,
  reviewerOwner: string | null
): SubmittedTicket | null {
  if (!canReviewNodenameClaims(reviewerOwner)) {
    return null;
  }

  const now = Date.now();
  let approvedTicket: SubmittedTicket | null = null;

  const tickets = readSubmittedTickets().map((ticket) => {
    if (ticket.id !== ticketId || ticket.status !== 'submitted') {
      return ticket;
    }

    approvedTicket = {
      ...ticket,
      status: 'approved',
      reviewedAtMs: now,
      reviewedBy: reviewerOwner,
    };

    return approvedTicket;
  });

  if (!approvedTicket) {
    return null;
  }

  writeTickets(tickets);
  return approvedTicket;
}

export function rejectSubmittedTicket(
  ticketId: string,
  reviewerOwner: string | null
): SubmittedTicket | null {
  if (!canReviewNodenameClaims(reviewerOwner)) {
    return null;
  }

  const now = Date.now();
  let rejectedTicket: SubmittedTicket | null = null;

  const tickets = readSubmittedTickets().map((ticket) => {
    if (ticket.id !== ticketId || ticket.status !== 'submitted') {
      return ticket;
    }

    rejectedTicket = {
      ...ticket,
      status: 'rejected',
      reviewedAtMs: now,
      reviewedBy: reviewerOwner,
    };

    return rejectedTicket;
  });

  if (!rejectedTicket) {
    return null;
  }

  writeTickets(tickets);
  return rejectedTicket;
}

function subscribe(listener: () => void): () => void {
  function onChange(): void {
    invalidateSnapshot();
    listener();
  }

  window.addEventListener('nami-submitted-tickets-changed', onChange);

  return () => {
    window.removeEventListener('nami-submitted-tickets-changed', onChange);
  };
}

export function useSubmittedTickets(): SubmittedTicketsSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => ({
    tickets: [],
    openSubmittedCount: 0,
  }));
}

export function resetSubmittedTicketsForTests(): void {
  invalidateSnapshot();

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}