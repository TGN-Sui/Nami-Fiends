# BA-14 — Border Art on Walrus Quilt (Draft Design)

Status: **BA-14.1 implemented** — quilt publisher + projection refs + client resolve (Render fallback when Walrus unset)  
Owner: Border Art / Platform ops lane  
Aligns with: Phase 9 Sui stack priority (Walrus > web2 disk), BA-1–13 complete

## Summary

Move Border Art media and catalog pointers from **Render-local disk** (`data/uploads/…`) to **Walrus Quilt** batch storage, with **Sui-native references** in projections (and eventually on-chain catalog objects). Members and officials keep the same UX; only the storage and retrieval plane changes underneath.

**North star:** Store and retrieve user-facing media from the **Sui stack** (Walrus + aggregator/publisher). Use the receiving server only for **coordination** (auth, indexing, payments, chat projections)—not as the system of record for binary assets.

---

## Goals

| Goal | Why |
| --- | --- |
| **Walrus-first media** | Durable, verifiable, decentralized reads; reduce Render disk as SoT |
| **Quilt economics** | Border art is many small–medium files per catalog publish; Quilt cuts WAL + Sui gas overhead |
| **Zero member friction** | No Walrus wallets, epochs, or blob IDs in UI—same equip/preview flows |
| **Official-owner provenance** | Wallet-signed catalog sync already exists; extend to quilt publish attestation |
| **Integrity** | Content hash + patch metadata tags (`reward-id`, `art-kind`, `catalog-version`) |
| **Incremental migration** | CSS-class fallbacks and projection dual-read during cutover |

## Non-goals (BA-14)

- Replacing chat message storage (stay off-chain DB / future Messaging SDK)
- Member equip PTBs or on-chain `CosmeticLoadout` (still BA future / Move)
- Seal-encrypted private evidence (separate lane; regular blobs + Seal, not Quilt)
- Hosting the receiving server API on Walrus Sites
- User-facing “upload to Walrus” or epoch renewal UI

---

## Web2 minimization policy

```text
Tier 0 — Sui stack (target SoT)
  Walrus Quilt patches     → border art bytes
  Walrus aggregator URL  → browser read path
  Sui object / event       → catalog version + quilt blob id (phase B)

Tier 1 — Receiving server (coordination only)
  JSON projections         → catalog metadata, equip map, discovery scores
  Wallet-auth gates        → owner publish, member equip sync
  Quilt publish worker     → signs/uploads quilt; does NOT serve bytes long-term

Tier 2 — Web2 (minimize, migrate off)
  Render data/uploads      → BA-14 removes for border art
  Vercel static SPA        → Phase 9.1 moves to Walrus Sites
```

After BA-14, border art **must not** depend on `GET /api/media/files/…` for happy-path reads. That route becomes legacy fallback only until migration completes.

---

## Current state (BA-13)

```text
OfficialsRewardStudioPanel
  → wallet-signed POST /api/chat-overlay-rewards/sync
    → chat-overlay-rewards.service.resolveArtUrl()
      → saveBorderArtUpload() → data/uploads/{owner}/border-art-*.png|gif|webp
      → buildMediaPublicUrl() → https://{backend}/api/media/files/…

Client
  → GET /api/chat-overlay-rewards → catalog JSON with https Render URLs
  → ChatMessageBubble / buildChatBorderPresentation → border-image / 9-slice
```

**Pain points**

- Binary SoT on ephemeral Render disk (loss on redeploy, no verifiability)
- Per-file upload overhead if moved to individual Walrus blobs
- Catalog URLs tied to backend host, not protocol infrastructure

---

## Target architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (unchanged UX)                                          │
│  OfficialsRewardStudioPanel · ChatOverlayEquipPicker · bubbles   │
└────────────────────────────┬────────────────────────────────────┘
                             │ wallet-signed catalog sync (existing)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Receiving server — coordination                                  │
