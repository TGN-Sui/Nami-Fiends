# Nami MVP Demo Flow

## Purpose

This document describes the presentable hackathon demo flow for Nami Chat.

The goal is to show that Nami is more than a chat app: it is a Sui-powered gaming identity, reputation, access, moderation, customization, and social protocol with Walrus-backed media (BA-14).

---

## Current MVP Status

```text
Move build: passing
Move tests: 55 passing
Backend typecheck: passing
Frontend typecheck/build: passing
Walrus border-art smoke (local): passing
Live receiving server: Render testnet indexer
Frozen Move package: no republish during hackathon review
On-chain catalog attestation: deferred (NAMI_CATALOG_ATTEST_ENABLED=false)
```

---

## Pre-demo gate (ops)

Run from repo root before a judge walkthrough:

```bash
node scripts/hackathon-demo-ready.mjs
```

This runs:

1. `verify-testnet-ready.mjs` — env files + live launch-ops summary
2. `smoke-border-art-walrus.mjs` — Walrus publisher/aggregator + catalog projection on Render

For **local Walrus proof without zkLogin**:

```bash
npx --prefix backend tsx scripts/smoke-border-art-walrus-local.mjs
```

---

## In-app demo console

Official owner → **Settings → Hackathon demo** (`owner-demo` nav).

The panel shows:

- Live readiness checks (chain, indexer, test-launch, Walrus, catalog patches, attestation deferred)
- Six judge-facing steps with **Go** shortcuts
- Ops commands when browser zkLogin cannot sign owner publish

**Dashboard Perspectives** (Settings → Membership) still work for tier previews. The **Nami Official Owner** preset now lands on the Hackathon demo console instead of Border Art directly.

---

## Judge walkthrough (~6–8 min)

| Step | What to show | Where |
|------|----------------|-------|
| 1. Portable identity | Google zkLogin **or** Dashboard Perspectives (Pro / Elite) | Membership |
| 2. Genre lounges | Hub bubbles, open a game channel profile | Hub |
| 3. Chat borders | Equip a preset border on messages | Look & feel |
| 4. Walrus BA-14 | Quilt publish path, Launch Ops Walrus card | Border Art + Launch ops |
| 5. Protocol reads | Indexed channels, guilds, discovery | Indexed data |
| 6. Frozen package | Attestation off; Walrus + projection = media truth | Hackathon demo |

### zkLogin caveat

Owner quilt publish in the browser requires a **signable zkLogin session**. If signing keys are missing, demo steps 1–3 and 5–6 still work; cite local Walrus smoke for step 4 bytes proof.

---

## Environment (hackathon)

| Variable | Setting |
|----------|---------|
| `NAMI_CATALOG_ATTEST_ENABLED` | unset or `false` |
| `NAMI_WALRUS_NETWORK` | `testnet` on Render |
| `NAMI_REQUIRE_WALLET_AUTH` | `true` on Render |
| `VITE_NAMI_TEST_LAUNCH` | `true` on Vercel |
| `VITE_NAMI_OFFICIAL_OWNER` | official owner address |

Live backend: `https://nami-backend-rv0o.onrender.com`

---

## Post-hackathon slices (not in this demo)

- Move package upgrade → enable `NAMI_CATALOG_ATTEST_ENABLED`
- Phase 9.1 Walrus Sites
- Live catalog seed via app when zkLogin stable or ops-secret publish path