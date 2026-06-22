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
| Stripe / PayPal | Membership checkout (when configured) |
| Vercel / Render | Hosting |

Each provider has its own privacy policy. Minimize shared fields in checkout metadata.

---

## Security measures (testnet)

```text
HTTPS on public deploy origins
NAMI_OFFICIALS_SYNC_SECRET server-only (never in frontend env)
Wallet signature required for officials sync on test launch
Mock payment providers disabled when NAMI_TEST_LAUNCH=true
```

See [admincap-custody.md](./admincap-custody.md) and [security-audit.md](./security-audit.md).

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
```