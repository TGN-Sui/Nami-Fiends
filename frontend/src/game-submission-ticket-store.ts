import { useSyncExternalStore } from 'react';

import { gameTrustScoreTierLabel } from './game-trust-score.js';
import type { GameOfficialSocialPlatform } from './game-onboarding-draft.js';
import { enqueueSubmittedTicket } from './owner-submitted-tickets-store.js';
import { createEmptyGameStoreUrls } from './game-genres.js';
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
  genres: string[];
  websiteUrl: string;
  steamStoreUrl: string;
  epicStoreUrl: string;
  xboxStoreUrl: string;
  playstationStoreUrl: string;
  otherStoreUrl: string;
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

type LegacyGameSubmissionTicket = GameSubmissionTicket & { storePageUrl?: string };

let cachedTickets: GameSubmissionTicket[] | undefined;

function invalidateCache(): void {
  cachedTickets = undefined;
}

function emitChange(): void {
  invalidateCache();
  window.dispatchEvent(new CustomEvent('nami-game-submission-tickets-changed'));
}

function normalizeTicket(entry: LegacyGameSubmissionTicket): GameSubmissionTicket {
  const emptyStoreUrls = createEmptyGameStoreUrls();

  if (typeof entry.steamStoreUrl === 'string') {
    emptyStoreUrls.steamStoreUrl = entry.steamStoreUrl;
  }

  if (typeof entry.epicStoreUrl === 'string') {
    emptyStoreUrls.epicStoreUrl = entry.epicStoreUrl;
  }

  if (typeof entry.xboxStoreUrl === 'string') {
    emptyStoreUrls.xboxStoreUrl = entry.xboxStoreUrl;
  }

  if (typeof entry.playstationStoreUrl === 'string') {
    emptyStoreUrls.playstationStoreUrl = entry.playstationStoreUrl;
  }

  if (typeof entry.otherStoreUrl === 'string') {
    emptyStoreUrls.otherStoreUrl = entry.otherStoreUrl;
  }

  if (
    emptyStoreUrls.steamStoreUrl === '' &&
    typeof entry.storePageUrl === 'string' &&
    entry.storePageUrl.trim() !== ''
  ) {
    emptyStoreUrls.steamStoreUrl = entry.storePageUrl;
  }

  return {
    id: entry.id,
    gameTitle: entry.gameTitle,
    studioName: entry.studioName,
    contactName: entry.contactName,
    email: entry.email,
    phone: entry.phone,
    genres: Array.isArray(entry.genres)
      ? entry.genres.filter((genre): genre is string => typeof genre === 'string')
      : [],
    websiteUrl: typeof entry.websiteUrl === 'string' ? entry.websiteUrl : '',
    ...emptyStoreUrls,
    trailerUrl: typeof entry.trailerUrl === 'string' ? entry.trailerUrl : '',
    officialSocialPlatform: entry.officialSocialPlatform,
    officialSocialHandle: entry.officialSocialHandle,
    officialSocialVerified: entry.officialSocialVerified === true,
    walletAddress: entry.walletAddress,
    provisionalChannelId: entry.provisionalChannelId,
    trustScore: entry.trustScore,
    trustScoreTier: entry.trustScoreTier,
    status: entry.status,
    questionnaireEligible: entry.questionnaireEligible === true,
    questionnaireStarted: entry.questionnaireStarted === true,
    submittedAtMs: entry.submittedAtMs,
    ...(typeof entry.reviewedAtMs === 'number' ? { reviewedAtMs: entry.reviewedAtMs } : {}),
    ...(typeof entry.reviewedBy === 'string' ? { reviewedBy: entry.reviewedBy } : {}),
  };
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

    const parsed = JSON.parse(stored) as LegacyGameSubmissionTicket[];
    cachedTickets = Array.isArray(parsed) ? parsed.map(normalizeTicket) : [];
    return cachedTickets;
  } catch {
    cachedTickets = [];
    return cachedTickets;
  }
}

function writeTickets(tickets: GameSubmissionTicket[]): void {
  const next = tickets.slice(0, 200);
  window.localStorage.setItem(TICKETS_KEY, JSON.stringify(next));
  emitChange();
  void import('./officials-submissions-sync.js').then(({ syncGameTicketsToServer }) => {
    syncGameTicketsToServer(next);
  });
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

  if (ticket.status === 'submitted' || ticket.status === 'preapproved') {
    enqueueSubmittedTicket({
      id: ticket.id,
      kind: 'game-ticket',
      title: ticket.gameTitle,
      description: ticket.studioName + ' · ' + ticket.email,
      channelId: ticket.provisionalChannelId,
      coverUrl: null,
      duration: null,
      submitterLabel: ticket.contactName,
      submitterDetail:
        ticket.trustScore + '% · ' + gameTrustScoreTierLabel(ticket.trustScoreTier),
      referenceId: ticket.id,
      submittedAtMs: ticket.submittedAtMs,
    });
  }
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