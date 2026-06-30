import type { IncomingMessage } from 'node:http';

import { config } from '../config.js';
import {
  assertMandatoryWalletAuthFromBody,
  type WalletAuthPayload,
  verifyWalletAuthPayload,
} from './wallet-auth.service.js';

export type OfficialsSyncScope = 'open' | 'secret' | 'official' | 'member';

export const officialsAuthConfig = {
  syncSecret: (process.env.NAMI_OFFICIALS_SYNC_SECRET ?? '').trim(),
} as const;

function readSyncSecretHeader(request: IncomingMessage): string {
  const value = request.headers['x-nami-officials-sync'];

  return typeof value === 'string' ? value.trim() : '';
}

export function isOfficialOwnerAddress(owner: string): boolean {
  const official = config.officialOwner.trim().toLowerCase();

  return official !== '' && owner.toLowerCase() === official;
}

async function assertOfficialsWalletAuth(
  owner: string,
  auth: Partial<WalletAuthPayload> | null | undefined
): Promise<void> {
  if (!auth || typeof auth.signature !== 'string' || typeof auth.timestampMs !== 'number') {
    throw new Error('officials_sync_auth_required');
  }

  const verified = await verifyWalletAuthPayload({
    owner,
    signature: auth.signature,
    timestampMs: auth.timestampMs,
    signerAddress:
      typeof auth.signerAddress === 'string' && auth.signerAddress.startsWith('0x')
        ? auth.signerAddress
        : undefined,
  });

  if (!verified) {
    throw new Error('officials_sync_auth_invalid');
  }
}

export async function assertOfficialOwnerFromBody(body: Record<string, unknown>): Promise<string> {
  const owner = typeof body.owner === 'string' ? body.owner : '';

  if (!owner.startsWith('0x')) {
    throw new Error('invalid_owner');
  }

  if (!isOfficialOwnerAddress(owner)) {
    throw new Error('official_owner_required');
  }

  await assertMandatoryWalletAuthFromBody(owner, body);

  return owner;
}

export async function resolveOfficialsSyncScope(
  request: IncomingMessage,
  body: { owner?: unknown; auth?: unknown }
): Promise<{ scope: OfficialsSyncScope; owner: string | null }> {
  if (officialsAuthConfig.syncSecret !== '') {
    if (readSyncSecretHeader(request) === officialsAuthConfig.syncSecret) {
      return { scope: 'secret', owner: null };
    }
  }

  const owner = typeof body.owner === 'string' ? body.owner : '';

  if (!owner.startsWith('0x')) {
    throw new Error('officials_sync_auth_required');
  }

  const auth =
    typeof body.auth === 'object' && body.auth !== null
      ? (body.auth as Partial<WalletAuthPayload>)
      : undefined;

  await assertOfficialsWalletAuth(owner, auth);

  if (isOfficialOwnerAddress(owner)) {
    return { scope: 'official', owner };
  }

  return { scope: 'member', owner };
}

function asIdRecords(value: unknown): Array<Record<string, unknown> & { id: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (entry !== null && typeof entry === 'object' && typeof (entry as { id?: unknown }).id === 'string') {
      return [entry as Record<string, unknown> & { id: string }];
    }

    return [];
  });
}

export function filterOfficialsSyncInput(
  input: {
    suggestions?: unknown[];
    gameTickets?: unknown[];
    partnerBanners?: unknown[];
    nodenameClaims?: unknown[];
    ownerProvisionedChannels?: unknown[];
  },
  scope: OfficialsSyncScope,
  owner: string | null,
  syncEmail = ''
): {
  suggestions?: unknown[];
  gameTickets?: unknown[];
  partnerBanners?: unknown[];
  nodenameClaims?: unknown[];
  ownerProvisionedChannels?: unknown[];
} {
  if (scope === 'open' || scope === 'secret' || scope === 'official') {
    return input;
  }

  if (!owner?.startsWith('0x')) {
    return {};
  }

  const normalizedOwner = owner.toLowerCase();
  const normalizedEmail = syncEmail.trim().toLowerCase();
  const filtered: {
    suggestions?: unknown[];
    gameTickets?: unknown[];
    partnerBanners?: unknown[];
    nodenameClaims?: unknown[];
    ownerProvisionedChannels?: unknown[];
  } = {};

  if (input.suggestions !== undefined) {
    filtered.suggestions = asIdRecords(input.suggestions).filter((entry) => {
      if (normalizedEmail === '') {
        return false;
      }

      const submitterEmail = entry.submitterEmail;

      return (
        typeof submitterEmail === 'string' &&
        submitterEmail.trim().toLowerCase() === normalizedEmail
      );
    });
  }

  if (input.gameTickets !== undefined) {
    filtered.gameTickets = asIdRecords(input.gameTickets).filter((entry) => {
      const walletAddress = entry.walletAddress;

      return (
        typeof walletAddress === 'string' && walletAddress.toLowerCase() === normalizedOwner
      );
    });
  }

  if (input.nodenameClaims !== undefined) {
    filtered.nodenameClaims = asIdRecords(input.nodenameClaims).filter((entry) => {
      const submitterAddress = entry.submitterAddress;

      return (
        typeof submitterAddress === 'string' &&
        submitterAddress.toLowerCase() === normalizedOwner
      );
    });
  }

  return filtered;
}