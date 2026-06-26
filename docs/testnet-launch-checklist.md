# Nami Testnet Launch Checklist

Official testnet builds use **test launch mode**: no fixture catalogs, no demo/simulation UI, and officials submissions persisted on the receiving server.

---

## 1. Move package (published)

Current testnet artifact: `deployments/testnet/latest.json`

```json
{
  "packageId": "0x74f2e6f200d7a814390b89e2e8a1c7d09fb49968a4362c8ab56e100e9573665f",
  "adminCapId": "0xf4ff9561a7b9dc736b6c9e47b1806fd2e9eeb5eb699e475f86bb82e0cb6258bd",
  "nodenameRegistryId": "0x68e1b656a5fbb5534577f64321fb466512e8534da8749821b085ac8687891fa7"
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

**Hackathon demo gate (BA-14 + testnet):**

```bash
node scripts/hackathon-demo-ready.mjs
```

Runs testnet env checks plus live Walrus border-art smoke. For bytes proof without browser zkLogin:

```bash
npx --prefix backend tsx scripts/smoke-border-art-walrus-local.mjs
```

In-app: official owner → Settings → **Hackathon demo**. See [mvp-demo-flow.md](./mvp-demo-flow.md).

**BA-14.2 migration (optional before `NAMI_WALRUS_BORDER_ART_REQUIRED=true`):**

```bash
node scripts/migrate-border-art-to-walrus.mjs --dry-run
node scripts/migrate-border-art-to-walrus.mjs
```

**Walrus quilt epoch renewal:** extend the catalog quilt blob before epochs expire (`walrus extend --blob-id {quiltBlobId}`). Launch Ops shows quilt blob id, patch count, and last publish ms.

**BA-14.4 attestation (post-hackathon):** keep `NAMI_CATALOG_ATTEST_ENABLED=false` until the submitted Move package is upgraded with `chat_overlay_catalog.move`.

**Phase 9.1 Walrus Sites (optional before hackathon):**

```bash
node scripts/deploy-walrus-sites.mjs --dry-run
node scripts/deploy-walrus-sites.mjs --epochs 5 --context testnet
```

See [walrus-sites-deploy.md](./walrus-sites-deploy.md). Set `NAMI_WALRUS_SITE_OBJECT_ID` on Render after first deploy.

---

## 4. Deploy (Vercel + Render)

**Render (backend receiving server)**

1. Connect repo → use `render.yaml` or create a Web Service with root build/start commands from that file.
2. Set env from `backend/.env.testnet.example` + your `deployments/testnet/latest.json` package IDs (or paste `deployments/testnet/render.env` after `node scripts/sync-deploy-env.mjs`).
3. **Walrus border art (BA-14.1):** ensure `NAMI_WALRUS_NETWORK=testnet` is set on Render (`render.yaml` includes Mysten testnet aggregator/publisher defaults). No signer key required on testnet.
4. Copy the public service URL (e.g. `https://nami-backend.onrender.com`).

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

## 7. Payment secrets (Render)

Set on the `nami-backend` Render service (never commit to git):

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Test `sk_test_...` from Stripe Dashboard → API keys |
| `STRIPE_PUBLISHABLE_KEY` | Test `pk_test_...` (same page) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from webhook destination (`whsec_...`) |
| `NAMI_PAYMENT_TREASURY_ADDRESS` | Sui wallet for crypto checkout + $GOON tips |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | PayPal sandbox credentials (optional until PayPal rail needed) |

**Stripe webhook (test mode)**

```text
Scope:     Your account
Event:     checkout.session.completed   (not payment_intent.succeeded or subscription events)
URL:       https://nami-backend-rv0o.onrender.com/api/payments/webhooks/stripe
```

Nami uses Checkout `mode: 'payment'` (one-time), not Stripe Billing subscriptions. After deploy, Settings → Launch Ops should show **Stripe: configured** and **card checkout: on**.

Smoke test:

```bash
stripe trigger checkout.session.completed
```

Check Stripe Dashboard → Webhooks → Event deliveries for HTTP 200. A bare CLI trigger may not activate a tier (no matching Nami `payment_id`); use a real membership checkout with test card `4242 4242 4242 4242` for end-to-end.

---

## 8. Security before public URL

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