│  chat-overlay-rewards.service                                    │
│    1. Accept data URLs / existing Walrus refs                  │
│    2. Stage bytes in publish buffer (memory/disk scratch)        │
│    3. Flush Walrus Quilt per catalog version                     │
│    4. Write projection: WalrusQuiltCatalogRef + patch map       │
│  GET /api/chat-overlay-rewards → aggregator URLs in JSON         │
└────────────────────────────┬────────────────────────────────────┘
                             │ publisher API / CLI
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Walrus (SoT for bytes)                                           │
│  Quilt: nami-border-art/{catalogVersion}                         │
│    patches tagged: reward-id, art-kind, content-hash, owner      │
│  Reads: Mysten testnet/mainnet aggregator (HTTP)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ optional phase B
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Sui (SoT for trust)                                              │
│  ChatOverlayCatalog object or event:                             │
│    quilt_blob_id, catalog_version_ms, official_owner, root_hash  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data model

### Projection extension (`chat-overlay-rewards.json`)

Add optional Walrus fields per reward art slot. Keep existing `staticArtUrl` / `animatedArtUrl` during migration; new writes prefer structured refs.

```typescript
type WalrusQuiltPatchRef = {
  kind: 'walrus-quilt-patch';
  quiltBlobId: string;       // Walrus blob id for the quilt unit
  patchId: string;           // QuiltPatchId (NOT content-derived)
  aggregatorBase: string;    // e.g. https://aggregator.walrus-testnet.walrus.xyz
  contentHash: string;       // sha256 hex of patch bytes
  contentType: string;       // image/png | image/gif | image/webp
  rewardId: string;
  artKind: 'static' | 'animated';
  catalogVersionMs: number;
};

type OfficialChatOverlayReward = {
  // …existing fields…
  staticArtUrl: string | null;   // legacy Render URL or null when patch ref present
  animatedArtUrl: string | null;
  staticArtRef?: WalrusQuiltPatchRef | null;
  animatedArtRef?: WalrusQuiltPatchRef | null;
};
```

**Client resolution order** (new helper `resolveBorderArtUrl(reward, kind)`):

1. `*ArtRef` → build aggregator patch URL  
2. `*ArtUrl` if `https://aggregator…` or Walrus portal URL  
3. Legacy `https://{backend}/api/media/files/…` (migration window)  
4. `null` → CSS class fallback (`signal-glow`, etc.)

### Quilt tagging convention

| Tag key | Example | Purpose |
| --- | --- | --- |
| `nami:asset-type` | `border-art` | Collection filter |
| `nami:reward-id` | `overlay-signal-glow` | Patch lookup |
| `nami:art-kind` | `static` \| `animated` | Slot disambiguation |
| `nami:catalog-version` | `1730000000000` | Quilt batch identity |
| `nami:owner` | `0x…` | Provenance |
| `nami:content-hash` | `sha256:…` | Integrity verify |

