# Nami Backend

## Purpose

The backend indexes Nami Sui events, builds replayable projections, and exposes a read-only HTTP API plus a receiving server for payments, media, preferences, and officials queues.

Use the **pinned testnet package** in `deployments/testnet/latest.json` until Phase 8 go-live. Local Move changes (e.g. Phase 1 membership expiration) do not require republishing while roadmap work continues.

## Architecture

```text
Sui RPC poll (NamiEventIndexer)
  → immutable JSONL event log (data/events.jsonl)
  → typed events (src/events.ts)
  → ProjectionRegistry services (guilds, channels, moderation, …)
  → HTTP API (server.ts) + receiving routes (payments, media, officials)
```

Replay rebuilds all projections from the event log without re-polling chain:

```bash
npm --prefix backend run replay
```

## Quick start (testnet, pinned package)

```bash
cd backend
npm install
cp .env.testnet.example .env
# Edit secrets: NAMI_OFFICIAL_OWNER, treasury, Stripe/PayPal, optional NAMI_ALERT_WEBHOOK_URL
npm run dev
```

Pinned IDs (2026-06-13 publish — do not republish until go-live):

```text
NAMI_PACKAGE_ID=0xd4ccad8f0687e31aaee2524db96c7a1d9509abaeadc949e0136c6522a631e058
NAMI_ADMIN_CAP_ID=0x170eaaa308ffb88096ebdc664bdcd27dc0a36ce42461fdb2422fb79657009edc
```

Refresh env from `latest.json`:

```bash
node scripts/sync-testnet-env.mjs --indexer-url https://your-api.example
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `NAMI_NETWORK` | `testnet` | `devnet`, `testnet`, `mainnet`, `localnet` |
| `NAMI_PACKAGE_ID` | — | Published Move package (required) |
| `NAMI_ADMIN_CAP_ID` | — | AdminCap object for fulfillment ops |
| `NAMI_TEST_LAUNCH` | `false` | Disables mock payments; enforces wallet auth policy |
| `NAMI_POLL_INTERVAL_MS` | `5000` | Indexer poll interval |
| `NAMI_CURSOR_PATH` | `data/cursors.json` | Per-module Sui event cursors |
| `NAMI_EVENT_LOG_PATH` | `data/events.jsonl` | Immutable indexed event log |
| `NAMI_HTTP_PORT` / `PORT` | `8787` | HTTP listen port |
| `NAMI_HTTP_ENABLED` | `true` | Set `false` to run indexer-only |
| `NAMI_ALERT_WEBHOOK_URL` | — | Optional POST webhook on repeated poll failures |
| `NAMI_ALERT_FAILURE_THRESHOLD` | `3` | Consecutive failures before alert fires |

See `.env.example` (local dev) and `.env.testnet.example` (official testnet).

## Ops endpoints

| Route | Description |
|-------|-------------|
| `GET /health` | Liveness — process up, indexer failure streak below threshold |
| `GET /ready` | Readiness — at least one successful poll completed (`503` until ready) |
| `GET /stats` | Event log + cursor + projection counts |

Probe a running server:

```bash
node scripts/verify-indexer.mjs --url http://localhost:8787
```

## Route catalog

### Discovery

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/discovery/channels` | Ranked channel discovery (`?limit=`, `?weekId=`) |
| GET | `/api/discovery/guilds` | Ranked guild discovery (`?limit=`) |

### Guilds

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/guilds` | All guild projections |
| GET | `/api/guilds/public` | Public guilds (`?limit=`) |
| GET | `/api/guilds/member/:member` | Guilds for member address |
| GET | `/api/guilds/:guildId` | Single guild |

### Squads

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/squads` | All squads |
| GET | `/api/squads/member/:member` | Squads for member |
| GET | `/api/squads/:squadId` | Single squad |

### Profiles

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/profiles` | All profiles |
| GET | `/api/profiles/public` | Public profiles (`?limit=`) |
| GET | `/api/profiles/owner/:owner` | Profile by owner address |
| GET | `/api/profiles/:profileId` | Single profile |

### Channels

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/channels` | All channels |
| GET | `/api/channels/public` | Public channels (`?limit=`) |
| GET | `/api/channels/verified` | Verified channels (`?limit=`) |
| GET | `/api/channels/owner/:owner` | Channels owned by address |
| GET | `/api/channels/:channelId` | Single channel |

### Channel access

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/channel-access` | All access policies |
| GET | `/api/channel-access/owner/:owner` | Policies for owner |
| GET | `/api/channel-access/channel/:channelId` | Policy for channel |

### Passport timelines

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/passports/timelines` | Timeline summaries (`?limit=`) |
| GET | `/api/passports/:passportId/timeline` | Full timeline (`?category=`, `?limit=`) |
| GET | `/api/passports/:passportId/timeline/snapshot` | Latest snapshot |

Timeline categories: `origin`, `progression`, `verification`, `conduct`, `customization`, `moderation`.

### Moderation

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/moderation` | All records |
| GET | `/api/moderation/active` | Active records (`?limit=`) |
| GET | `/api/moderation/passport/:passportId` | By passport |
| GET | `/api/moderation/target/:targetOwner` | By target owner |
| GET | `/api/moderation/:recordId` | Single record |

### Appeals & jury

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/appeals` | All appeals |
| GET | `/api/appeals/open` | Open appeals (`?limit=`) |
| GET | `/api/appeals/passport/:passportId` | By passport |
| GET | `/api/appeals/:appealId` | Single appeal |
| GET | `/api/jury` | All jury cases |
| GET | `/api/jury/open` | Open cases (`?limit=`) |
| GET | `/api/jury/appeal/:appealId` | Cases for appeal |
| GET | `/api/jury/:juryCaseId` | Single case |

