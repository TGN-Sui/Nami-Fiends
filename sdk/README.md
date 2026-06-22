# @nami/sdk

TypeScript SDK for the Nami Sui protocol — on-chain reads, event polling, and indexer projection clients.

Use the **pinned testnet package** in `deployments/testnet/latest.json` until Phase 8 go-live. Local Move changes do not require republishing while roadmap work continues.

## Install

```bash
cd SDK
npm install
npm run build
```

Monorepo consumers:

```json
{
  "dependencies": {
    "@nami/sdk": "file:../SDK"
  }
}
```

## Quick start

### On-chain client

```typescript
import { createNamiClient, loadPassportProtocolView } from '@nami/sdk';

const chain = createNamiClient({
  network: 'testnet',
  packageId: '0xd4ccad8f0687e31aaee2524db96c7a1d9509abaeadc949e0136c6522a631e058',
});

const passport = await loadPassportProtocolView(chain, '0xPASSPORT_ID');
```

Pinned testnet IDs (2026-06-13):

```text
packageId: 0xd4ccad8f0687e31aaee2524db96c7a1d9509abaeadc949e0136c6522a631e058
```

### Indexer client

```typescript
import { createNamiIndexerClient } from '@nami/sdk';

const indexer = createNamiIndexerClient({
  baseUrl: 'https://your-receiving-server.example',
});

const health = await indexer.getHealth();
const channels = await indexer.getDiscoveryChannels(20);
const appeals = await indexer.getOpenAppeals();
```

## Chain reads

| Helper | Description |
|--------|-------------|
| `loadIdentityProtocolView` | Identity object + linked passport |
| `loadPassportProtocolView` | Passport stats, tier, conduct |
| `loadProfileProtocolView` | Public profile metadata |
| `loadMembershipProtocolView` | Tier + reputation summary |
| `loadConductProtocolView` | Conduct signal state |
| `loadCustomizationProtocolView` | Titles + cosmetics |
| `loadSquadsProtocolView` | Squads for a member |
| `loadGuildCardsForMember` | Guild cards for a member |
| `loadChannelCardsForOwner` | Channels owned by address |
| `loadOwnerChannelAccessPolicies` | Access policies for owner |
| `checkChannelAccessRead` | Read-only access check |

Parsers: `parsePassportObject`, `parseGuildObject`, `parseChannelObject`, etc.

## Event polling (on-chain)

```typescript
import { fetchNamiModuleEvents, subscribeToNamiEvents } from '@nami/sdk';

const page = await fetchNamiModuleEvents(chain, 'passport', { limit: 25 });

const stop = subscribeToNamiEvents(chain, 'moderation', (events) => {
  console.log(events.data.length, 'new moderation events');
}, { pollIntervalMs: 12_000 });

// later: stop();
```

## Indexer projections (HTTP)

### One-shot reads

| Method | Route |
|--------|-------|
| `getHealth()` | `/health` |
| `getReady()` | `/ready` |
| `getStats()` | `/stats` |
| `getGuilds()` | `/api/guilds` |
| `getSquads()` | `/api/squads` |
| `getProfiles()` | `/api/profiles` |
| `getChannels()` | `/api/channels` |
| `getChannelAccessPolicies()` | `/api/channel-access` |
| `getAppeals()` / `getOpenAppeals()` | `/api/appeals` |
| `getJuryCases()` / `getOpenJuryCases()` | `/api/jury` |
| `getRecoveryRequests()` | `/api/recovery` |
| `getActiveModerationRecords()` | `/api/moderation/active` |
| `getPassportTimeline(id)` | `/api/passports/:id/timeline` |
| `getBadgeHistoryByOwner(owner)` | `/api/badges/history/owner/:owner` |
| `getBoostHistoryByOwner(owner)` | `/api/boosts/history/owner/:owner` |
| `getDiscoveryChannels(limit)` | `/api/discovery/channels` |
| `getDiscoveryGuilds(limit)` | `/api/discovery/guilds` |

### Subscribe helpers (poll-based)

Unified dispatcher:

```typescript
import {
  createNamiIndexerClient,
  subscribeToIndexerProjection,
  NAMI_INDEXER_SUBSCRIPTION_KEYS,
} from '@nami/sdk';

const indexer = createNamiIndexerClient({ baseUrl: 'http://localhost:8787' });

const stop = subscribeToIndexerProjection(indexer, 'appeals', (snapshot) => {
  console.log(snapshot.polledAt, snapshot.data.length);
});
```

Dedicated helpers:

```text
subscribeToGuildProjections
subscribeToSquadProjections
subscribeToProfileProjections
subscribeToChannelProjections
subscribeToChannelAccessProjections
subscribeToModerationProjections
subscribeToAppealProjections
subscribeToJuryProjections
subscribeToRecoveryProjections
subscribeToDiscoveryChannelRankings
subscribeToDiscoveryGuildRankings
subscribeToPassportTimeline(passportId, ...)
subscribeToBadgeHistory(owner, ...)
subscribeToBoostHistory(owner, ...)
```

`NAMI_INDEXER_SUBSCRIPTION_KEYS` lists keys supported by `subscribeToIndexerProjection`.

## Transactions

```typescript
import { enterNamiMoveTarget, validateEnterNamiParams } from '@nami/sdk';

const target = enterNamiMoveTarget(chain, { /* EnterNami params */ });
```

## Labels

```typescript
import { membershipTierLabel, conductSignalLabel, reputationLabel, shortAddress } from '@nami/sdk';
```

## Verification

```bash
# Unit tests (always)
npm --prefix SDK run test

# Build gate
npm --prefix SDK run build

# Live indexer probe (optional)
NAMI_INDEXER_URL=http://localhost:8787 node scripts/verify-sdk-indexer.mjs

# Full Phase 4 gate
./scripts/phase4-sdk-check.sh
```

Integration tests in `src/indexer-integration.test.ts` run when `NAMI_INDEXER_URL` is set:

```bash
NAMI_INDEXER_URL=http://localhost:8787 \
NAMI_PACKAGE_ID=0xd4ccad8f0687e31aaee2524db96c7a1d9509abaeadc949e0136c6522a631e058 \
npm --prefix SDK run test
```

## CI / MVP check

`scripts/mvp-check.sh` and `scripts/phase4-sdk-check.sh` run SDK typecheck, build, and unit tests. No testnet republish required.

## Package layout

```text
SDK/src/
  client.ts              Sui JSON-RPC wrapper
  reads.ts               High-level protocol views
  parsers.ts             Move object parsers
  events.ts              On-chain event fetch + subscribe
  indexer-client.ts      HTTP projection client
  indexer-subscriptions.ts  Poll-based indexer subscribe helpers
  projections.ts         Indexer response types
  transactions.ts        Enter Nami tx helper
  labels.ts              Display labels
```