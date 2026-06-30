# Nami Privacy Guidelines (Draft)

Draft for testnet launch review. Not legal advice — finalize with counsel before mainnet.

---

## Scope

This draft covers the official Nami web portal, receiving server (indexer + HTTP API), and on-chain protocol interactions during testnet.

---

## Data we collect

| Category | Examples | Storage |
|----------|----------|---------|
| Wallet identity | Sui address, zkLogin subject (hashed salt) | Browser session + optional local prefs |
| Profile & passport | Display name, badges, XP (on-chain + cached indexer) | Sui + receiving server projections |
| Officials submissions | Game tickets, suggestions, nodename claims | `backend/data/projections/` |
| Payments (when enabled) | Stripe/PayPal intent metadata | Provider + receiving server logs |
| Gift payments (Phase 7.1) | Gift tier, sender/recipient display names, revenue split metadata, fulfillment tx digest | `gift-payments.json` projection + provider dashboards |
| Sealed evidence (Phase 9.2) | Encrypted appeal/moderation packets (ciphertext + IV + auth tag); optional Walrus blob ID | `sealed-evidence.json` projection; key on Render only |
| Walrus-hosted static assets | SPA bundle, border-art quilt patches, Seal ciphertext blobs | Walrus Sites / Quilt (public blobs; no user PII in static SPA) |
| Media uploads | Channel banners, profile photos | Receiving server / object storage |
| Analytics (basic) | Page views, error rates | Hosting provider (Vercel/Render) |

We do **not** store Google passwords. zkLogin uses OAuth; only tokens needed for session derivation are held client-side.

---

## Data we do not sell

Nami does not sell personal data. Testnet builds disable demo/fixture personas — live data reflects real user actions only.

---

## On-chain transparency

Passport, badge, and moderation state written to Sui is **public by design**. Users should treat on-chain display names, badges, and enforcement flags as visible to anyone with a block explorer.

---

## Retention

| Data | Retention (testnet draft) |
|------|---------------------------|
| Officials submissions | Until merged/archived by owner; backup with server volume |
| Gift fulfillments | Projection + provider logs until ops archive |
| Sealed evidence | Until appeal/recovery closed; owner may purge projection after resolution |
| Walrus blobs | Until storage epochs expire; renew via ops scripts |
| Indexer event log | `data/events.jsonl` — rotate/compress per ops policy |
| Payment logs | Per provider default (Stripe dashboard) |
| Local browser prefs | Until user clears site data |

---

## User controls

```text
Sign out — clears zkLogin session in browser
Export — on-chain data viewable via explorer; no full export UI on testnet
Deletion — contact support; on-chain objects may require owner-assisted recovery flow
```

---

## Third parties

| Service | Purpose |
|---------|---------|
| Google OAuth | zkLogin sign-in |
| Mysten salt API | zkLogin address derivation (default testnet) |
| Sui testnet RPC | Chain reads/writes |
| Stripe / PayPal | Membership + gift checkout (when configured) |
| Walrus (testnet) | Static SPA, border art, optional Seal ciphertext storage |
| Vercel / Render | Hosting |

Each provider has its own privacy policy. Minimize shared fields in checkout metadata.

---

## Security measures (testnet)

```text
HTTPS on public deploy origins
NAMI_OFFICIALS_SYNC_SECRET server-only (never in frontend env)
Wallet signature required for officials sync on test launch
Mock payment providers disabled when NAMI_TEST_LAUNCH=true
Gift webhooks verified at provider; treasury separate from AdminCap
Seal evidence key server-only (NAMI_SEAL_EVIDENCE_KEY on Render)
```

See [admincap-custody.md](./admincap-custody.md) and [security-audit.md](./security-audit.md).

---

## LEGAL_REVIEW_STATUS

**Status:** `pending` — draft for counsel review; not legal advice.

| # | Counsel checklist item | Status | Counsel initial / date |
|---|------------------------|--------|------------------------|
| 1 | Privacy policy scope covers portal, API, on-chain, and Walrus-hosted assets | pending | |
| 2 | Gift payment flows (Stripe/PayPal/crypto/$GOON) — processor terms + user notice | pending | |
| 3 | Sealed evidence handling — lawful basis, retention, access controls | pending | |
| 4 | zkLogin / OAuth disclosures and third-party list accuracy | pending | |
| 5 | On-chain public-by-design notice sufficient for passport/moderation data | pending | |
| 6 | Minors / age gate (if required for gaming community) | pending | |
| 7 | GDPR / CCPA applicability and DPA needs with Stripe, PayPal, Google | pending | |
| 8 | Cookie / analytics consent if tracking expands beyond hosting logs | pending | |
| 9 | Data subject request process (access, deletion, correction) | pending | |
| 10 | Testnet vs mainnet disclaimer language | pending | |
| 11 | Community guidelines alignment with privacy commitments | pending | |
| 12 | Incident notification obligations (breach playbook cross-ref admincap-custody) | pending | |

**Human-only before mainnet:** engage qualified counsel; do not treat this draft as compliance sign-off.

---

## Contact

Publish a support email or form URL on the testnet portal before go-live. Recovery hints in onboarding reference this channel.

---

## Open items before mainnet

```text
[ ] Cookie/consent banner if analytics expand
[ ] Formal DPA with payment processors
[ ] GDPR/CCPA mapping with legal review
[ ] Data processing records for media retention
[ ] Counsel sign-off on LEGAL_REVIEW_STATUS table above
```