### Recovery

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/recovery` | All requests |
| GET | `/api/recovery/open` | Open requests (`?limit=`) |
| GET | `/api/recovery/passport/:passportId` | By passport |
| GET | `/api/recovery/identity/:identityId` | By identity |
| GET | `/api/recovery/requester/:requester` | By requester |
| GET | `/api/recovery/:recoveryId` | Single request |

### Badge & boost history

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/badges/history` | All badge events |
| GET | `/api/badges/history/owner/:owner` | By owner (`?limit=`) |
| GET | `/api/badges/history/:entryId` | Single entry |
| GET | `/api/boosts/history` | All boost events |
| GET | `/api/boosts/history/owner/:owner` | By owner (`?limit=`) |
| GET | `/api/boosts/history/channel/:channelId` | By channel (`?limit=`) |
| GET | `/api/boosts/history/:entryId` | Single entry |

### Payments & membership (receiving server)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/payments/membership/config` | Payment provider config |
| POST | `/api/payments/membership/intents` | Create payment intent |
| GET | `/api/payments/membership/intents/:paymentId` | Intent status |
| POST | `/api/payments/membership/intents/:paymentId/mock/confirm` | Mock confirm (dev only) |
| POST | `/api/payments/membership/intents/:paymentId/crypto/confirm` | Crypto confirm |
| POST | `/api/payments/webhooks/stripe` | Stripe webhook |
| POST | `/api/payments/webhooks/paypal` | PayPal webhook |
| GET | `/api/memberships/subscriptions/owner/:owner` | Subscription state |
| POST | `/api/memberships/subscriptions/sync` | Sync subscription |
| GET | `/api/memberships/fulfillment/pending` | Pending on-chain fulfillment |
| GET | `/api/memberships/fulfillment/owner/:owner` | Owner fulfillment queue |
| POST | `/api/memberships/fulfillment/:fulfillmentId/complete` | Mark fulfilled |

### Preferences & media

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/member-preferences/owner/:owner` | Member avatar / streaming prefs |
| POST | `/api/member-preferences/sync` | Upsert (wallet-signed) |
| GET | `/api/channel-preferences/:channelId` | Channel cover prefs |
| POST | `/api/channel-preferences/sync` | Upsert (wallet-signed) |
| GET | `/api/studio-preferences/:studioId` | Studio logo prefs |
| POST | `/api/studio-preferences/sync` | Upsert (wallet-signed) |
| POST | `/api/media/avatar` | Upload avatar |
| POST | `/api/media/channel-cover` | Upload channel cover |
| POST | `/api/media/studio-logo` | Upload studio logo |
| GET | `/api/media/files/:owner/:filename` | Serve uploaded file |

### Officials (test launch)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/officials/submissions` | Officials review queue |
| POST | `/api/officials/submissions/sync` | Wallet-signed or secret sync |
| OPTIONS | `/api/officials/submissions` | CORS preflight |

## Testnet runbook

### 1. Configure (no republish)

```bash
node scripts/sync-testnet-env.mjs \
  --indexer-url https://api.your-domain.example \
  --zklogin-origin https://app.your-domain.example/
```

Confirm `backend/.env` matches `deployments/testnet/latest.json`.

### 2. Start indexer + receiving server

```bash
npm --prefix backend run dev
```

Wait for `[nami-indexer] no new events` or indexed events, then verify:

```bash
node scripts/verify-indexer.mjs --url http://localhost:8787
```

### 3. Persistence & backups

Back up these paths on the host (or volume):

```text
backend/data/events.jsonl      # immutable source of truth
backend/data/cursors.json      # poll cursors
backend/data/projections/      # derived views (rebuildable via replay)
backend/data/uploads/          # media uploads (if used)
```

Schedule daily copies. After restore, run replay to rebuild projections:

```bash
npm --prefix backend run replay
```

### 4. Replay verification

After backup restore or projection corruption:

```bash
npm --prefix backend run replay
npm --prefix backend run dev
curl -s http://localhost:8787/stats | head
```

Compare `eventLog.totalEvents` and projection counts before/after replay — they should match.

### 5. Health monitoring

Point uptime checks at:

```text
GET /health   — liveness (alert if HTTP non-200 or ok:false)
GET /ready    — readiness (alert if HTTP 503)
GET /stats    — drift detection (event count stalls, projection gaps)
```

Optional: set `NAMI_ALERT_WEBHOOK_URL` for automatic POST on consecutive poll failures (Slack/Discord/PagerDuty-compatible JSON body).

### 6. Phase 2 gate

```bash
./scripts/phase2-indexer-check.sh
# With live server:
NAMI_INDEXER_URL=http://localhost:8787 ./scripts/phase2-indexer-check.sh
```

### 7. Full testnet launch gate (Phase 8)

```bash
node scripts/verify-testnet-ready.mjs
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start indexer + HTTP server |
| `npm run replay` | Rebuild projections from event log |
| `npm run typecheck` | TypeScript check |
| `npm run build` / `npm start` | Compile and run `dist/main.js` |

## Projection services

Registered in `src/projection-registry.ts`:

```text
PassportTimelineService, ProfileService, ChannelService, ChannelAccessService,
ModerationService, AppealService, JuryService, SquadService, GuildService,
RecoveryService, BadgeHistoryService, BoostHistoryService
```