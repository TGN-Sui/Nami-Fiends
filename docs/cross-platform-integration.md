# Cross-platform Nami integration

Partner platforms can let users sign in with **zkLogin** (or any Sui wallet) and reuse their existing Nami passport without a second claim. Wallet ownership of the linked **Identity** + **Passport** objects is the cryptographic proof.

---

## Proof model

| Layer | What proves identity | Where it lives |
|-------|----------------------|----------------|
| On-chain | Owns `Identity` + `Passport` at the same address; `identity.passport_id` ↔ `passport.identity_id` | Sui fullnode (`getOwnedObjects`) |
| Off-chain | Display name, avatar URL, claim status, progression snapshots | Nami indexer API |
| Optional auth | Personal-message signature (`nami-auth:v1:…`) when `NAMI_REQUIRE_WALLET_AUTH=true` | Partner backend → Nami API |

A user who minted with zkLogin on Nami.chat keeps the **same derived address** on your platform. No re-claim is required.

---

## Quickstart (TypeScript)

```typescript
import {
  createNamiClient,
  createNamiIndexerClient,
  isVerifiedNamiMember,
  resolveNamiMemberFromWallet,
} from '@nami/sdk';

const chain = createNamiClient({
  packageId: process.env.NAMI_PACKAGE_ID!,
  network: 'testnet',
});

const indexer = createNamiIndexerClient({
  baseUrl: 'https://your-nami-indexer.example',
});

// 1. User completes zkLogin on your site → `owner` address
const member = await resolveNamiMemberFromWallet(chain, indexer, owner);

if (!isVerifiedNamiMember(member)) {
  // No passport yet — send to Nami claim / enter_nami flow
  return;
}

// 2. Use immutable anchor + off-chain hydration
const nodename = member.anchor.nodename;
const tier = member.progression?.membershipTierLabel;

// 3. Optional: fetch merged bundle from Nami API
const response = await fetch(
  `https://your-nami-indexer.example/api/nami/linked-profile/${owner}`
);
const { linkedProfile } = await response.json();
```

### Wallet-auth sync (when required)

```typescript
const timestampMs = Date.now();
const message = `nami-auth:v1:${owner.toLowerCase()}:${timestampMs}`;
const { signature } = await zkLoginKeypair.signPersonalMessage(new TextEncoder().encode(message));

await fetch('https://your-nami-indexer.example/api/nami/linked-profile/sync', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ owner, auth: { signature, timestampMs } }),
});
```

---

## Resolve by nodename

After `enter_nami`, nodenames are registered in the shared `NodenameRegistry`.

```typescript
import { lookupNodenameInRegistry, resolveMemberByNodename } from '@nami/sdk';

const lookup = await lookupNodenameInRegistry(chain, registryId, 'fiendgamer');
// → { registered, identityId, owner }

const { member } = await resolveMemberByNodename(chain, indexer, registryId, 'fiendgamer');
```

HTTP equivalent:

```
GET /api/nami/nodename/fiendgamer?includeLinkedProfile=true
GET /api/nami/nodenames?limit=50
```

The indexer projects `NodenameRegistered` and `EnterNamiCompleted` events into `data/projections/nodename-registry.json` for fast lookups. Chain `devInspect` is the fallback when a nodename is not indexed yet.

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/nami/linked-profile/:owner` | Chain proof + off-chain preferences/claim merge |
| POST | `/api/nami/linked-profile/sync` | Same bundle with wallet signature proof |
| GET | `/api/nami/nodename/:nodename` | Registry lookup; `?includeLinkedProfile=true` for full bundle |
| GET | `/api/nami/nodenames` | Indexed nodename list (`?limit=50`) |

---

## Integration checklist

1. Configure zkLogin (or wallet connect) on your origin.
2. On sign-in, call `resolveNamiMemberFromWallet`.
3. Gate features on `proof.status === 'verified'`.
4. Hydrate UI from `anchor` (nodename, archetype, avatar ref) + API off-chain fields.
5. Never ask users to paste handles — resolve nodenames via registry or linked profile.

See also: [verification.md](./verification.md), [onboarding.md](./onboarding.md), [testnet-zklogin.md](./testnet-zklogin.md).