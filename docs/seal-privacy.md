# Seal Privacy Lane (Phase 9.2)

Encrypt sensitive appeal, moderation, recovery, and verification evidence on the receiving server without putting plaintext in projections or on-chain objects.

Related: [sui-layer.md](./sui-layer.md) · [appeals.md](./appeals.md) · [roadmap.md](./roadmap.md) Phase 9.2

---

## Privacy principle

```text
On-chain anchors trust
Off-chain or encrypted stores hold sensitive payloads
Official owner + subject owner decrypt within policy — never public-by-default
```

AppealCase `public_reference` may point at a **sealed evidence id** (`seal-…`), not raw text.

---

## Current implementation (9.2.1)

| Piece | Status |
| --- | --- |
| `nami-seal-v1-dev` AES-256-GCM envelopes | Shipped |
| Projection `data/projections/sealed-evidence.json` | Shipped |
| API `/api/privacy/evidence/*` | Shipped |
| Walrus ciphertext offload (`walrus_blob_id` + projection fallback) | Shipped when `NAMI_WALRUS_PUBLISHER_URL` set |
| Mysten Seal policy decryption | Future 9.2.x when Mysten APIs stabilize |

Gate: **`NAMI_SEAL_PRIVACY_ENABLED=false`** by default (same pattern as catalog attestation).

---

## Policies

| Policy | Use |
| --- | --- |
| `appeal_evidence` | Appellant uploads context for AppealCase review |
| `moderation_packet` | Officials-only moderator notes and attachments |
| `recovery_attachment` | Account recovery sensitive proof |
| `verification_proof` | Linked-account verification without public PII |

---

## Environment (Render)

```bash
NAMI_SEAL_PRIVACY_ENABLED=true
# 32-byte key — base64 or 64-char hex (generate once, store in Render secrets)
NAMI_SEAL_EVIDENCE_KEY=
```

Generate a dev key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## API

### Status (public)

```http
GET /api/privacy/status
```

### Seal packet (wallet auth)

```http
POST /api/privacy/evidence/seal
{
  "owner": "0x…",
  "policy": "appeal_evidence",
  "related_id": "0x…",
  "plaintext": "…",
  "auth": { "signature": "…", "timestampMs": …, "signerAddress": "0x…" }
}
```

Returns `{ evidence: { id, policy, content_hash, … } }` — no ciphertext in response.

### List metadata (wallet auth)

```http
POST /api/privacy/evidence/list
{ "owner": "0x…", "auth": { … } }
```

Subject sees own packets; **Nami official owner** sees all.

### Open / decrypt (wallet auth)

```http
POST /api/privacy/evidence/open
{ "owner": "0x…", "evidence_id": "seal-…", "auth": { … } }
```

---

## Walrus ciphertext (9.2 groundwork)

When `NAMI_WALRUS_PUBLISHER_URL` (or `NAMI_WALRUS_NETWORK=testnet`) is configured on Render:

1. `sealEvidencePacket` encrypts locally, then uploads raw ciphertext bytes to Walrus via the publisher HTTP API.
2. The projection stores `walrus_blob_id` on `SealedEvidenceRecord` and keeps `ciphertext_b64` as a fallback when Walrus is disabled or upload fails.
3. `openSealedEvidencePacket` fetches ciphertext from the Walrus aggregator when `walrus_blob_id` is present, then decrypts with `NAMI_SEAL_EVIDENCE_KEY`.

Verify readiness:

```bash
node scripts/verify-seal-privacy-ready.mjs --indexer-url https://nami-backend-rv0o.onrender.com
```

---

## Launch Ops

Settings → Launch ops → **Seal privacy** card shows enabled flag, key configured, sealed count, Walrus ciphertext count, migration stage, and stack note.

---

## Migration to Mysten Seal

1. Define Seal **policy ids** per role (official, jury, subject)
2. Replace `nami-seal-v1-dev` encrypt with Seal client encrypt
3. Walrus ciphertext offload is already wired — projection holds `walrus_blob_id` + `content_hash`
4. Jury decrypt path uses Seal threshold / role keys

Until Mysten Seal policy ids ship, dev envelopes + optional Walrus blobs keep appeal evidence off public projections and out of Move objects.