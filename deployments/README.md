# Nami Deployments

## Purpose

This folder stores deployment outputs and summaries for Nami Move package publishes.

Raw publish JSON files are saved per network.

Deployment summaries should be saved as `latest.json` for backend/frontend configuration.

## Republish policy (roadmap)

**Defer testnet republish until Phase 8 go-live** unless a blocking on-chain bug requires it.

Local Move changes (Phase 1 membership expiration, admin caps, etc.) are validated with `sui move test` and ship in one batched publish at launch. This saves testnet SUI during Phases 2–7.

Continue indexing and frontend/SDK work against the pinned package in `deployments/testnet/latest.json`.

## Local testnet (recommended for day-to-day dev)

Full step-by-step: **[docs/local-testnet-dev.md](../docs/local-testnet-dev.md)**

Quick start after `git pull origin main`:

```bash
npm --prefix sdk install && npm --prefix sdk run build
npm --prefix backend install && npm --prefix frontend install

node scripts/sync-testnet-env.mjs \
  --indexer-url http://127.0.0.1:8787 \
  --official-owner 0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca \
  --official-owner-email robbier640@gmail.com \
  --zklogin-origin http://localhost:5173/

npm --prefix backend run dev
# second terminal:
npm --prefix frontend run dev
```

Open **http://localhost:5173/** — register `http://localhost:5173/` in Google OAuth redirect URIs ([testnet-zklogin.md](../docs/testnet-zklogin.md)).

---

## Testnet workflow

```bash
# Local protocol gate (build + 82 Move tests) — no chain publish
./scripts/phase1-protocol-check.sh

# Phase 2 indexer gate (typecheck + optional live probe)
./scripts/phase2-indexer-check.sh
# NAMI_INDEXER_URL=http://localhost:8787 ./scripts/phase2-indexer-check.sh

# Phase 4 SDK gate (build + unit tests + optional integration)
./scripts/phase4-sdk-check.sh
# NAMI_INDEXER_URL=http://localhost:8787 ./scripts/phase4-sdk-check.sh

# Phase 5 zkLogin gate (policy tests + env verification)
./scripts/phase5-zklogin-check.sh

# Phase 8 deploy gate (env + public URL probes + production build)
./scripts/phase8-deploy-check.sh
# node scripts/verify-public-deploy.mjs  # public URL only

# Refresh local env from existing latest.json (no republish)
node scripts/sync-testnet-env.mjs --indexer-url http://127.0.0.1:8787 --zklogin-origin http://localhost:5173/

# Generate Render + Vercel bulk env from latest.json (after you have public URLs)
node scripts/sync-deploy-env.mjs \
  --render-url https://nami-backend.onrender.com \
  --vercel-url https://your-app.vercel.app \
  --apply-local
# Paste deployments/testnet/render.env + vercel.env into each dashboard, redeploy, then:
# node scripts/verify-public-deploy.mjs

# Probe indexer ops endpoints
node scripts/verify-indexer.mjs --url http://localhost:8787

# Full testnet launch gate (Phase 8)
node scripts/verify-testnet-ready.mjs
```

When go-live requires a new publish:

```bash
./scripts/publish-package.sh testnet
# or: ./scripts/publish-testnet.sh
node scripts/sync-testnet-env.mjs --indexer-url https://api.example --zklogin-origin https://app.example/
```

Current testnet `latest.json` package: see file under `deployments/testnet/` (published 2026-06-23).

## Networks

```text
deployments/devnet/
deployments/testnet/