import { sendGameApprovalEmail } from './game-approval-email-store.js';
import { queueGameApprovalWelcome } from './game-approval-welcome-store.js';
import { releaseHiddenChannelEventsForChannel } from './events-store.js';
import { syncGameOwnerSessionFromTicket } from './game-owner-session-store.js';
import {
  gameSubmissionTicketById,
  updateGameSubmissionTicketStatus,
} from './game-submission-ticket-store.js';
import {
  approveSubmittedTicket,
  rejectSubmittedTicket,
} from './owner-submitted-tickets-store.js';

export type GameTicketOfficialReviewResult = {
  ok: boolean;
  message: string;
};

export function applyGameTicketOfficialReview(
  ticketId: string,
  status: 'approved' | 'rejected',
  reviewerOwner: string | null
): GameTicketOfficialReviewResult {
  const ticket = gameSubmissionTicketById(ticketId);

  if (!ticket) {
    return { ok: false, message: 'Game ticket not found.' };
  }

  if (ticket.status !== 'submitted' && ticket.status !== 'preapproved') {
    return { ok: false, message: 'Game ticket is no longer awaiting review.' };
  }

  const updated = updateGameSubmissionTicketStatus(
    ticketId,
    status,
    reviewerOwner ?? 'official-owner'
  );

  if (!updated) {
    return { ok: false, message: 'Could not update game ticket.' };
  }

  syncGameOwnerSessionFromTicket(ticketId);

  if (status === 'approved') {
    const released = releaseHiddenChannelEventsForChannel(updated.provisionalChannelId);
    const emailResult = sendGameApprovalEmail(updated);
    queueGameApprovalWelcome(updated.id);

    if (reviewerOwner) {
      approveSubmittedTicket(ticketId, reviewerOwner);
    }

    return {
      ok: true,
      message:
        updated.gameTitle +
        ' approved. ' +
        (emailResult.ok ? emailResult.message : emailResult.reason) +
        (released > 0 ? ' ' + released + ' hidden event draft(s) are now visible.' : ''),
    };
  }

  if (reviewerOwner) {
    rejectSubmittedTicket(ticketId, reviewerOwner);
  }

  return {
    ok: true,
    message: updated.gameTitle + ' rejected.',
  };
}