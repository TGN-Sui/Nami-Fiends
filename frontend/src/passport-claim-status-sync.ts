import { readPendingNodenameClaims, saveUserClaimStatusFromServer } from './nami-admin-store.js';
import { readMemberSession } from './member-session-store.js';

export function syncUserClaimStatusFromHydratedClaims(): void {
  const email = readMemberSession()?.email;

  if (!email) {
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const matchingClaim = readPendingNodenameClaims().find(
    (claim) => claim.email.trim().toLowerCase() === normalizedEmail
  );

  if (!matchingClaim) {
    return;
  }

  saveUserClaimStatusFromServer({
    claimId: matchingClaim.id,
    status:
      matchingClaim.status === 'approved' ||
      matchingClaim.status === 'pending' ||
      matchingClaim.status === 'rejected'
        ? matchingClaim.status
        : 'none',
    nodename: matchingClaim.nodename,
    updatedAtMs: matchingClaim.reviewedAtMs ?? matchingClaim.submittedAtMs,
  });
}