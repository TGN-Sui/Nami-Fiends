# Nami Security Audit — Owner Authority

## Purpose

Document adversarial checks for **sole-owner control** during the MVP phase. The official Nami owner (AdminCap holder) must be the only actor who can perform sensitive platform operations.

**Automated gate:** run `node scripts/verify-security-review.mjs` before sharing a public testnet URL. Launch Ops surfaces the same checklist via `/api/ops/launch-summary` → `security_review`.

---

## On-Chain (Move)

### Status

```text
82 tests passing (includes AdminCap custody hardening + delegated role caps)
0 warnings
```

### AdminCap custody

`AdminCap` is an owned object transferred to the package publisher at init. Sensitive `admin.move` entry points require `&AdminCap`, so callers without custody cannot invoke:

```text
Pro / Elite upgrades
Moderation (warning, mute, channel ban, black passport)
Appeal resolution
Jury open / close
Badge issuer approval
Cosmetic grants
Recovery resolution
Channel verification
```

Named testnet backup holder is documented in [admincap-custody.md](./admincap-custody.md). `NAMI_ADMIN_CAP_BACKUP_HOLDER` must be set on Render (not in frontend env).

### Hardening tests (Break-the-System)

```text
test_non_owner_cannot_update_channel
test_non_owner_cannot_create_channel_access_policy
test_non_owner_cannot_update_channel_access_policy
test_non_owner_cannot_update_profile
test_non_owner_cannot_borrow_admin_cap
```

### Residual on-chain risks (MVP)

```text
AdminCap loss = protocol admin lockout (use secure custody + recovery playbook)
No subscription-aware membership yet (upgrades are AdminCap-gated)
Delegated ModerationCap and MembershipCap ship from AdminCap; appeals/jury/recovery remain AdminCap-only
```

---

## Frontend (Phase 7 UI)

### Owner capability matrix

All sensitive UI actions map to `frontend/src/nami-capabilities.ts` and require `VITE_NAMI_OFFICIAL_OWNER`:

| Capability | Owner only |
|------------|------------|
| Core settings | Yes |
| Official Nami panels | Yes |
| Server maintenance | Yes |
| Nodename claim approval | Yes |
| Ban / lift enforcement | Yes |
| Jury control | Yes |
| Moderator promote / demote | Yes |

Official moderators (local list) are **read-only placeholders** until a future delegated-cap model ships. They cannot approve claims, ban users, or manage moderators in the current UI.

### Fixes applied

```text
saveOfficialModerators → writeOfficialModerators (owner-guarded)
canReviewClaims / canBanMembers → owner-only (removed moderator bypass)
NamiOwnerSettingsPanel → hidden unless official owner wallet is connected
```

### Residual frontend risks (demo / localStorage)

```text
localStorage can be edited in DevTools (demo-only; production must use on-chain AdminCap PTBs)
VITE_NAMI_DEMO_OWNER fallback must not ship to production with owner privileges
Indexer/backend maintenance controls are not wired yet (Phase 2+)
```

### FIEND owner display (test launch)

The connected official owner wallet is the only account that may show the **FIEND** rank label and galaxy/rainbow passport styling. This is enforced in `channel-surface.ts` via `isFiendMember()` (`member.isNamiBoss` set in `genesis-member.ts` when `resolveNamiAdminRole` matches `VITE_NAMI_OFFICIAL_OWNER`).

Complimentary Elite features use `hasComplimentaryMembershipAccess()` — display tier stays NPC at genesis; capability checks use `memberHasEliteAccess()`.

### Manual exploit checklist

1. Connect a non-owner wallet → Owner Settings panel must not render.
2. Set `nami.admin.moderators` in localStorage → still cannot pass owner guards without matching `VITE_NAMI_OFFICIAL_OWNER`.
3. Call `addOfficialModerator` from console without owner address → returns false.
4. Approve nodename claims as moderator address → blocked at store layer.

---

## Backend receiving server

### Officials sync (wallet auth)

| Control | Implementation |
|---------|----------------|
| Test launch auth | `NAMI_TEST_LAUNCH=true` requires wallet signature on `POST /api/officials/submissions/sync` |
| Owner merge scope | Official owner may full-merge queue |
| Member merge scope | Submitters may merge only their own tickets/claims/suggestions |
| Ops secret | Optional `NAMI_OFFICIALS_SYNC_SECRET` via `X-Nami-Officials-Sync` header — **server-only**, never `VITE_*` |
| CORS | `access-control-allow-origin: *` + `X-Nami-Officials-Sync` allowed header |

