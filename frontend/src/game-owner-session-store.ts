import { useSyncExternalStore } from 'react';

import type { GameOfficialSocialPlatform } from './game-onboarding-draft.js';
import { formatGameGenresForDisplay } from './game-genres.js';
import type { GameTrustScoreTier } from './game-trust-score.js';
import {
  gameSubmissionTicketById,
  type GameSubmissionTicketStatus,
} from './game-submission-ticket-store.js';

const SESSION_KEY = 'nami.game.owner.session';

export type GameOwnerSession = {
  ticketId: string;
  provisionalChannelId: string;
  gameTitle: string;
  studioName: string;
  contactName: string;
  email: string;
  phone: string;
  tagline: string;
  genre: string;
  officialSocialPlatform: GameOfficialSocialPlatform;
  officialSocialHandle: string;
  officialSocialVerified: boolean;
  walletAddress: string | null;
  trustScore: number;
  trustScoreTier: GameTrustScoreTier;
  approvalStatus: GameSubmissionTicketStatus;
  questionnaireStarted: boolean;
  questionnaireComplete: boolean;
  submittedAtMs: number;
};

let cachedSession: GameOwnerSession | null | undefined;

function invalidateCache(): void {
  cachedSession = undefined;
}

function emitChange(): void {
  invalidateCache();
  window.dispatchEvent(new CustomEvent('nami-game-owner-session-changed'));
}

export function readGameOwnerSession(): GameOwnerSession | null {
  if (cachedSession !== undefined) {
    return cachedSession;
  }

  try {
    const stored = window.localStorage.getItem(SESSION_KEY);

    if (!stored) {
      cachedSession = null;
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<GameOwnerSession>;

    if (typeof parsed.ticketId !== 'string' || typeof parsed.provisionalChannelId !== 'string') {
      cachedSession = null;
      return null;
    }

    cachedSession = {
      ticketId: parsed.ticketId,
      provisionalChannelId: parsed.provisionalChannelId,
      gameTitle: typeof parsed.gameTitle === 'string' ? parsed.gameTitle : 'Pending Game',
      studioName: typeof parsed.studioName === 'string' ? parsed.studioName : '',
      contactName: typeof parsed.contactName === 'string' ? parsed.contactName : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      tagline: typeof parsed.tagline === 'string' ? parsed.tagline : 'Pre-approved game channel — hidden until full approval.',
      genre: typeof parsed.genre === 'string' ? parsed.genre : 'Indie',
      officialSocialPlatform:
        parsed.officialSocialPlatform === 'x' || parsed.officialSocialPlatform === 'twitch'
          ? parsed.officialSocialPlatform
          : 'x',
      officialSocialHandle:
        typeof parsed.officialSocialHandle === 'string' ? parsed.officialSocialHandle : '',
      officialSocialVerified: parsed.officialSocialVerified === true,
      walletAddress: typeof parsed.walletAddress === 'string' ? parsed.walletAddress : null,
      trustScore: typeof parsed.trustScore === 'number' ? parsed.trustScore : 0,
      trustScoreTier:
        parsed.trustScoreTier === 'basic' ||
        parsed.trustScoreTier === 'verified' ||
        parsed.trustScoreTier === 'premium'
          ? parsed.trustScoreTier
          : 'basic',
      approvalStatus:
        parsed.approvalStatus === 'submitted' ||
        parsed.approvalStatus === 'preapproved' ||
        parsed.approvalStatus === 'approved' ||
        parsed.approvalStatus === 'rejected'
          ? parsed.approvalStatus
          : 'submitted',
      questionnaireStarted: parsed.questionnaireStarted === true,
      questionnaireComplete: parsed.questionnaireComplete === true,
      submittedAtMs: typeof parsed.submittedAtMs === 'number' ? parsed.submittedAtMs : Date.now(),
    };

    return cachedSession;
  } catch {
    cachedSession = null;
    return null;
  }
}

export function saveGameOwnerSession(session: GameOwnerSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  emitChange();
}

export function clearGameOwnerSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
  emitChange();
}

export function syncGameOwnerSessionFromTicket(ticketId: string): GameOwnerSession | null {
  const ticket = gameSubmissionTicketById(ticketId);

  if (!ticket) {
    return null;
  }

  const existing = readGameOwnerSession();

  const session: GameOwnerSession = {
    ticketId: ticket.id,
    provisionalChannelId: ticket.provisionalChannelId,
    gameTitle: ticket.gameTitle,
    studioName: ticket.studioName,
    contactName: ticket.contactName,
    email: ticket.email,
    phone: '',
    tagline: existing?.tagline ?? 'Pre-approved game channel — hidden until full approval.',
    genre: formatGameGenresForDisplay(ticket.genres) || existing?.genre || 'Indie',
    officialSocialPlatform: ticket.officialSocialPlatform,
    officialSocialHandle: ticket.officialSocialHandle,
    officialSocialVerified: ticket.officialSocialVerified,
    walletAddress: ticket.walletAddress,
    trustScore: ticket.trustScore,
    trustScoreTier: ticket.trustScoreTier,
    approvalStatus: ticket.status,
    questionnaireStarted: ticket.questionnaireStarted,
    questionnaireComplete: existing?.questionnaireComplete ?? false,
    submittedAtMs: ticket.submittedAtMs,
  };

  saveGameOwnerSession(session);

  return session;
}

export function hasActiveGameOwnerSession(): boolean {
  return readGameOwnerSession() !== null;
}

export function isPreApprovedGameOwner(): boolean {
  const session = readGameOwnerSession();

  if (!session) {
    return false;
  }

  return session.approvalStatus === 'preapproved';
}

export function isFullyApprovedGameOwner(): boolean {
  const session = readGameOwnerSession();

  return session?.approvalStatus === 'approved';
}

export function markGameOwnerQuestionnaireComplete(): void {
  const session = readGameOwnerSession();

  if (!session) {
    return;
  }

  saveGameOwnerSession({
    ...session,
    questionnaireStarted: true,
    questionnaireComplete: true,
  });
}

export function canEnterNamiAsGameOwner(): boolean {
  const session = readGameOwnerSession();

  if (!session) {
    return false;
  }

  return session.approvalStatus === 'preapproved' || session.approvalStatus === 'approved';
}

export function useGameOwnerSession(): GameOwnerSession | null {
  return useSyncExternalStore(
    (onStoreChange) => {
      function handleChange(): void {
        invalidateCache();
        onStoreChange();
      }

      window.addEventListener('nami-game-owner-session-changed', handleChange);

      return () => {
        window.removeEventListener('nami-game-owner-session-changed', handleChange);
      };
    },
    readGameOwnerSession,
    readGameOwnerSession,
  );
}