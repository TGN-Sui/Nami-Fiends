# Nami Membership

## Purpose

Membership controls feature access and platform benefits.

Membership is separate from:

* Reputation
* Verification
* Conduct
* Badge history
* Archetype
* Squad membership
* Guild role
* Cosmetic ownership
* Title ownership

Membership answers:

```text
What benefits can this user access?
```

Reputation answers:

```text
What has this user earned?
```

---

## Current Status

Current module:

```move
module nami::membership
```

Current protocol status:

```text
80 tests passing
0 warnings
```

Membership tier is stored on `Passport.tier` and surfaced by SDK `loadPassportProtocolView` / `membershipTierLabel`.

Related modules:

```text
passport.move
verification.move
conduct.move
boost.move
channel.move
channel_access.move
squad.move
guild.move
jury.move
profile.move
title.move
cosmetics.move
admin.move
```

---

# Membership Tiers

Current tiers:

```text
0 = NPC
1 = Adventurer
2 = Pro
3 = Elite
```

---

## NPC

NPC is the default tier for every new Passport.

NPC means:

* Free user
* Limited access
* No boost access
* No channel creation
* No squad creation
* No guild creation
* No jury eligibility
* Channel chat depends on channel policy
* Profile creation is allowed

NPC is not punishment.

NPC is the starting state.

---

## Adventurer

Adventurer represents verified-human or basic trusted access.

Current unlock paths:

```text
NPC → Adventurer (paid: $3 USDC/month or $27 USDC/year)
NPC → Adventurer (free: verified X.com account via X authorization)
```

Paid checkout accepts card, PayPal, SUI (USD equivalent), or USDC on the Sui network.

The free X.com path requires verified authorization through the official X account OAuth flow — not manual handle entry.

On-chain tier transitions still coordinate with:

```move
module nami::verification
```

Current Adventurer benefits:

```text
1 boost
Channel creation
Guild creation
Adventurer-sized Guild limit
Chat in Adventurer+ channels
```

Adventurer does not grant Squad creation or Jury eligibility.

---

## Pro

Pro is a higher access tier.

Current unlock path:

```text
Adventurer → Pro
```

This transition is currently controlled through AdminCap.

Current Pro benefits:

```text
6 boosts
Channel creation
Guild creation
100-member Guild limit
Squad creation
3 Squad slots
Jury eligibility
```

---

## Elite

Elite is the highest current membership tier.

Current unlock path:

```text
Pro → Elite
```

This transition is currently controlled through AdminCap.

Current Elite benefits:

```text
8 boosts
Channel creation
Guild creation
250-member Guild limit
Squad creation
8 Squad slots
Jury eligibility
```

Elite does not override moderation.

---

## Complimentary Elite (Officials)

The official owner, official moderators, and `isNamiTeam` members receive **Elite-tier feature access without payment**. Checkout is blocked with `COMPLIMENTARY_MEMBERSHIP_REASON`.

| Role | Display label | Galaxy / rainbow styling |
|------|---------------|--------------------------|
| Official owner (`VITE_NAMI_OFFICIAL_OWNER`) | **FIEND** | Yes (owner only) |
| Official moderator (local list) | Official moderator access | No |
| Nami team member (`isNamiTeam`) | Official Nami member access | No |

On test launch, genesis users keep **NPC** on passport display tier while complimentary roles use `effectiveMemberTier()` for feature gates (boosts, squads, temporary global chats, etc.).

Implementation:

```text
frontend/src/official-membership-access.ts — hasComplimentaryMembershipAccess(), complimentaryMembershipStatusLabel()
frontend/src/membership-plans-store.ts     — effectiveMemberTier(); applyMembershipTierToMember skips tier override in genesis mode
frontend/src/member-access.ts              — memberHasEliteAccess() for complimentary owner features
```

Env:

```text
VITE_NAMI_OFFICIAL_OWNER        — Sui address (must match connected zkLogin / linked wallet)
VITE_NAMI_OFFICIAL_OWNER_EMAIL  — Google account for zkLogin OAuth (see docs/testnet-zklogin.md)
NAMI_OFFICIAL_OWNER             — backend mirror for officials sync auth
NAMI_OFFICIAL_OWNER_EMAIL       — backend mirror (optional)
```

---

# Effective Tier

Nami uses effective tier checks instead of relying only on raw Passport tier.

Current effective tier considers:

```text
Passport tier
+ Conduct status
```

When Conduct is Black:

```text
Effective tier = NPC-equivalent
```

This prevents restricted users from using premium benefits while their Passport is downed.

---

# Black Passport Effect

Black Passport means:

```text
Passport downed. Respawning in...
```

While Black Passport is active, the user temporarily loses active benefits.

Current affected systems:

