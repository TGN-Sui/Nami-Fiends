# Local testnet development

Use this workflow when you want the **latest code** on your machine with the **pinned testnet Move package** (`deployments/testnet/latest.json`), a **local receiving server**, and **Google zkLogin** on `http://localhost:5173/`.

Public deploys (Vercel + Render) stay documented in [testnet-launch-checklist.md](./testnet-launch-checklist.md). Walrus Sites portal is optional — see [walrus-sites-deploy.md](./walrus-sites-deploy.md).

---

## 1. Sync the repo

```bash
git fetch origin
git pull origin main
```

If you have local edits, stash first: `git stash push -u -m "wip"` then `git stash pop` after pull.

Current production tip (2026-06): commit `0a28cee` on `main`.

---

## 2. Install dependencies

```bash
npm --prefix sdk install && npm --prefix sdk run build
npm --prefix backend install
npm --prefix frontend install
```

---

## 3. Generate local env files

Reads package IDs from `deployments/testnet/latest.json` and writes `backend/.env` + `frontend/.env.local`.

```bash
node scripts/sync-testnet-env.mjs \
  --indexer-url http://127.0.0.1:8787 \
  --official-owner 0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca \
  --official-owner-email robbier640@gmail.com \
  --zklogin-origin http://localhost:5173/
```

Replace `--official-owner` with your zkLogin address if different. The email must match the Google account you use to sign in.

**Google OAuth (required once per machine):** In [Google Cloud Console](https://console.cloud.google.com/) → Credentials → your OAuth client, add:

| Field | Value |
|--------|--------|
| Authorized JavaScript origins | `http://localhost:5173` |
| Authorized redirect URIs | `http://localhost:5173/` |

Details: [testnet-zklogin.md](./testnet-zklogin.md)

Verify:

```bash
node scripts/verify-zklogin-config.mjs
```

---

## 4. Start the receiving server

```bash
npm --prefix backend run dev
```

Health checks:

```bash
curl http://127.0.0.1:8787/health
curl http://127.0.0.1:8787/api/ops/launch-summary
```

---

## 5. Start the frontend

In a second terminal:

```bash
npm --prefix frontend run dev
```

Open **http://localhost:5173/**

### Chats, events, and calendar (local showcase)

Public test launch (`VITE_NAMI_TEST_LAUNCH=true`) ships with **empty** discovery on remote deploys. Locally, Nami auto-detects `VITE_NAMI_INDEXER_URL=http://127.0.0.1:8787` and enables **local dev showcase**:

- Game Hub channels and member spotlight (showcase catalog)
- Seeded hub events and guild events (calendar + My Events)
- Full global chat lounges (not only Official Nami Global)
- Lounge layout mocks for genre/member pickers

If surfaces stay empty after upgrading, hard-refresh once or clear stale browser storage:

```javascript
// DevTools console — optional reset
localStorage.removeItem('nami.user.stored-events');
localStorage.removeItem('nami.deleted-event-ids');
location.reload();
```

Force off showcase (empty public-style UI on localhost): set `VITE_NAMI_LOCAL_DEV=false` in `frontend/.env.local`.

---

## 6. Owner tools and border art (local)

1. Sign in with **Google zkLogin** as the official owner email.
2. **Settings** → confirm **Owner mode** and **Wallet check** (addresses match).
3. **Owner console → Border Art** — upload borders and save; sync hits `POST /api/platform/chat-overlay-rewards/sync` on your local backend.

Smoke Walrus border art (local backend + Mysten testnet):

```bash
node scripts/smoke-border-art-walrus.mjs --indexer-url http://127.0.0.1:8787
```

---

## 7. Readiness gates

```bash
node scripts/verify-testnet-ready.mjs
node scripts/verify-zklogin-config.mjs
```

Optional protocol gates:

```bash
./scripts/phase1-protocol-check.sh
NAMI_INDEXER_URL=http://127.0.0.1:8787 ./scripts/phase2-indexer-check.sh
```

---

## Local vs public deploy

| Concern | Local | Public (Vercel + Render) |
|---------|--------|---------------------------|
| Frontend URL | `http://localhost:5173/` | `https://nami-fiends.vercel.app/` |
| Backend URL | `http://127.0.0.1:8787` | `https://nami-backend-rv0o.onrender.com` |
| Env generator | `scripts/sync-testnet-env.mjs` | `scripts/sync-deploy-env.mjs` |
| zkLogin redirect | `http://localhost:5173/` | `https://nami-fiends.vercel.app/` |
| Walrus Sites portal | Optional (bun portal) | Optional cutover |

Regenerate **public** bulk env when URLs change:

```bash
node scripts/sync-deploy-env.mjs \
  --render-url https://nami-backend-rv0o.onrender.com \
  --vercel-url https://nami-fiends.vercel.app
```

Outputs: `deployments/testnet/render.env`, `deployments/testnet/vercel.env` (paste into dashboards, redeploy).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `redirect_uri_mismatch` on Google sign-in | Register `http://localhost:5173/` in OAuth redirect URIs; use exact localhost URL, not Vercel. |
| `wallet_auth_required` on sync | Sign in with zkLogin; confirm `VITE_NAMI_REQUIRE_WALLET_AUTH=true` and owner address matches. |
| Border art not on server | Check Network for `chat-overlay-rewards/sync` → 200; run smoke script above. |
| `EADDRINUSE` on 8787 | Stop other backend instances or change `NAMI_HTTP_PORT` in `backend/.env`. |
| Owner console hidden | Set `VITE_NAMI_OFFICIAL_OWNER` to your zkLogin address, restart `npm run dev`. |
| Empty chats / events / calendar | Confirm `VITE_NAMI_INDEXER_URL=http://127.0.0.1:8787`; restart frontend; clear `nami.user.stored-events` if needed. |

---

## Related docs

- [deployments/README.md](../deployments/README.md) — publish workflow and env scripts
- [testnet-launch-checklist.md](./testnet-launch-checklist.md) — full launch / Render / Vercel
- [testnet-zklogin.md](./testnet-zklogin.md) — OAuth client setup
- [walrus-sites-deploy.md](./walrus-sites-deploy.md) — Phase 9.1 static SPA (optional)