Identifiers follow [Walrus Quilt rules](https://docs.wal.app/docs/system-overview/quilt) (alphanumeric start, ≤64 KiB).

---

## Write path (owner publish)

```text
1. Owner saves Border Art studio (unchanged UI)
2. POST /api/chat-overlay-rewards/sync (wallet auth, existing)
3. Server normalizes rewards; for each data URL art slot:
     a. Decode bytes + validate size/dimensions (BA-14 slice 2)
     b. Add to in-memory PublishBuffer keyed by catalogVersionMs
4. When buffer has ≥1 patch OR owner save completes:
     a. walrus-quilt-publisher.flush(buffer) → { quiltBlobId, patches[] }
     b. Map patches → staticArtRef / animatedArtRef per reward
     c. Strip data URLs; do NOT write Render disk (BA-14 slice 1 goal)
5. Persist projection JSON (coordination tier)
6. Optional: emit Sui transaction registering catalog root (phase B)
7. Return catalog to client; client hydrate unchanged
```

**Quilt batching rule:** One quilt per `catalogVersionMs` publish (max ~32 rewards × 2 slots = 64 patches ≪ 660 limit). Animated WebP/GIF up to 4 MiB each—still under 4 GiB per-patch limit.

**Failure behavior:** If quilt publish fails, keep staged buffer, return `quilt_publish_failed` to owner retry queue (extend BA-11 pattern). Do not fall back to Render disk on testnet once flag `NAMI_WALRUS_BORDER_ART_REQUIRED=true`.

---

## Read path (members)

```text
Browser / ChatMessageBubble
  → GET /api/chat-overlay-rewards (projection, small JSON)
  → resolveBorderArtUrl() → aggregator patch URL
  → border-image / ChatBorderArtFrame (unchanged)
```

**No member wallet interaction.** Reads hit Walrus aggregator CDN-like edge, not Render.

**Caching:** HTTP cache headers from aggregator; client catalog polling (BA-10) already handles metadata refresh.

---

## Security & trust

| Concern | Mitigation |
| --- | --- |
| **Tampered art** | `contentHash` in ref; client optional verify; on-chain root hash (phase B) |
| **Unauthorized catalog** | Existing `official_owner_required` + wallet auth on sync |
| **Wrong patch served** | Patch id + reward-id tag match in projection map |
| **Backend compromise** | Bytes not authoritative on disk; verifiable Walrus reads; Sui registry (B) |
| **Privacy** | Border art is public cosmetic media—no Seal required for BA-14 |

---

## Implementation slices

### BA-14.1 — Walrus quilt publisher + projection refs (MVP)

**Scope:** Backend publishes border art to testnet Quilt; projection stores `*ArtRef`; API returns aggregator URLs.

| Area | Files |
| --- | --- |
| Config | `backend/src/config.ts` — `NAMI_WALRUS_AGGREGATOR_URL`, `NAMI_WALRUS_PUBLISHER_URL`, treasury key |
| Publisher | `backend/src/services/walrus-quilt-publisher.service.ts` (new) |
| Media | `backend/src/services/media-upload.service.ts` — deprecate `saveBorderArtUpload` for border art |
| Catalog | `backend/src/services/chat-overlay-rewards.service.ts` — `resolveArtUrl` → quilt path |
| Types | `frontend/src/official-chat-overlay-rewards-store.ts` — optional `*ArtRef` |
| Resolve | `frontend/src/chat-border-rendering.ts` — `resolveBorderArtUrl()` |
| Tests | publisher unit tests, catalog sync integration test with mocked Walrus |

**Exit:** Fresh owner publish on testnet serves art from aggregator; Render disk unused for new uploads.

### BA-14.2 — Migration + dual-read + ops

**Scope:** Migrate existing Render URLs to quilt; admin script; epoch renewal runbook.

| Area | Work |
| --- | --- |
| Script | `scripts/migrate-border-art-to-walrus.mjs` — read projection + disk, republish quilt |
| Flag | `NAMI_WALRUS_BORDER_ART_REQUIRED` — block new Render writes |
| Docs | `docs/testnet-launch-checklist.md` — Walrus epoch renewal for catalog quilt |
| Fallback | TTL sunset on `/api/media/files/…` for `border-art-*` |

### BA-14.3 — Upload spec + integrity

**Scope:** Enforce 384×384 before publish; hash verification on read (dev/test).

| Area | Files |
| --- | --- |
| Frontend | `chat-border-art-upload.ts` — dimension decode (deferred from BA-14 pre-work) |
| Backend | reject wrong dimensions pre-quilt |
| Client | optional `contentHash` check in `resolveBorderArtUrl` (testnet warn only) |

### BA-14.4 — Sui catalog attestation (trust layer)

**Scope:** On-chain `ChatOverlayCatalogRoot` object or event emitted on publish.

| Area | Work |
| --- | --- |
| Move | `cosmetics.move` or new `chat_overlay_catalog.move` — store quilt blob id + version + hash |
| Backend | PTB after successful quilt flush (official owner key) |
| Frontend | `ProtocolStatusBar` optional “catalog verified on-chain” badge for officials |

---

## PR plan (DAG)

```text
PR-1  walrus-quilt-publisher.service + config + tests
        ↓
PR-2  chat-overlay-rewards.service integrate quilt flush (write path)
        ↓
PR-3  frontend resolveBorderArtUrl + store types + rendering
        ↓
PR-4  migration script + feature flags + disable Render border-art writes
        ↓
PR-5  (optional) Move catalog root + emit on publish
```

PR-1–3 can ship as a single BA-14.1 stack if preferred; keep publisher isolated for review.

---

## Environment variables (draft)

| Variable | Purpose |
| --- | --- |
| `NAMI_WALRUS_NETWORK` | `testnet` \| `mainnet` |
| `NAMI_WALRUS_AGGREGATOR_URL` | Read base for patch URLs |
| `NAMI_WALRUS_PUBLISHER_URL` | Quilt upload API |
| `NAMI_WALRUS_SIGNER_KEY` | Server key for publish (official ops wallet) |
| `NAMI_WALRUS_BORDER_ART_REQUIRED` | When true, reject Render disk fallback |
| `NAMI_WALRUS_EPOCH_RENEWAL_CRON` | Ops hook for quilt extension |

---

## Ops: epoch renewal

Quilt units share lifetime—extend the **whole catalog quilt** before epoch expiry.

```text
Launch ops panel (existing) add row:
  Border art catalog quilt · blob id · epochs remaining · last publish ms
Cron or manual:
  walrus extend --blob-id {quiltBlobId} --epochs N
```

Document in testnet checklist alongside Phase 9.1 Walrus Sites renewal.

---

## Success metrics

- [ ] 100% of border art slots on testnet served via aggregator URL  
- [ ] Zero new files under `data/uploads/…/border-art-*` after cutover  
- [ ] Owner publish latency p95 &lt; 15s (quilt flush included)  
- [ ] Chat bubble render unchanged (visual regression on 4 default presets + 1 animated)  
- [ ] Catalog hydrate + equip validation (BA-9) still pass  

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Aggregator outage | Cache last-good projection; CSS class fallback |
| Quilt patch id changes on republish | Treat catalog version as immutable; new publish = new quilt |
| Publisher key compromise | Limited to media publish; official-owner gate on catalog sync |
| Large animated borders (4 MiB) | Still one patch each; monitor quilt size limits |
| Render redeploy data loss | Migration script + Walrus as SoT removes dependency |

---

## Relationship to broader Walrus roadmap

| Lane | BA-14 role |
| --- | --- |
| **Phase 9.1 Walrus Sites** | Frontend hosting; BA-14 handles **media** SoT |
| **Avatar / emoji uploads** | Reuse `walrus-quilt-publisher` with different `nami:asset-type` tag |
| **Phase 9.3 Walrus Memory** | Officials AI only; not member chat |
| **Seal + evidence** | Regular blobs, not Quilt |

---

## Open questions

1. **Testnet publisher:** Mysten hosted publisher vs self-hosted? (Start with Mysten testnet API.)
2. **On-chain timing:** BA-14.4 in same stack or defer until cosmetic registry Move lands?
3. **Mainnet:** Separate quilt per environment; no cross-network URLs in projection.

---

## References

- [Walrus Quilt docs](https://docs.wal.app/docs/system-overview/quilt)
- [Quilt HTTP API](https://docs.wal.app/usage/web-api#quilt-http-apis)
- `docs/sui-layer.md` — Walrus media references
- `docs/architecture.md` — Chat Border Art System (BA-1–13)
- `backend/src/services/chat-overlay-rewards.service.ts` — current `resolveArtUrl`