import { useMemo, useState, type ReactElement } from 'react';

import { PROMOTION_DURATION_LABELS } from './channel-owner-promotions-store.js';
import { applyGameTicketOfficialReview } from './game-ticket-official-review.js';
import { canReviewNodenameClaims } from './nami-capabilities.js';
import {
  approvePendingClaims,
  claimPreferredName,
  readOpenPendingClaims,
  rejectPendingClaims,
  useNamiAdminStore,
} from './nami-admin-store.js';
import {
  updatePartnerBannerSubmissionStatus,
  usePartnerBannerSubmissions,
} from './partner-banner-submission-store.js';
import {
  listGameSubmissionTicketsSorted,
  useGameSubmissionTickets,
} from './game-submission-ticket-store.js';
import {
  approveSubmittedTicket,
  readOpenSubmittedTickets,
  rejectSubmittedTicket,
  type SubmittedTicket,
  useSubmittedTickets,
} from './owner-submitted-tickets-store.js';
import { useProtocolOwner } from './wallet.js';

type ReviewTicket = {
  id: string;
  kind: 'partner-carousel' | 'nodename-claim' | 'game-ticket' | 'channel-claim';
  title: string;
  description: string;
  detail: string | null;
};

function submittedTicketToReviewTicket(ticket: SubmittedTicket): ReviewTicket {
  return {
    id: ticket.id,
    kind: ticket.kind,
    title: ticket.title,
    description: ticket.description,
    detail:
      ticket.submitterDetail ??
      (ticket.submitterLabel ? 'Submitted by ' + ticket.submitterLabel : null),
  };
}

function ticketKindLabel(kind: ReviewTicket['kind']): string {
  if (kind === 'partner-carousel') {
    return 'Partner Carousel';
  }

  if (kind === 'channel-claim') {
    return 'Channel Claim';
  }

  if (kind === 'game-ticket') {
    return 'Game Ticket';
  }

  return 'Nodename Claim';
}

