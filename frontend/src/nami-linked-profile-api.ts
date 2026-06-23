import { createWalletAuthPayload } from './wallet-auth.js';
import { readIndexerUrl } from './protocol-env.js';

export type NamiLinkedProfileProof = {
  status: 'verified' | 'passport_only' | 'identity_only' | 'not_member';
  method: 'wallet_ownership';
  identityOwned: boolean;
  passportOwned: boolean;
  identityPassportLinked: boolean;
  passportIdentityLinked: boolean;
  linksConsistent: boolean;
};

export type NamiLinkedProfile = {
  owner: string;
  proof: NamiLinkedProfileProof;
  anchor: {
    nodename: string | null;
    archetype: number | null;
    avatarRef: string | null;
    passportId: string | null;
    identityId: string | null;
    createdAtMs: number | null;
  };
  progression: {
    level: number | null;
    tier: number | null;
    reputation: number | null;
    membershipTierLabel: string | null;
    conductSignal: number | null;
    conductSignalLabel: string | null;
    timelineEntryCount: number;
  } | null;
  offchain: {
    displayName: string | null;
    preferredName: string | null;
    avatarUrl: string | null;
    claimStatus: string | null;
    claimNodename: string | null;
    profileProjectionId: string | null;
  };
  auth: {
    requireSignature: boolean;
    verifiedRequest: boolean;
  };
};

function apiBaseUrl(): string | null {
  return readIndexerUrl();
}

async function linkedProfileFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const base = apiBaseUrl();

  if (!base) {
    return null;
  }

  const response = await fetch(base + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 404) {
    return null;
  }

  const payload = (await response.json()) as T & { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? 'Linked profile request failed.');
  }

  return payload;
}

export async function fetchLinkedProfile(owner: string): Promise<NamiLinkedProfile | null> {
  if (!owner.startsWith('0x')) {
    return null;
  }

  const payload = await linkedProfileFetch<{ linkedProfile: NamiLinkedProfile }>(
    '/api/nami/linked-profile/' + encodeURIComponent(owner)
  );

  return payload?.linkedProfile ?? null;
}

export async function syncLinkedProfile(owner: string): Promise<NamiLinkedProfile | null> {
  if (!owner.startsWith('0x')) {
    return null;
  }

  const auth = await createWalletAuthPayload(owner);
  const body: Record<string, unknown> = { owner };

  if (auth) {
    body.auth = auth;
  }

  const payload = await linkedProfileFetch<{ linkedProfile: NamiLinkedProfile }>(
    '/api/nami/linked-profile/sync',
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );

  return payload?.linkedProfile ?? null;
}

export function isVerifiedNamiLinkedProfile(
  profile: NamiLinkedProfile | null | undefined
): profile is NamiLinkedProfile {
  return profile?.proof.status === 'verified';
}