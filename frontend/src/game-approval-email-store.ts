import { shouldUseDevFixtures } from './app-config.js';
import type { GameSubmissionTicket } from './game-submission-ticket-store.js';

const STORAGE_KEY = 'nami.game.approval-emails';

export type GameApprovalEmailRecord = {
  ticketId: string;
  email: string;
  gameTitle: string;
  sentAtMs: number;
  message: string;
};

export type GameApprovalEmailResult =
  | { ok: true; message: string; record: GameApprovalEmailRecord }
  | { ok: false; reason: string };

function readSentEmails(): GameApprovalEmailRecord[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as GameApprovalEmailRecord[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSentEmails(records: GameApprovalEmailRecord[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 100)));
}

export function readGameApprovalEmailForTicket(ticketId: string): GameApprovalEmailRecord | null {
  return readSentEmails().find((record) => record.ticketId === ticketId) ?? null;
}

export function sendGameApprovalEmail(ticket: GameSubmissionTicket): GameApprovalEmailResult {
  const email = ticket.email.trim().toLowerCase();

  if (email.length === 0) {
    return {
      ok: false,
      reason: 'No studio email on file for this ticket. Approval email was not sent.',
    };
  }

  const existing = readGameApprovalEmailForTicket(ticket.id);

  if (existing) {
    return {
      ok: true,
      message: 'Approval email already sent to ' + email + '.',
      record: existing,
    };
  }

  const record: GameApprovalEmailRecord = {
    ticketId: ticket.id,
    email,
    gameTitle: ticket.gameTitle,
    sentAtMs: Date.now(),
    message:
      'Your game "' +
      ticket.gameTitle +
      '" was approved on Nami. Enter Nami to finish your badge questionnaire and publish your channel.',
  };

  writeSentEmails([record, ...readSentEmails()]);

  const devNote = shouldUseDevFixtures()
    ? ' (simulated locally — live delivery ships with the approval mailer).'
    : '';

  return {
    ok: true,
    message: 'Approval email sent to ' + email + '.' + devNote,
    record,
  };
}