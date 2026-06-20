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

Republish when contracts change:

```bash
cd contracts/nami
sui client publish --gas-budget 500000000
# Copy output into deployments/testnet/latest.json
```

---

## 2. Backend receiving server

```bash
cp backend/.env.example backend/.env
# Set NAMI_PACKAGE_ID + NAMI_ADMIN_CAP_ID from latest.json
# Testnet: NAMI_PAYMENT_ALLOW_MOCK=false
npm --prefix backend install
npm --prefix backend run dev
```

Verify:

```bash
curl http://127.0.0.1:8787/health
curl http://127.0.0.1:8787/api/officials/submissions
```

Officials queue projection: `backend/data/projections/officials-submissions.json`

---

## 3. Frontend testnet build

```bash
cp frontend/.env.testnet.example frontend/.env.local
```

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

## 4. Smoke checks (test launch)

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

## 5. Security before public URL

- AdminCap custody documented
- `VITE_NAMI_DEMO_OWNER` unset on testnet builds
- `NAMI_PAYMENT_ALLOW_MOCK=false` on backend
- zkLogin redirect URIs locked to production/testnet origin only
- Officials submissions API auth hardening (planned — currently best-effort sync)

---

## Related docs

- [roadmap.md](./roadmap.md) — Phase 8.1
- [officials-submissions.md](./officials-submissions.md)
- [mvp-smoke-checklist.md](./mvp-smoke-checklist.md)