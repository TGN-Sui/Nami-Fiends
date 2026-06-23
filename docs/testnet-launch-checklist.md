# Nami Testnet Launch Checklist

Official testnet builds use **test launch mode**: no fixture catalogs, no demo/simulation UI, and officials submissions persisted on the receiving server.

---

## 1. Move package (published)

Current testnet artifact: `deployments/testnet/latest.json`

```json
{
  "packageId": "0xd4ccad8f0687e31aaee2524db96c7a1d9509abaeadc949e0136c6522a631e058",
  "adminCapId": "0x170eaaa308ffb88096ebdc664bdcd27dc0a36ce42461fdb2422fb79657009edc"
}
```

**Contract health (2026-06-19):** `sui move test` — 80 passing. No republish required unless Move sources changed since `latest.json`.

Republish when contracts change:

```bash
./scripts/publish-testnet.sh
# Or manually: node scripts/extract-testnet-latest.mjs deployments/testnet/publish-*.json
```

---

## 2. Sync environment files

```bash
node scripts/sync-testnet-env.mjs \
  --indexer-url http://127.0.0.1:8787 \
  --official-owner 0xYOUR_OFFICIAL_OWNER \
  --zklogin-origin http://localhost:5173/
```

Writes `backend/.env` and `frontend/.env.local` with test-launch flags and package IDs from `latest.json`.

Templates: `backend/.env.testnet.example`, `frontend/.env.testnet.example`

zkLogin OAuth setup: [testnet-zklogin.md](./testnet-zklogin.md)

---

## 3. Backend receiving server

```bash
npm --prefix backend install
npm --prefix backend run dev
```

Verify:

```bash
curl http://127.0.0.1:8787/health
curl http://127.0.0.1:8787/api/officials/submissions
curl http://127.0.0.1:8787/api/ops/launch-summary
```

Officials queue projection: `backend/data/projections/officials-submissions.json`

Verify readiness:

```bash
node scripts/verify-testnet-ready.mjs
```

---

## 4. Deploy (Vercel + Render)

**Render (backend receiving server)**

1. Connect repo → use `render.yaml` or create a Web Service with root build/start commands from that file.
2. Set env from `backend/.env.testnet.example` + your `deployments/testnet/latest.json` package IDs.
3. Copy the public service URL (e.g. `https://nami-backend.onrender.com`).

**Vercel (frontend)**

1. Set project root to `frontend/`.
2. Build: `npm install && npm run build` (monorepo: build `../sdk` first if `@nami/sdk` link fails — use install script below).
3. Set env vars from `frontend/.env.testnet.example`; set `VITE_NAMI_INDEXER_URL` to your Render URL.
4. Add the Vercel origin to Google OAuth (zkLogin) redirect URIs — must match `VITE_ZKLOGIN_REDIRECT_URL` exactly.

Vercel uses `frontend/vercel.json` to build the local SDK before the app (`@nami/sdk` is `file:../sdk` and `dist/` is not committed). Override install command only if you removed that file:

```bash
npm --prefix ../sdk install && npm --prefix ../sdk run build && npm install
```

**Owner access on deploy:** Advanced settings require Google zkLogin as `VITE_NAMI_OFFICIAL_OWNER_EMAIL`; the derived address must match `VITE_NAMI_OFFICIAL_OWNER`. Onboarding email alone does not grant owner tools.

---

## 5. Frontend testnet build

Required values:

| Variable | Source |
|----------|--------|
| `VITE_NAMI_PACKAGE_ID` | `deployments/testnet/latest.json` |
| `VITE_NAMI_ADMIN_CAP_ID` | same |
| `VITE_NAMI_OFFICIAL_OWNER` | AdminCap holder wallet (FIEND galaxy styling when connected) |
| `VITE_NAMI_OFFICIAL_OWNER_EMAIL` | Owner Google account for zkLogin |
| `VITE_NAMI_INDEXER_URL` | receiving server public URL |
| `VITE_NAMI_TEST_LAUNCH` | `true` |
| `VITE_NAMI_DEV_FIXTURES` | `false` (auto-forced when test launch is true) |
| `VITE_ZKLOGIN_*` | Google OAuth + redirect for deploy origin |

Build:

```bash
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
```

---

## 6. Smoke checks (test launch)

| Check | Expected |
|-------|----------|
| Game Hub directory empty without indexer rows | Empty state, no fixture channels |
| Demo perspective bar | Hidden |
| Passport claim Demo method | Hidden |
| Submit game ticket | Appears in officials API + Settings → Submissions |
| Submit user suggestion | Synced to `/api/officials/submissions` |
| Nodename claim | `@fiend` prefix enforced |
| Mock membership checkout | Disabled |
| New user passport | Level 1, 0 XP, NPC tier, onboarding badge only |
| Official owner signed in | **FIEND** label, galaxy passport, rainbow avatars; Elite features without payment |
| Dev fixture progression (lvl 18+) | Absent on test launch |

---

## 7. Security before public URL

- AdminCap custody: [admincap-custody.md](./admincap-custody.md) — primary holder, backup holder, loss scenarios
- Privacy + community drafts: [privacy-guidelines-draft.md](./privacy-guidelines-draft.md), [community-guidelines-draft.md](./community-guidelines-draft.md)
- `VITE_NAMI_DEMO_OWNER` unset on testnet builds
- `NAMI_PAYMENT_ALLOW_MOCK=false` on backend
- zkLogin redirect URIs locked to production/testnet origin only
- Officials `POST /api/officials/submissions/sync` requires wallet signature on test launch; official owner may merge all queues; members merge only their own entries
- Optional `NAMI_OFFICIALS_SYNC_SECRET` for server-side ops (header `X-Nami-Officials-Sync`) — never expose in frontend env

Public deploy probe:

```bash
node scripts/verify-public-deploy.mjs
```

---

## Related docs

- [roadmap.md](./roadmap.md) — Phase 8.1
- [officials-submissions.md](./officials-submissions.md)
- [mvp-smoke-checklist.md](./mvp-smoke-checklist.md)