import { sendGameApprovalEmail } from './game-approval-email-store.js';
import { queueGameApprovalWelcome } from './game-approval-welcome-store.js';
import { releaseHiddenChannelEventsForChannel } from './events-store.js';
import {
  gameSubmissionTicketById,
  isChannelClaimTicket,
  resolveGameTicketChannelId,
  updateGameSubmissionTicketStatus,
} from './game-submission-ticket-store.js';
import { canReviewNodenameClaims } from './nami-capabilities.js';
import {
  markOwnerProvisionedChannelClaimed,
  markOwnerProvisionedChannelClaimRejected,
} from './owner-provisioned-channels-store.js';
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
  if (!canReviewNodenameClaims(reviewerOwner)) {
    return { ok: false, message: 'Only the Nami official owner can review game tickets.' };
  }

  const ticket = gameSubmissionTicketById(ticketId);

  if (!ticket) {
    return { ok: false, message: 'Game ticket not found.' };
  }

  if (ticket.status !== 'submitted' && ticket.status !== 'preapproved') {
    return { ok: false, message: 'Game ticket is no longer awaiting review.' };
  }

  const channelId = resolveGameTicketChannelId(ticket);
  const isClaim = isChannelClaimTicket(ticket);

  const updated = updateGameSubmissionTicketStatus(
    ticketId,
    status,
    reviewerOwner ?? 'official-owner'
  );

  if (!updated) {
    return { ok: false, message: 'Could not update game ticket.' };
  }

  if (status === 'rejected' && isClaim) {
    markOwnerProvisionedChannelClaimRejected(channelId);
  }

  if (status === 'approved' && isClaim) {
    markOwnerProvisionedChannelClaimed(channelId, ticketId);
  }

  if (status === 'approved') {
    const released = releaseHiddenChannelEventsForChannel(channelId);
    const emailResult = sendGameApprovalEmail(updated);
    queueGameApprovalWelcome(updated.id);

    if (reviewerOwner) {
      approveSubmittedTicket(ticketId, reviewerOwner);
    }

    const claimSuffix = isClaim ? ' Channel keys will hand over after the claimant syncs.' : '';

    return {
      ok: true,
      message:
        updated.gameTitle +
        (isClaim ? ' claim' : '') +
        ' approved. ' +
        (emailResult.ok ? emailResult.message : emailResult.reason) +
        (released > 0 ? ' ' + released + ' hidden event draft(s) are now visible.' : '') +
        claimSuffix,
    };
  }

  if (reviewerOwner) {
    rejectSubmittedTicket(ticketId, reviewerOwner);
  }

  return {
    ok: true,
    message: updated.gameTitle + (isClaim ? ' claim' : '') + ' rejected.',
  };
}