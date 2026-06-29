import { isIndexerLive, readAppConfig } from './app-config.js';
import { readIndexerUrl } from './protocol-env.js';
import { createWalletAuthPayload } from './wallet-auth.js';

export type SealEvidencePolicy =
  | 'appeal_evidence'
  | 'moderation_packet'
  | 'recovery_attachment'
  | 'verification_proof'
  | 'reward_escrow';

export const SEAL_EVIDENCE_POLICIES: readonly SealEvidencePolicy[] = [
  'appeal_evidence',
  'moderation_packet',
  'recovery_attachment',
  'verification_proof',
  'reward_escrow',
];

export type SealedEvidenceRef = {
  id: string;
  policy: SealEvidencePolicy;
  subject_owner: string;
  related_id: string | null;
  content_hash: string;
  created_at_ms: number;
  seal_version: 'nami-seal-v1-dev';
};

export type SealPrivacyStatus = {
  enabled: boolean;
  policies: SealEvidencePolicy[];
  policies_registered: number;
  migration_stage: string;
  migration_next_step: string;
  seal_version: string;
  mysten_seal_migration: string;
};

export type SealPrivacyApiErrorCode =
  | 'not_configured'
  | 'wallet_auth_unavailable'
  | 'wallet_auth_required'
  | 'wallet_auth_invalid'
  | 'seal_privacy_disabled'
  | 'seal_key_missing'
  | 'sealed_evidence_not_found'
  | 'sealed_evidence_forbidden'
  | 'invalid_seal_policy'
  | 'plaintext_required'
  | 'request_failed';

export class SealPrivacyApiError extends Error {
  readonly code: SealPrivacyApiErrorCode;
  readonly status: number;

  constructor(code: SealPrivacyApiErrorCode, status: number, message: string) {
    super(message);
    this.name = 'SealPrivacyApiError';
    this.code = code;
    this.status = status;
  }
}

function apiBase(): string | null {
  const url = readIndexerUrl();

  if (!url) {
    return null;
  }

  return url.replace(/\/$/, '');
}

export function isSealPrivacyApiAvailable(): boolean {
  return isIndexerLive(readAppConfig());
}

function mapResponseError(status: number, body: Record<string, unknown>): SealPrivacyApiError {
  const error = typeof body.error === 'string' ? body.error : '';
  const message = typeof body.message === 'string' ? body.message : '';

  if (error === 'wallet_auth_required' || message.startsWith('wallet_auth')) {
    return new SealPrivacyApiError(
      error === 'wallet_auth_required' ? 'wallet_auth_required' : 'wallet_auth_invalid',
      status,
      'Reconnect zkLogin or your wallet, then try again.'
    );
  }

  if (error === 'seal_privacy_disabled') {
    return new SealPrivacyApiError(
      'seal_privacy_disabled',
      status,
      message || 'Seal privacy lane is disabled on the receiving server.'
    );
  }

  if (error === 'seal_key_missing') {
    return new SealPrivacyApiError(
      'seal_key_missing',
      status,
      message || 'Receiving server is missing NAMI_SEAL_EVIDENCE_KEY.'
    );
  }

  if (error === 'sealed_evidence_not_found') {
    return new SealPrivacyApiError('sealed_evidence_not_found', status, 'Sealed evidence not found.');
  }

  if (error === 'sealed_evidence_forbidden') {
    return new SealPrivacyApiError(
      'sealed_evidence_forbidden',
      status,
      'Only the subject owner or Nami official owner may open this packet.'
    );
  }

  if (error === 'invalid_seal_policy') {
    return new SealPrivacyApiError('invalid_seal_policy', status, 'Choose a supported Seal policy.');
  }

  if (error === 'plaintext_required') {
    return new SealPrivacyApiError('plaintext_required', status, 'Enter evidence text before sealing.');
  }

  return new SealPrivacyApiError('request_failed', status, message || 'Seal privacy request failed.');
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const base = apiBase();

  if (!base) {
    throw new SealPrivacyApiError('not_configured', 0, 'Set VITE_NAMI_INDEXER_URL to use Seal privacy.');
  }

  const response = await fetch(base + path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw mapResponseError(response.status, payload);
  }

  return payload as T;
}

