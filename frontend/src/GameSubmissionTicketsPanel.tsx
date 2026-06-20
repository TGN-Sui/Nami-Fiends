import { useMemo, useState, type ReactElement } from 'react';

import { sendGameApprovalEmail } from './game-approval-email-store.js';
import { queueGameApprovalWelcome } from './game-approval-welcome-store.js';
import { releaseHiddenChannelEventsForChannel } from './events-store.js';
import { syncGameOwnerSessionFromTicket } from './game-owner-session-store.js';
import {
  listGameSubmissionTicketsSorted,
  updateGameSubmissionTicketStatus,
  useGameSubmissionTickets,
} from './game-submission-ticket-store.js';
import { buildGameTicketPreviewFields } from './game-ticket-preview.js';
import { gameTrustScoreTierLabel } from './game-trust-score.js';

export function GameSubmissionTicketsPanel(): ReactElement {
  const tickets = useGameSubmissionTickets();
  const [notice, setNotice] = useState<string | null>(null);

  const sortedTickets = useMemo(() => listGameSubmissionTicketsSorted(), [tickets]);

  function handleStatusChange(
    ticketId: string,
    status: 'preapproved' | 'approved' | 'rejected',
  ): void {
    const updated = updateGameSubmissionTicketStatus(ticketId, status, 'nami-official');

    if (!updated) {
      setNotice('Could not update ticket.');
      return;
    }

    syncGameOwnerSessionFromTicket(ticketId);

    if (status === 'approved') {
      const released = releaseHiddenChannelEventsForChannel(updated.provisionalChannelId);
      const emailResult = sendGameApprovalEmail(updated);
      queueGameApprovalWelcome(updated.id);
      setNotice(
        'Ticket ' +
          updated.gameTitle +
          ' marked approved. ' +
          (emailResult.ok ? emailResult.message : emailResult.reason) +
          (released > 0 ? ' ' + released + ' hidden event draft(s) are now visible.' : ''),
      );
      return;
    }

    setNotice('Ticket ' + updated.gameTitle + ' marked ' + status + '.');
  }

  return (
    <article className="panel settings-card game-submission-tickets-panel">
      <div className="profile-panel-heading">
        <h2>Submitted game tickets</h2>
        <p>
          Nami Officials review queue sorted by Trust Score. Higher scores appear first for faster
          approval.
        </p>
      </div>

      {notice ? <p className="protocol-hint">{notice}</p> : null}

      {sortedTickets.length === 0 ? (
        <p className="protocol-hint">No game tickets submitted yet.</p>
      ) : (
        <ol className="game-submission-ticket-list">
          {sortedTickets.map((ticket, index) => (
            <li className="game-submission-ticket-card" key={ticket.id}>
              <div className="game-submission-ticket-rank">#{index + 1}</div>
              <div className="game-submission-ticket-copy">
                <strong>{ticket.gameTitle}</strong>
                <dl className="onboarding-preview-details game-submission-ticket-details">
                  {buildGameTicketPreviewFields({
                    gameTitle: ticket.gameTitle,
                    studioName: ticket.studioName,
                    contactName: ticket.contactName,
                    email: ticket.email,
                    genres: ticket.genres,
                    websiteUrl: ticket.websiteUrl,
                    trailerUrl: ticket.trailerUrl,
                    steamStoreUrl: ticket.steamStoreUrl,
                    epicStoreUrl: ticket.epicStoreUrl,
                    xboxStoreUrl: ticket.xboxStoreUrl,
                    playstationStoreUrl: ticket.playstationStoreUrl,
                    otherStoreUrl: ticket.otherStoreUrl,
                    officialSocialPlatform: ticket.officialSocialPlatform,
                    officialSocialHandle: ticket.officialSocialHandle,
                    officialSocialVerified: ticket.officialSocialVerified,
                  }).map((field) => (
                    <div className="onboarding-preview-detail-row" key={ticket.id + '-' + field.id}>
                      <dt>{field.label}</dt>
                      <dd>
                        {field.href ? (
                          <a href={field.href} rel="noreferrer" target="_blank">
                            {field.value}
                          </a>
                        ) : (
                          field.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="game-submission-ticket-score">
                <strong>{ticket.trustScore}%</strong>
                <span>{gameTrustScoreTierLabel(ticket.trustScoreTier)}</span>
                <span className={'game-submission-ticket-status is-' + ticket.status}>{ticket.status}</span>
              </div>
              <div className="game-submission-ticket-actions">
                {ticket.status !== 'preapproved' ? (
                  <button
                    className="secondary-action"
                    disabled={ticket.trustScore < 60}
                    onClick={() => handleStatusChange(ticket.id, 'preapproved')}
                    type="button"
                  >
                    Pre-approve
                  </button>
                ) : null}
                {ticket.status !== 'approved' ? (
                  <button
                    className="primary-action"
                    onClick={() => handleStatusChange(ticket.id, 'approved')}
                    type="button"
                  >
                    Approve
                  </button>
                ) : null}
                {ticket.status !== 'rejected' ? (
                  <button
                    className="secondary-action"
                    onClick={() => handleStatusChange(ticket.id, 'rejected')}
                    type="button"
                  >
                    Reject
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}