export function OwnerTicketReviewPanel(): ReactElement | null {
  const { owner } = useProtocolOwner();
  const { openPendingCount } = useNamiAdminStore();
  const { tickets: submittedTickets } = useSubmittedTickets();
  const partnerSubmissions = usePartnerBannerSubmissions();
  const gameTickets = useGameSubmissionTickets();
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canReview = canReviewNodenameClaims(owner);

  const openTickets = useMemo((): ReviewTicket[] => {
    const queue = new Map<string, ReviewTicket>();

    for (const ticket of readOpenSubmittedTickets()) {
      queue.set(ticket.id, submittedTicketToReviewTicket(ticket));
    }

    for (const entry of partnerSubmissions.filter((submission) => submission.status === 'submitted')) {
      queue.set(entry.id, {
        id: entry.id,
        kind: 'partner-carousel',
        title: entry.title || entry.channelTitle,
        description: entry.description,
        detail: PROMOTION_DURATION_LABELS[entry.duration],
      });
    }

    for (const claim of readOpenPendingClaims()) {
      queue.set(claim.id, {
        id: claim.id,
        kind: 'nodename-claim',
        title: claimPreferredName(claim),
        description: '@' + claim.nodename + ' · ' + claim.email,
        detail: claim.displayName + ' · ' + claim.archetypeLabel + ' · ' + claim.method,
      });
    }

    for (const ticket of listGameSubmissionTicketsSorted().filter(
      (entry) => entry.status === 'submitted' || entry.status === 'preapproved'
    )) {
      queue.set(ticket.id, {
        id: ticket.id,
        kind: ticket.ticketKind === 'channel-claim' ? 'channel-claim' : 'game-ticket',
        title: ticket.ticketKind === 'channel-claim' ? 'Claim: ' + ticket.gameTitle : ticket.gameTitle,
        description: ticket.studioName + ' · ' + ticket.email,
        detail:
          ticket.trustScore +
          '% trust · ' +
          ticket.status +
          (ticket.claimProofNotes ? ' · proof on file' : '') +
          (ticket.genres.length > 0 ? ' · ' + ticket.genres.join(', ') : ''),
      });
    }

    return [...queue.values()].sort((left, right) => left.title.localeCompare(right.title));
  }, [partnerSubmissions, openPendingCount, gameTickets, submittedTickets]);

  const openSubmittedCount = openTickets.length;

  if (!canReview) {
    return null;
  }

  function clearMessages(): void {
    setActionNotice(null);
    setActionError(null);
  }

  function toggleTicketSelection(ticketId: string): void {
    setSelectedTicketIds((current) => {
      const next = new Set(current);

      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }

      return next;
    });
  }

  function selectAllTickets(): void {
    setSelectedTicketIds(new Set(openTickets.map((ticket) => ticket.id)));
  }

  function clearSubmittedTicketQueue(
    ticketId: string,
    status: 'approved' | 'rejected'
  ): boolean {
    if (status === 'approved') {
      return approveSubmittedTicket(ticketId, owner) !== null;
    }

    return rejectSubmittedTicket(ticketId, owner) !== null;
  }

  function reviewTicket(ticket: ReviewTicket, status: 'approved' | 'rejected'): boolean {
    if (ticket.kind === 'partner-carousel') {
      const updated = updatePartnerBannerSubmissionStatus(
        ticket.id,
        status,
        owner ?? 'official-owner'
      );

      if (updated !== null) {
        return true;
      }

      return clearSubmittedTicketQueue(ticket.id, status);
    }

    if (ticket.kind === 'game-ticket' || ticket.kind === 'channel-claim') {
      const result = applyGameTicketOfficialReview(ticket.id, status, owner);

      if (result.ok) {
        return true;
      }

      return clearSubmittedTicketQueue(ticket.id, status);
    }

    if (status === 'approved') {
      if (approvePendingClaims([ticket.id], owner) > 0) {
        return true;
      }

      return clearSubmittedTicketQueue(ticket.id, status);
    }

    if (rejectPendingClaims([ticket.id], owner) > 0) {
      return true;
    }

    return clearSubmittedTicketQueue(ticket.id, status);
  }

  function handleApproveTicket(ticketId: string): void {
    clearMessages();

    const ticket = openTickets.find((entry) => entry.id === ticketId);

    if (!ticket) {
      setActionError('Ticket not found.');
      return;
    }

    if (ticket.kind === 'game-ticket' || ticket.kind === 'channel-claim') {
      const result = applyGameTicketOfficialReview(ticket.id, 'approved', owner);

      if (!result.ok) {
        if (!clearSubmittedTicketQueue(ticket.id, 'approved')) {
          setActionError(result.message);
          return;
        }

        setActionNotice('Queued ticket cleared from owner review list.');
        setSelectedTicketIds((current) => {
          const next = new Set(current);
          next.delete(ticketId);
          return next;
        });
        return;
      }

      setActionNotice(result.message);
      setSelectedTicketIds((current) => {
        const next = new Set(current);
        next.delete(ticketId);
        return next;
      });
      return;
    }

    if (!reviewTicket(ticket, 'approved')) {
      setActionError('Could not approve ticket.');
      return;
    }

    setActionNotice(ticketKindLabel(ticket.kind) + ' approved.');
    setSelectedTicketIds((current) => {
      const next = new Set(current);
      next.delete(ticketId);
      return next;
    });
  }

  function handleDenyTicket(ticketId: string): void {
    clearMessages();

    const ticket = openTickets.find((entry) => entry.id === ticketId);

    if (!ticket) {
      setActionError('Ticket not found.');
      return;
    }

    if (ticket.kind === 'game-ticket' || ticket.kind === 'channel-claim') {
      const result = applyGameTicketOfficialReview(ticket.id, 'rejected', owner);

      if (!result.ok) {
        if (!clearSubmittedTicketQueue(ticket.id, 'rejected')) {
          setActionError(result.message);
          return;
        }

        setActionNotice('Queued ticket cleared from owner review list.');
        setSelectedTicketIds((current) => {
          const next = new Set(current);
          next.delete(ticketId);
          return next;
        });
        return;
      }

      setActionNotice(result.message);
      setSelectedTicketIds((current) => {
        const next = new Set(current);
        next.delete(ticketId);
        return next;
      });
      return;
    }

    if (!reviewTicket(ticket, 'rejected')) {
      setActionError('Could not deny ticket.');
      return;
    }

    setActionNotice(ticketKindLabel(ticket.kind) + ' denied.');
    setSelectedTicketIds((current) => {
      const next = new Set(current);
      next.delete(ticketId);
      return next;
    });
  }

  function handleApproveSelected(): void {
    clearMessages();

    if (selectedTicketIds.size === 0) {
      setActionError('Select at least one submitted ticket.');
      return;
    }

    let approvedCount = 0;
    const notices: string[] = [];

    for (const ticketId of selectedTicketIds) {
      const ticket = openTickets.find((entry) => entry.id === ticketId);

      if (!ticket) {
        continue;
      }

      if (ticket.kind === 'game-ticket' || ticket.kind === 'channel-claim') {
        const result = applyGameTicketOfficialReview(ticket.id, 'approved', owner);

        if (result.ok) {
          approvedCount += 1;
          notices.push(result.message);
        }

        continue;
      }

      if (reviewTicket(ticket, 'approved')) {
        approvedCount += 1;
      }
    }

    if (approvedCount === 0) {
      setActionError('No tickets were approved.');
      return;
    }

    setActionNotice(
      approvedCount + ' ticket(s) approved.' + (notices.length > 0 ? ' ' + notices[0] : '')
    );
    setSelectedTicketIds(new Set());
  }

  function handleDenySelected(): void {
    clearMessages();

    if (selectedTicketIds.size === 0) {
      setActionError('Select at least one submitted ticket.');
      return;
    }

    let deniedCount = 0;

    for (const ticketId of selectedTicketIds) {
      const ticket = openTickets.find((entry) => entry.id === ticketId);

      if (!ticket) {
        continue;
      }

      if (ticket.kind === 'game-ticket' || ticket.kind === 'channel-claim') {
        const result = applyGameTicketOfficialReview(ticket.id, 'rejected', owner);

        if (result.ok) {
          deniedCount += 1;
        }

        continue;
      }

      if (reviewTicket(ticket, 'rejected')) {
        deniedCount += 1;
      }
    }

    if (deniedCount === 0) {
      setActionError('No tickets were denied.');
      return;
    }

    setActionNotice(deniedCount + ' ticket(s) denied.');
    setSelectedTicketIds(new Set());
  }

  return (
    <article className="panel settings-card settings-compact-card settings-section-wide nami-owner-ticket-review">
      <div className="profile-panel-heading">
        <span className="mini-badge">Owner Account</span>
        <h2>Submitted Tickets</h2>
        <p>
          Approve or disapprove partner carousel banners, new game tickets, channel claim tickets,
          and nodename claims from your owner account.
        </p>
      </div>

      {openSubmittedCount > 0 ? (
        <span className="nami-owner-pending-badge" aria-label={'Open tickets: ' + openSubmittedCount}>
          {openSubmittedCount} awaiting review
        </span>
      ) : null}

      {openTickets.length === 0 ? (
        <p className="protocol-hint">No submitted tickets right now.</p>
      ) : (
        <>
          <div className="nami-owner-claim-toolbar">
            <button className="profile-secondary-link" onClick={selectAllTickets} type="button">
              Select all
            </button>
            <button
              className="profile-secondary-link"
              disabled={selectedTicketIds.size === 0}
              onClick={handleApproveSelected}
              type="button"
            >
              Approve selected ({selectedTicketIds.size})
            </button>
            <button
              className="profile-secondary-link"
              disabled={selectedTicketIds.size === 0}
              onClick={handleDenySelected}
              type="button"
            >
              Disapprove selected ({selectedTicketIds.size})
            </button>
          </div>

          <ul className="nami-owner-claim-list">
            {openTickets.map((ticket) => (
              <li className="nami-owner-claim-row" key={ticket.id}>
                <label className="nami-owner-claim-checkbox">
                  <input
                    checked={selectedTicketIds.has(ticket.id)}
                    onChange={() => toggleTicketSelection(ticket.id)}
                    type="checkbox"
                  />
                  <span className="nami-owner-claim-summary">
                    <strong>{ticket.title}</strong>
                    <span>{ticketKindLabel(ticket.kind)}</span>
                    <span>{ticket.description}</span>
                    {ticket.detail ? <span>{ticket.detail}</span> : null}
                  </span>
                </label>
                <div className="nami-owner-ticket-row-actions">
                  <button
                    className="onboarding-primary-btn"
                    onClick={() => handleApproveTicket(ticket.id)}
                    type="button"
                  >
                    Approve
                  </button>
                  <button
                    className="profile-secondary-link"
                    onClick={() => handleDenyTicket(ticket.id)}
                    type="button"
                  >
                    Disapprove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {actionError ? <p className="onboarding-field-error">{actionError}</p> : null}
      {actionNotice ? <p className="protocol-hint nami-owner-action-notice">{actionNotice}</p> : null}
    </article>
  );
}