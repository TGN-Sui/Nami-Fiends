import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  isSealPrivacyEnabled,
  listSealedEvidenceMetadata,
  openSealedEvidencePacket,
  publicSealedEvidenceRef,
  SEAL_EVIDENCE_POLICIES,
  sealEvidencePacket,
  type SealEvidencePolicy,
} from '../services/seal-privacy.service.js';
import { assertWalletAuthFromBody } from '../services/wallet-auth.service.js';

type JsonRecord = Record<string, unknown>;

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  const payload = `${JSON.stringify(body, null, 2)}\n`;

  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
  });
  response.end(payload);
}

async function readJsonBody(request: IncomingMessage): Promise<JsonRecord> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();

  if (raw.length === 0) {
    return {};
  }

  return JSON.parse(raw) as JsonRecord;
}

function mapSealError(error: unknown): { status: number; code: string; message: string } {
  const message = error instanceof Error ? error.message : 'seal_request_failed';

  if (message === 'seal_privacy_disabled') {
    return {
      status: 503,
      code: 'seal_privacy_disabled',
      message: 'Seal privacy lane is disabled. Set NAMI_SEAL_PRIVACY_ENABLED=true on Render.',
    };
  }

  if (message === 'seal_key_missing') {
    return {
      status: 503,
      code: 'seal_key_missing',
      message: 'Set NAMI_SEAL_EVIDENCE_KEY (32-byte base64 or 64-char hex) on Render.',
    };
  }

  if (message.startsWith('wallet_auth')) {
    return { status: 401, code: 'wallet_auth_required', message };
  }

  if (message === 'sealed_evidence_not_found') {
    return { status: 404, code: 'sealed_evidence_not_found', message: 'Sealed evidence not found.' };
  }

  if (message === 'sealed_evidence_forbidden') {
    return {
      status: 403,
      code: 'sealed_evidence_forbidden',
      message: 'Only the subject owner or Nami official owner may open this packet.',
    };
  }

  if (message === 'invalid_seal_policy' || message === 'invalid_subject_owner') {
    return { status: 400, code: message, message };
  }

  return { status: 500, code: 'seal_request_failed', message };
}

export function handleSealPrivacyOptions(
  _request: IncomingMessage,
  response: ServerResponse
): void {
  sendJson(response, 204, {});
}

export async function handleSealPrivacyStatusGet(
  _request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  sendJson(response, 200, {
    enabled: isSealPrivacyEnabled(),
    policies: [...SEAL_EVIDENCE_POLICIES],
    seal_version: 'nami-seal-v1-dev',
    mysten_seal_migration: 'Phase 9.2.x — replace dev envelope with Mysten Seal policy decryption.',
  });
}

export async function handleSealEvidenceSealPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';

    await assertWalletAuthFromBody(owner, body);

    const policy = typeof body.policy === 'string' ? body.policy : '';
    const plaintext = typeof body.plaintext === 'string' ? body.plaintext : '';
    const relatedId = typeof body.related_id === 'string' ? body.related_id : null;

    if (!SEAL_EVIDENCE_POLICIES.has(policy as SealEvidencePolicy)) {
      sendJson(response, 400, { error: 'invalid_seal_policy' });
      return;
    }

    if (!plaintext.trim()) {
      sendJson(response, 400, { error: 'plaintext_required' });
      return;
    }

    const record = await sealEvidencePacket({
      policy: policy as SealEvidencePolicy,
      subjectOwner: owner,
      relatedId,
      plaintext,
    });

    sendJson(response, 201, { evidence: publicSealedEvidenceRef(record) });
  } catch (error) {
    const mapped = mapSealError(error);
    sendJson(response, mapped.status, { error: mapped.code, message: mapped.message });
  }
}

export async function handleSealEvidenceListPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';

    await assertWalletAuthFromBody(owner, body);

    const items = await listSealedEvidenceMetadata(owner);

    sendJson(response, 200, { evidence: items });
  } catch (error) {
    const mapped = mapSealError(error);
    sendJson(response, mapped.status, { error: mapped.code, message: mapped.message });
  }
}

export async function handleSealEvidenceOpenPost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';
    const evidenceId = typeof body.evidence_id === 'string' ? body.evidence_id : '';

    if (!evidenceId) {
      sendJson(response, 400, { error: 'evidence_id_required' });
      return;
    }

    await assertWalletAuthFromBody(owner, body);

    const opened = await openSealedEvidencePacket(evidenceId, owner);

    sendJson(response, 200, {
      evidence: publicSealedEvidenceRef(opened.record),
      plaintext: opened.plaintext,
    });
  } catch (error) {
    const mapped = mapSealError(error);
    sendJson(response, mapped.status, { error: mapped.code, message: mapped.message });
  }
}