```text
Boosts
Channel creation
Channel chat
Squad creation
Squad sponsorship
Guild creation
Guild member management
Jury eligibility
Profile updates
Title claiming
Title equipping
Cosmetic equipping
```

Black Passport should not erase membership history, reputation, badges, titles, cosmetics, or Passport ownership by default.

---

# Current Access Summary

```text
Feature                     NPC   Adventurer   Pro   Elite   Black
Create Profile              Yes   Yes          Yes   Yes     No
Update Profile              Yes   Yes          Yes   Yes     No
Boost                       No    1            6     8       No
Create Channel              No    Yes          Yes   Yes     No
Create Guild                No    Yes          Yes   Yes     No
Guild Limit                 0     25           100   250     0 active
Create Squad                No    No           Yes   Yes     No
Squad Slots                 0     0            3     8       0 active
Jury Eligibility            No    No           Yes   Yes     No
Chat if NPC Allowed         Yes   Yes          Yes   Yes     No
Chat if NPC Disabled        No    Yes          Yes   Yes     No
```

Channel mutes and channel bans can still block chat regardless of tier.

---

# Verification Relationship

Verification controls the first trusted transition:

```text
NPC → Adventurer
```

Verification does not grant reputation.

Verification does not automatically grant Pro or Elite.

Verification proves enough authenticity to unlock basic trusted access.

---

# Reputation Relationship

Membership does not create reputation.

A paid member can still have low reputation.

A high-reputation user can still be NPC if they are not verified or not actively subscribed.

A Pro or Elite user can still be restricted by moderation.

---

# Profiles, Titles, and Cosmetics

Membership does not control earned identity display by itself.

Profiles are basic display anchors.

Titles are earned through reputation.

Cosmetics are unlock proofs and equipped loadouts.

Black Passport can block updates or equipping, but existing history should remain intact by default.

---

# Proposed Pricing (MVP UI)

Planned subscription pricing for the frontend membership manager (`MembershipPlansPanel`):

| Tier | Monthly | Annual | Notes |
|------|---------|--------|-------|
| Adventurer | $3 USDC | $27 USDC (~25% off) | Or claim free with verified X.com OAuth |
| Pro Circuit | $9.99 | $89 (~26% off) | 6 boosts, 3 squads, jury eligibility, 5 followed channels |
| Elite Crest | $19.99 | $179 (~25% off) | 8 boosts, 8 squads, banner slots, 8 followed channels |

### Payment methods (UI prototype)

```text
Credit / debit card  → Stripe Checkout + webhook on receiving server
PayPal               → PayPal Orders API + webhook on receiving server
Other                → single rail with sub-choice:
  SUI (USD-equivalent spot price at checkout)
  USDC on Sui (USD-equal token amount)
  $GOON (USD-equal token amount)
```

$GOON coin type (testnet):

```text
0xc31be4b73d3352373c9e2d99e8620944f414b24407495b1d0c9f5628e2e86104::goon::GOON
```

Crypto checkout prompts wallet sign-in and sends to `NAMI_PAYMENT_TREASURY_ADDRESS`.

### $GOON tips (UI prototype)

Verified members with a connected Sui wallet can **Tip $GOON** from another member's profile (`MemberProfileActions.tsx`). Tips route to `NAMI_PAYMENT_TREASURY_ADDRESS` via wallet-signed transfer (`goon-wallet-payment.ts`). A local activity ledger tracks received tips (`goon-tips-store.ts`). **Buy Goon** uses the same coin type and treasury config (`GoonQuickBuy.tsx`).

### Billing rules (UI prototype)

```text
Upgrade      → pending-upgrade, pick payment method, confirm step simulates checkout
X claim      → verified X.com OAuth grants Adventurer without payment
Downgrade    → pending-downgrade, effective at renewal date
Cancel       → pending-cancel; paid Adventurer cancels at renewal; X-claim revokes on unlink
Undo         → clears pending change before renewal
```

On-chain membership still uses AdminCap until subscription proofs ship.

### Backend payment API (receiving server)

Membership checkout calls the backend indexer HTTP API (`VITE_NAMI_INDEXER_URL`, default `http://127.0.0.1:8787`).

```text
GET  /api/payments/membership/config
POST /api/payments/membership/intents
GET  /api/payments/membership/intents/:paymentId
POST /api/payments/membership/intents/:paymentId/mock/confirm
POST /api/payments/membership/intents/:paymentId/crypto/confirm
POST /api/payments/webhooks/stripe
POST /api/payments/webhooks/paypal
```

Intent create body:

```text
owner          → 0x wallet address
tier           → adventurer | pro | elite
billingCycle   → monthly | annual
rail           → card | paypal | other
cryptoAsset    → sui | usdc | goon (required when rail = other)
successUrl     → optional return URL after provider checkout
cancelUrl      → optional cancel URL
```

