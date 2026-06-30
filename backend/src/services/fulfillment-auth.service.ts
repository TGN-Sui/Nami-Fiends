import { config } from '../config.js';
import {
  assertOfficialOwnerFromBody,
  isOfficialOwnerAddress,
} from './officials-auth.service.js';
import { assertMandatoryWalletAuthFromBody } from './wallet-auth.service.js';

function normalizeOwner(owner: string): string {
  return owner.trim().toLowerCase();
}

export async function assertOfficialOwnerFulfillmentAccess(
  body: Record<string, unknown>
): Promise<string> {
  return assertOfficialOwnerFromBody(body);
}

export async function assertFulfillmentOperatorFromBody(
  body: Record<string, unknown>,
  allowedOwner: string | null | undefined
): Promise<string> {
  const owner = typeof body.owner === 'string' ? body.owner : '';

  if (!owner.startsWith('0x')) {
    throw new Error('invalid_owner');
  }

  await assertMandatoryWalletAuthFromBody(owner, body);

  if (isOfficialOwnerAddress(owner)) {
    return owner;
  }

  const normalizedAllowed = allowedOwner?.startsWith('0x') ? normalizeOwner(allowedOwner) : '';

  if (normalizedAllowed !== '' && normalizeOwner(owner) === normalizedAllowed) {
    return owner;
  }

  throw new Error('fulfillment_operator_required');
}

export function fulfillmentPendingListRequiresAuth(): boolean {
  return config.testLaunch;
}

export function readFulfillmentAuthErrorStatus(message: string): number {
  if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
    return 401;
  }

  if (
    message === 'official_owner_required' ||
    message === 'fulfillment_operator_required'
  ) {
    return 403;
  }

  if (message === 'invalid_owner') {
    return 400;
  }

  return 400;
}