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
```

Officials queue projection: `backend/data/projections/officials-submissions.json`

Verify readiness:

```bash
node scripts/verify-testnet-ready.mjs
```

---

## 4. Frontend testnet build

Required values:

| Variable | Source |
|----------|--------|
| `VITE_NAMI_PACKAGE_ID` | `deployments/testnet/latest.json` |
| `VITE_NAMI_ADMIN_CAP_ID` | same |
| `VITE_NAMI_OFFICIAL_OWNER` | AdminCap holder wallet |
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

## 5. Smoke checks (test launch)

| Check | Expected |
|-------|----------|
| Game Hub directory empty without indexer rows | Empty state, no fixture channels |
| Demo perspective bar | Hidden |
| Passport claim Demo method | Hidden |
| Submit game ticket | Appears in officials API + Settings → Submissions |
| Submit user suggestion | Synced to `/api/officials/submissions` |
| Nodename claim | `@fiend` prefix enforced |
| Mock membership checkout | Disabled |

---

## 6. Security before public URL

- AdminCap custody: hold `AdminCap` in a dedicated wallet (`NAMI_OFFICIAL_OWNER`); never commit private keys; document backup holder
- `VITE_NAMI_DEMO_OWNER` unset on testnet builds
- `NAMI_PAYMENT_ALLOW_MOCK=false` on backend
- zkLogin redirect URIs locked to production/testnet origin only
- Officials `POST /api/officials/submissions/sync` requires wallet signature on test launch; official owner may merge all queues; members merge only their own entries
- Optional `NAMI_OFFICIALS_SYNC_SECRET` for server-side ops (header `X-Nami-Officials-Sync`) — never expose in frontend env

---

## Related docs

- [roadmap.md](./roadmap.md) — Phase 8.1
- [officials-submissions.md](./officials-submissions.md)
- [mvp-smoke-checklist.md](./mvp-smoke-checklist.md)