Public config (`GET .../config`) exposes treasury address, coin types, USD spot helpers, and publishable Stripe/PayPal keys. Payment intents persist under `backend/data/projections/membership-payments.json` (local demo storage).

Backend env (`backend/.env.example`):

```text
NAMI_PAYMENT_TREASURY_ADDRESS
NAMI_USDC_COIN_TYPE
NAMI_GOON_COIN_TYPE
NAMI_SUI_USD_PRICE
NAMI_PAYMENT_ALLOW_MOCK
NAMI_PAYMENT_SUCCESS_URL
NAMI_PAYMENT_CANCEL_URL
STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET
PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET / NAMI_PAYPAL_MODE
```

Frontend checkout panels: `MembershipCheckoutPanel`, `MembershipPaymentMethods`, `MembershipPaymentReturnHandler`, `MembershipUpgradeOverlay`.

Paid intents activate a server-side subscription record:

```text
GET  /api/memberships/subscriptions/owner/:owner
POST /api/memberships/subscriptions/sync
```

Subscription fields mirror the frontend plan state (`activeTier`, `billingCycle`, `status`, `pendingTier`, `renewsAtMs`, `lastPaymentId`). Renewal rules apply pending downgrade/cancel when `renewsAtMs` elapses.

Member display preferences (avatar URL, streaming online) persist separately:

```text
GET  /api/member-preferences/owner/:owner
POST /api/member-preferences/sync
POST /api/media/avatar
GET  /api/media/files/:owner/:filename
```

`MemberSessionSync` hydrates membership + preferences from the backend on wallet connect.

On-chain fulfillment (Pro/Elite paid checkouts):

```text
GET  /api/memberships/fulfillment/pending
GET  /api/memberships/fulfillment/owner/:owner
POST /api/memberships/fulfillment/:fulfillmentId/complete
```

Paid Pro/Elite intents queue `pending_onchain` fulfillments. The official owner signs with AdminCap in `MembershipFulfillmentPanel` to upgrade any queued subscriber passport on-chain. Subscribers keep app-tier access while on-chain passport updates remain queued; the owner wallet can also self-fulfill from `MembershipOnChainFulfillmentCard` when it owns the subscriber passport.

Wallet-signed writes (optional, `NAMI_REQUIRE_WALLET_AUTH=true`):

```text
auth: { signature, timestampMs } on preference/media POST bodies
Message: nami-auth:v1:{owner}:{timestampMs}
```

Channel cover media:

```text
GET  /api/channel-preferences/:channelId
POST /api/channel-preferences/sync
POST /api/media/channel-cover
```

Studio logo media:

```text
GET  /api/studio-preferences/:studioId
POST /api/studio-preferences/sync
POST /api/media/studio-logo
```

---

# Admin Authority

Current Pro and Elite upgrades are exposed through:

```move
module nami::admin
```

AdminCap currently controls:

```text
Upgrade to Pro
Upgrade to Elite
```

This is the MVP authority model.

Future versions should replace this with subscription-aware membership logic.

---

# Membership Expiration and Renewal

Shipped on Passport (Phase 1 complete):

```text
tier_expires_at_ms — 0 means no enforced expiration (complimentary / legacy grants)
effective_tier_at — expired Pro / Elite fall back to Adventurer without deleting raw tier
MembershipExpired event — emitted via membership::notify_membership_expired_if_due
MembershipRenewed event — Pro / Elite renewal updates expiration timestamp
```

Planned next:

```text
Grace period
Subscription proof linkage
Membership history object
```

Expired behavior (shipped):

```text
Expired Elite → effective Adventurer (raw tier preserved)
Expired Pro → effective Adventurer (raw tier preserved)
```

Expiration should not delete:

```text
Identity
Passport
Profile
Badge history
Reputation history
Title history
Cosmetic unlocks
Appeal history
Squad history
Guild history
Recovery history
```

---

# Future Membership Records

A future `MembershipRecord` object may track:

* Owner
* Passport ID
* Tier
* Started timestamp
* Expiration timestamp
* Renewal timestamp
* Payment/subscription reference
* Active status

This would make membership history easier to index and audit.

---

# Design Rules

Membership controls access.

Membership does not buy reputation.

Membership does not bypass moderation.

Membership benefits should use effective tier checks.

Black Passport overrides active benefits while restricted.

Expiration should pause benefits without erasing history.

Payment should add features, not trust status.

---

# Related Docs

```text
docs/access-control.md
docs/passport.md
docs/verification.md
docs/conduct-system.md
docs/moderation.md
docs/squads.md
docs/guilds.md
docs/jury.md
docs/customization.md
docs/admin.md
```
