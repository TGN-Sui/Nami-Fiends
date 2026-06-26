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
| Mysten Seal policy decryption | Planned 9.2.x |
| Walrus blob storage for ciphertext | Planned 9.2.x |

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

## Launch Ops

Settings → Launch ops → **Seal privacy** card shows enabled flag, key configured, sealed count, and migration note.

---

## Migration to Mysten Seal

1. Define Seal **policy ids** per role (official, jury, subject)
2. Replace `nami-seal-v1-dev` encrypt with Seal client encrypt
3. Store ciphertext on **Walrus**; projection holds `blob_id` + `content_hash` only
4. Jury decrypt path uses Seal threshold / role keys

Until then, dev envelopes keep appeal evidence off public projections and out of Move objects.