import { useSyncExternalStore } from 'react';

import type { GameOfficialSocialPlatform } from './game-onboarding-draft.js';
import type { GameTrustScoreTier } from './game-trust-score.js';

const TICKETS_KEY = 'nami.game.submission.tickets';

export type GameSubmissionTicketStatus = 'submitted' | 'preapproved' | 'approved' | 'rejected';

export type GameSubmissionTicket = {
  id: string;
  gameTitle: string;
  studioName: string;
  contactName: string;
  email: string;
  phone: string;
  websiteUrl: string;
  storePageUrl: string;
  trailerUrl: string;
  officialSocialPlatform: GameOfficialSocialPlatform;
  officialSocialHandle: string;
  officialSocialVerified: boolean;
  walletAddress: string | null;
  provisionalChannelId: string;
  trustScore: number;
  trustScoreTier: GameTrustScoreTier;
  status: GameSubmissionTicketStatus;
  questionnaireEligible: boolean;
  questionnaireStarted: boolean;
  submittedAtMs: number;
  reviewedAtMs?: number;
  reviewedBy?: string;
};

let cachedTickets: GameSubmissionTicket[] | undefined;

function invalidateCache(): void {
  cachedTickets = undefined;
}

function emitChange(): void {
  invalidateCache();
  window.dispatchEvent(new CustomEvent('nami-game-submission-tickets-changed'));
}

function readTickets(): GameSubmissionTicket[] {
  if (cachedTickets) {
    return cachedTickets;
  }

  try {
    const stored = window.localStorage.getItem(TICKETS_KEY);

    if (!stored) {
      cachedTickets = [];
      return cachedTickets;
    }

    const parsed = JSON.parse(stored) as GameSubmissionTicket[];
    cachedTickets = Array.isArray(parsed) ? parsed : [];
    return cachedTickets;
  } catch {
    cachedTickets = [];
    return cachedTickets;
  }
}

function writeTickets(tickets: GameSubmissionTicket[]): void {
  window.localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets.slice(0, 200)));
  emitChange();
}

function subscribe(onStoreChange: () => void): () => void {
  function handleChange(): void {
    onStoreChange();
  }

  window.addEventListener('nami-game-submission-tickets-changed', handleChange);

  return () => {
    window.removeEventListener('nami-game-submission-tickets-changed', handleChange);
  };
}

export function useGameSubmissionTickets(): GameSubmissionTicket[] {
  return useSyncExternalStore(subscribe, readTickets, readTickets);
}

export function listGameSubmissionTicketsSorted(): GameSubmissionTicket[] {
  return [...readTickets()].sort((left, right) => {
    if (right.trustScore !== left.trustScore) {
      return right.trustScore - left.trustScore;
    }

    return right.submittedAtMs - left.submittedAtMs;
  });
}

export function gameSubmissionTicketById(ticketId: string): GameSubmissionTicket | undefined {
  return readTickets().find((ticket) => ticket.id === ticketId);
}

export function gameSubmissionTicketByChannelId(channelId: string): GameSubmissionTicket | undefined {
  return readTickets().find((ticket) => ticket.provisionalChannelId === channelId);
}

export function isChannelHiddenFromPublic(channelId: string): boolean {
  const ticket = gameSubmissionTicketByChannelId(channelId);

  if (!ticket) {
    return false;
  }

  return ticket.status !== 'approved';
}

export function upsertGameSubmissionTicket(ticket: GameSubmissionTicket): void {
  const tickets = readTickets();
  const index = tickets.findIndex((entry) => entry.id === ticket.id);

  if (index >= 0) {
    tickets[index] = ticket;
  } else {
    tickets.unshift(ticket);
  }

  writeTickets(tickets);
}

/** Officials tickets never include the studio phone — it stays local for Trust Score only. */
export function buildOfficialGameSubmissionTicket(
  input: Omit<GameSubmissionTicket, 'phone'>,
): GameSubmissionTicket {
  return {
    ...input,
    phone: '',
  };
}

export function markGameSubmissionQuestionnaireComplete(
  ticketId: string,
  questionnaireAnswers: Record<string, string>,
): GameSubmissionTicket | null {
  const tickets = readTickets();
  const index = tickets.findIndex((entry) => entry.id === ticketId);

  if (index < 0) {
    return null;
  }

  const current = tickets[index]!;
  const next: GameSubmissionTicket = {
    ...current,
    questionnaireStarted: true,
    reviewedAtMs: current.reviewedAtMs ?? Date.now(),
  };

  tickets[index] = next;
  writeTickets(tickets);

  void questionnaireAnswers;

  return next;
}

export function updateGameSubmissionTicketStatus(
  ticketId: string,
  status: GameSubmissionTicketStatus,
  reviewedBy?: string,
): GameSubmissionTicket | null {
  const tickets = readTickets();
  const index = tickets.findIndex((entry) => entry.id === ticketId);

  if (index < 0) {
    return null;
  }

  const current = tickets[index]!;

  const next: GameSubmissionTicket = {
    ...current,
    status,
    reviewedAtMs: Date.now(),
    ...(reviewedBy ? { reviewedBy } : {}),
  };

  tickets[index] = next;
  writeTickets(tickets);

  return next;
}

export function createProvisionalChannelId(gameTitle: string): string {
  const slug = gameTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

  return 'pending-game-' + (slug || 'studio') + '-' + Date.now().toString(36);
}