export async function fetchSealPrivacyStatus(): Promise<SealPrivacyStatus | null> {
  const base = apiBase();

  if (!base) {
    return null;
  }

  const response = await fetch(base + '/api/privacy/status');

  if (!response.ok) {
    throw new SealPrivacyApiError('request_failed', response.status, 'Could not load Seal privacy status.');
  }

  return (await response.json()) as SealPrivacyStatus;
}

export async function listSealedEvidence(owner: string): Promise<SealedEvidenceRef[]> {
  const auth = await createWalletAuthPayload(owner);

  if (!auth) {
    throw new SealPrivacyApiError(
      'wallet_auth_unavailable',
      0,
      'Reconnect zkLogin or your wallet to list sealed evidence.'
    );
  }

  const payload = await postJson<{ evidence: SealedEvidenceRef[] }>('/api/privacy/evidence/list', {
    owner,
    auth,
  });

  return payload.evidence ?? [];
}

export async function sealEvidencePacket(input: {
  owner: string;
  policy: SealEvidencePolicy;
  plaintext: string;
  relatedId?: string | null;
}): Promise<SealedEvidenceRef> {
  const auth = await createWalletAuthPayload(input.owner);

  if (!auth) {
    throw new SealPrivacyApiError(
      'wallet_auth_unavailable',
      0,
      'Reconnect zkLogin or your wallet to seal evidence.'
    );
  }

  const payload = await postJson<{ evidence: SealedEvidenceRef }>('/api/privacy/evidence/seal', {
    owner: input.owner,
    policy: input.policy,
    plaintext: input.plaintext,
    related_id: input.relatedId ?? null,
    auth,
  });

  return payload.evidence;
}

export async function openSealedEvidence(input: {
  owner: string;
  evidenceId: string;
}): Promise<{ evidence: SealedEvidenceRef; plaintext: string }> {
  const auth = await createWalletAuthPayload(input.owner);

  if (!auth) {
    throw new SealPrivacyApiError(
      'wallet_auth_unavailable',
      0,
      'Reconnect zkLogin or your wallet to open sealed evidence.'
    );
  }

  const payload = await postJson<{ evidence: SealedEvidenceRef; plaintext: string }>(
    '/api/privacy/evidence/open',
    {
      owner: input.owner,
      evidence_id: input.evidenceId,
      auth,
    }
  );

  return payload;
}

export function sealPrivacyErrorMessage(error: SealPrivacyApiErrorCode): string {
  if (error === 'not_configured') {
    return 'Receiving server is not configured. Set VITE_NAMI_INDEXER_URL on your deploy.';
  }

  if (error === 'wallet_auth_unavailable' || error === 'wallet_auth_required' || error === 'wallet_auth_invalid') {
    return 'Reconnect zkLogin or your wallet, then try again.';
  }

  if (error === 'seal_privacy_disabled') {
    return 'Seal privacy is disabled on the receiving server. Enable NAMI_SEAL_PRIVACY_ENABLED in Launch Ops.';
  }

  if (error === 'seal_key_missing') {
    return 'Receiving server is missing NAMI_SEAL_EVIDENCE_KEY. Configure it in Render secrets.';
  }

  if (error === 'sealed_evidence_forbidden') {
    return 'You may only open packets you submitted, unless you are the Nami official owner.';
  }

  if (error === 'sealed_evidence_not_found') {
    return 'That sealed evidence id was not found.';
  }

  if (error === 'plaintext_required') {
    return 'Enter evidence text before sealing.';
  }

  return 'Could not complete the Seal privacy request. Check your connection and try again.';
}