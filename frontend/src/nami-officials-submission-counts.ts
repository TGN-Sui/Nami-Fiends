import { listGameSubmissionTicketsSorted } from './game-submission-ticket-store.js';

export function countPendingGameSubmissionTickets(): number {
  return listGameSubmissionTicketsSorted().filter(
    (ticket) => ticket.status === 'submitted' || ticket.status === 'preapproved',
  ).length;
}