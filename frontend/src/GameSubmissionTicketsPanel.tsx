import { useMemo, useState, type ReactElement } from 'react';

import { applyGameTicketOfficialReview } from './game-ticket-official-review.js';
import { isOfficialOwner } from './nami-capabilities.js';
import {
  listGameSubmissionTicketsSorted,
  useGameSubmissionTickets,
} from './game-submission-ticket-store.js';
import { buildGameTicketPreviewFields } from './game-ticket-preview.js';
import { gameTrustScoreTierLabel } from './game-trust-score.js';
import { useProtocolOwner } from './wallet.js';

export function GameSubmissionTicketsPanel(props: { embedded?: boolean } = {}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const tickets = useGameSubmissionTickets();
  const [notice, setNotice] = useState<string | null>(null);

  const canReview = isOfficialOwner(owner);
  const sortedTickets = useMemo(() => listGameSubmissionTicketsSorted(), [tickets]);

  if (!canReview) {
    return null;
  }

  function handleOfficialReview(ticketId: string, status: 'approved' | 'rejected'): void {
    const result = applyGameTicketOfficialReview(ticketId, status, owner);

    if (!result.ok) {
      setNotice(result.message);
      return;
    }

    setNotice(result.message);
  }

  const content = (
    <>
      {!props.embedded ? (
        <div className="profile-panel-heading">
          <h2>Submitted game tickets</h2>
          <p>
            Official owner review queue sorted by Trust Score. Channel claims and new game tickets
            both require your approval before keys hand over.
          </p>
        </div>
      ) : null}

      {notice ? <p className="protocol-hint">{notice}</p> : null}

      {sortedTickets.length === 0 ? (
        <p className="protocol-hint">No game tickets submitted yet.</p>
      ) : (
        <ol className="game-submission-ticket-list">
          {sortedTickets.map((ticket, index) => (
            <li className="game-submission-ticket-card" key={ticket.id}>
              <div className="game-submission-ticket-rank">#{index + 1}</div>
              <div className="game-submission-ticket-copy">
                <strong>
                  {ticket.ticketKind === 'channel-claim' ? 'Claim: ' : ''}
                  {ticket.gameTitle}
                </strong>
                {ticket.ticketKind === 'channel-claim' ? (
                  <span className="mini-badge">Channel claim</span>
                ) : null}
                <dl className="onboarding-preview-details game-submission-ticket-details">
                  {buildGameTicketPreviewFields({
                    gameTitle: ticket.gameTitle,
                    studioName: ticket.studioName,
                    contactName: ticket.contactName,
                    email: ticket.email,
                    genres: ticket.genres,
                    platforms: ticket.platforms,
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
                  {ticket.claimProofNotes ? (
                    <div className="onboarding-preview-detail-row">
                      <dt>Ownership proof</dt>
                      <dd>{ticket.claimProofNotes}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
              <div className="game-submission-ticket-score">
                <strong>{ticket.trustScore}%</strong>
                <span>{gameTrustScoreTierLabel(ticket.trustScoreTier)}</span>
                <span className={'game-submission-ticket-status is-' + ticket.status}>{ticket.status}</span>
              </div>
              <div className="game-submission-ticket-actions">
                {ticket.status !== 'approved' ? (
                  <button
                    className="primary-action"
                    onClick={() => handleOfficialReview(ticket.id, 'approved')}
                    type="button"
                  >
                    Approve
                  </button>
                ) : null}
                {ticket.status !== 'rejected' ? (
                  <button
                    className="secondary-action"
                    onClick={() => handleOfficialReview(ticket.id, 'rejected')}
                    type="button"
                  >
                    Disapprove
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );

  if (props.embedded) {
    return <div className="nami-officials-submission-tab-panel game-submission-tickets-panel">{content}</div>;
  }

  return <article className="panel settings-card game-submission-tickets-panel">{content}</article>;
}