Verify: unsigned sync on test launch must return `officials_sync_auth_required`.

### Payment webhooks (membership)

| Route | Notes |
|-------|-------|
| `POST /api/payments/webhooks/stripe` | Stripe signature header validated when `STRIPE_WEBHOOK_SECRET` set |
| `POST /api/payments/webhooks/paypal` | PayPal webhook verification |
| Mock confirm | Disabled when `NAMI_TEST_LAUNCH=true` (`NAMI_PAYMENT_ALLOW_MOCK=false`) |

Treasury address (`NAMI_PAYMENT_TREASURY_ADDRESS`) is separate from AdminCap wallet.

### Phase 7.1 gift payments

| Route | Notes |
|-------|-------|
| `GET /api/gifts/catalog` | Public tier catalog + revenue split metadata |
| `POST /api/gifts/intents` | Wallet-bound sender; treasury routing on fulfill |
| `POST /api/gifts/intents/:id/crypto/confirm` | On-chain digest verification |
| `POST /api/gifts/webhooks/stripe` | Provider webhook — no browser CORS needed |
| `POST /api/gifts/webhooks/paypal` | Provider webhook — no browser CORS needed |
| `GET /api/gifts/recent` | Public fulfillment feed (no PII beyond display names) |

Revenue split defaults: creator 70% / channel owner 20% / platform 10% (`NAMI_GIFT_SPLIT_*`). Profile-only gifts roll channel-owner share into platform treasury.

Manual checks:

1. Create gift intent as wallet A; confirm crypto with wallet B → must fail sender mismatch.
2. Mock gift confirm on test launch → must be blocked.
3. Webhook replay without provider signature → must fail.

### Seal privacy (Phase 9.2)

| Route | Notes |
|-------|-------|
| `GET /api/privacy/status` | Readiness only — no key material |
| `POST /api/privacy/evidence/seal` | Owner-gated; AES-GCM envelope |
| `POST /api/privacy/evidence/list` | Owner-gated listing |
| `POST /api/privacy/evidence/open` | Owner-gated decrypt |

`NAMI_SEAL_EVIDENCE_KEY` (32-byte hex or base64) lives on Render only. Optional Walrus ciphertext offload via `seal-walrus-storage.service.ts`.

Verify script warns if `NAMI_SEAL_EVIDENCE_KEY` appears in committed `.env` files.

### CORS on sensitive browser routes

`backend/src/server.ts` applies:

```text
access-control-allow-origin: *
access-control-allow-methods: GET, POST, OPTIONS
access-control-allow-headers: Content-Type, X-Nami-Officials-Sync, Stripe-Signature
```

`verify-security-review.mjs` probes live `access-control-allow-origin` on officials, gifts, payments, and seal status routes.

---

## Phase 9 Walrus Sites + Seal

| Surface | Security note |
|---------|---------------|
| Walrus Sites SPA | Static assets only; no secrets in `ws-resources.json` |
| Walrus border art quilt | Public blobs; catalog attestation deferred |
| Seal ciphertext blobs | Encrypted at rest; blob IDs in projection — key never on Walrus |
| Launch Ops | `walrus_sites` + `seal_privacy` blocks on `/api/ops/launch-summary` |

---

## Pre-launch manual checklist

Run automated gate first: `node scripts/verify-security-review.mjs`

| # | Check | Owner sign-off | Date |
|---|-------|----------------|------|
| 1 | `NAMI_OFFICIAL_OWNER` matches connected FIEND wallet | | |
| 2 | AdminCap object owned by official owner (explorer) | | |
| 3 | `NAMI_ADMIN_CAP_BACKUP_HOLDER` set on Render | | |
| 4 | Backup holder contact rehearsed (testnet) | | |
| 5 | `VITE_NAMI_DEMO_OWNER` unset on Vercel | | |
| 6 | `NAMI_PAYMENT_ALLOW_MOCK=false` on Render | | |
| 7 | `NAMI_OFFICIALS_SYNC_SECRET` not in frontend env | | |
| 8 | Gift + membership webhooks registered at providers | | |
| 9 | Seal key only on Render (not in git `.env`) | | |
| 10 | Privacy draft shared with counsel (see privacy-guidelines-draft.md) | | |
| 11 | Community guidelines draft published on portal | | |
| 12 | Incident contacts in admincap-custody.md current | | |

---

## Related Docs

```text
docs/admincap-custody.md
docs/privacy-guidelines-draft.md
docs/admin.md
docs/access-control.md
docs/membership.md
scripts/verify-security-review.mjs
scripts/verify-testnet-ready.mjs
```