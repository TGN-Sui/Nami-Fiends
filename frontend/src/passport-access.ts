import { hasVerifiedLinkedPassport } from './linked-member-store.js';
import { readUserClaimStatus } from './nami-admin-store.js';

export function hasApprovedPassportClaim(): boolean {
  return readUserClaimStatus().status === 'approved';
}

/** On-chain passport ownership at the connected wallet (zkLogin or extension). */
export function hasVerifiedPassportOwnership(): boolean {
  return hasVerifiedLinkedPassport();
}

export function hasPassportAccess(): boolean {
  return hasVerifiedPassportOwnership() || hasApprovedPassportClaim();
}