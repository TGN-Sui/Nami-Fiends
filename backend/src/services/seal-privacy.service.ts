import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { config } from '../config.js';
import { isOfficialOwnerAddress } from './officials-auth.service.js';
import { listSealPolicyDefinitions, sealPolicyMigrationSummary } from './seal-policy-registry.js';

export type SealEvidencePolicy =
  | 'appeal_evidence'
  | 'moderation_packet'
  | 'recovery_attachment'
  | 'verification_proof'
  | 'reward_escrow';

export const SEAL_EVIDENCE_POLICIES: ReadonlySet<SealEvidencePolicy> = new Set([
  'appeal_evidence',
  'moderation_packet',
  'recovery_attachment',
  'verification_proof',
  'reward_escrow',
]);

export type SealedEvidenceRecord = {
  id: string;
  policy: SealEvidencePolicy;
  subject_owner: string;
  related_id: string | null;
  content_hash: string;
  ciphertext_b64: string;
  iv_b64: string;
  auth_tag_b64: string;
  created_at_ms: number;
  seal_version: 'nami-seal-v1-dev';
};

export type SealPrivacyReadiness = {
  enabled: boolean;
  key_configured: boolean;
  sealed_count: number;
  policies_in_use: SealEvidencePolicy[];
  policies_registered: number;
  migration_stage: string;
  migration_next_step: string;
  stack_note: string;
};

type SealedEvidenceStore = Record<string, SealedEvidenceRecord>;

function readBoolean(name: string, fallback = false): boolean {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  return value.toLowerCase() === 'true' || value === '1';
}

export function isSealPrivacyEnabled(): boolean {
  return readBoolean('NAMI_SEAL_PRIVACY_ENABLED', false);
}

function resolveDataDir(): string {
  const fromEnv = (process.env.NAMI_DATA_DIR ?? '').trim().replace(/\/$/, '');

  return fromEnv || config.dataDir;
}

function projectionPath(): string {
  return path.join(resolveDataDir(), 'projections', 'sealed-evidence.json');
}

function readSealKey(): Buffer | null {
  const raw = (process.env.NAMI_SEAL_EVIDENCE_KEY ?? '').trim();

  if (!raw) {
    return null;
  }

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  try {
    const decoded = Buffer.from(raw, 'base64');

    if (decoded.length === 32) {
      return decoded;
    }
  } catch {
    return null;
  }

  return null;
}

function assertSealReady(): Buffer {
  if (!isSealPrivacyEnabled()) {
    throw new Error('seal_privacy_disabled');
  }

  const key = readSealKey();

  if (!key) {
    throw new Error('seal_key_missing');
  }

  return key;
}

async function readStore(): Promise<SealedEvidenceStore> {
  const filePath = projectionPath();

  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as SealedEvidenceStore;
  } catch {
    return {};
  }
}

async function writeStore(store: SealedEvidenceStore): Promise<void> {
  const filePath = projectionPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2) + '\n');
}

function hashPlaintext(plaintext: string): string {
  return createHash('sha256').update(plaintext, 'utf8').digest('hex');
}

function encryptPlaintext(plaintext: string, key: Buffer): {
  ciphertext_b64: string;
  iv_b64: string;
  auth_tag_b64: string;
} {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext_b64: ciphertext.toString('base64'),
    iv_b64: iv.toString('base64'),
    auth_tag_b64: authTag.toString('base64'),
  };
}

function decryptCiphertext(record: SealedEvidenceRecord, key: Buffer): string {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(record.iv_b64, 'base64')
  );

  decipher.setAuthTag(Buffer.from(record.auth_tag_b64, 'base64'));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(record.ciphertext_b64, 'base64')),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}

export function canReadSealedEvidence(record: SealedEvidenceRecord, readerOwner: string): boolean {
  if (!readerOwner.startsWith('0x')) {
    return false;
  }

  if (isOfficialOwnerAddress(readerOwner)) {
    return true;
  }

  return record.subject_owner.toLowerCase() === readerOwner.toLowerCase();
}

export async function sealEvidencePacket(input: {
  policy: SealEvidencePolicy;
  subjectOwner: string;
  relatedId?: string | null;
  plaintext: string;
}): Promise<SealedEvidenceRecord> {
  const key = assertSealReady();

  if (!input.subjectOwner.startsWith('0x')) {
    throw new Error('invalid_subject_owner');
  }

  if (!SEAL_EVIDENCE_POLICIES.has(input.policy)) {
    throw new Error('invalid_seal_policy');
  }

  const encrypted = encryptPlaintext(input.plaintext, key);
  const id = 'seal-' + randomBytes(12).toString('hex');
  const record: SealedEvidenceRecord = {
    id,
    policy: input.policy,
    subject_owner: input.subjectOwner,
    related_id: input.relatedId ?? null,
    content_hash: hashPlaintext(input.plaintext),
    ...encrypted,
    created_at_ms: Date.now(),
    seal_version: 'nami-seal-v1-dev',
  };

  const store = await readStore();
  store[id] = record;
  await writeStore(store);

  return record;
}

export async function openSealedEvidencePacket(
  evidenceId: string,
  readerOwner: string
): Promise<{ record: SealedEvidenceRecord; plaintext: string }> {
  const key = assertSealReady();
  const store = await readStore();
  const record = store[evidenceId];

  if (!record) {
    throw new Error('sealed_evidence_not_found');
  }

  if (!canReadSealedEvidence(record, readerOwner)) {
    throw new Error('sealed_evidence_forbidden');
  }

  const plaintext = decryptCiphertext(record, key);

  if (hashPlaintext(plaintext) !== record.content_hash) {
    throw new Error('sealed_evidence_integrity_failed');
  }

  return { record, plaintext };
}

export async function listSealedEvidenceMetadata(readerOwner: string): Promise<
  Array<
    Pick<
      SealedEvidenceRecord,
      'id' | 'policy' | 'subject_owner' | 'related_id' | 'content_hash' | 'created_at_ms'
    >
  >
> {
  if (!isSealPrivacyEnabled()) {
    return [];
  }

  const store = await readStore();
  const official = isOfficialOwnerAddress(readerOwner);

  return Object.values(store)
    .filter((record) => official || record.subject_owner.toLowerCase() === readerOwner.toLowerCase())
    .map((record) => ({
      id: record.id,
      policy: record.policy,
      subject_owner: record.subject_owner,
      related_id: record.related_id,
      content_hash: record.content_hash,
      created_at_ms: record.created_at_ms,
    }));
}

export function buildSealPrivacyReadiness(store?: SealedEvidenceStore): SealPrivacyReadiness {
  const records = store ? Object.values(store) : [];
  const policies = [...new Set(records.map((record) => record.policy))];
  const migration = sealPolicyMigrationSummary();

  return {
    enabled: isSealPrivacyEnabled(),
    key_configured: readSealKey() !== null,
    sealed_count: records.length,
    policies_in_use: policies,
    policies_registered: listSealPolicyDefinitions().length,
    migration_stage: migration.stage,
    migration_next_step: migration.next_step,
    stack_note:
      'nami-seal-v1-dev envelopes on disk — migrate to Mysten Seal policy IDs + Walrus blobs in 9.2.x.',
  };
}

export async function readSealPrivacyReadiness(): Promise<SealPrivacyReadiness> {
  const store = await readStore();

  return buildSealPrivacyReadiness(store);
}

export function publicSealedEvidenceRef(
  record: SealedEvidenceRecord
): Pick<
  SealedEvidenceRecord,
  'id' | 'policy' | 'subject_owner' | 'related_id' | 'content_hash' | 'created_at_ms' | 'seal_version'
> {
  return {
    id: record.id,
    policy: record.policy,
    subject_owner: record.subject_owner,
    related_id: record.related_id,
    content_hash: record.content_hash,
    created_at_ms: record.created_at_ms,
    seal_version: record.seal_version,
  };
}