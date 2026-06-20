# Nami Sui Layer

## Overview

The Sui Layer is the blockchain foundation of Nami.

Nami uses Sui to anchor ownership, identity, progression, reputation, badge proofs, membership access, boosts, and future community systems.

Sui should provide trust, proof, and composability.

Off-chain services should provide speed, chat, search, recommendations, moderation evidence, and user interface flexibility.

---

## Why Sui

Nami is designed for gamers and game developers.

Sui is a strong fit because it supports:

* Object-based ownership
* Programmable Move modules
* Fast transactions
* zkLogin onboarding
* SuiNS identity support
* Rich event indexing
* Composable on-chain objects
* Future integration with Sui-native storage, privacy, and messaging tools

Nami should feel simple for gamers while still using strong on-chain foundations.

---

## Current Sui Move Package

Current package path:

```text
nami_chat/contracts/nami
```

Current package name:

```move
nami
```

Current modules:

```text
sources/
├── badge.move
├── boost.move
├── errors.move
├── identity.move
└── passport.move
```

Current tests:

```text
tests/nami_tests.move
```

Current status:

```text
Build passing
6 tests passing
0 failed
```

---

# Core Sui Concepts Used

## Move Modules

Nami logic is organized into Move modules.

Current modules include:

* identity.move
* passport.move
* badge.move
* boost.move
* errors.move

Future modules may include:

* verification.move
* membership.move
* conduct.move
* moderation.move
* appeals.move
* jury.move
* channel_access.move
* squad.move
* guild.move
* badge_issuer.move
* cosmetics.move
* recovery.move

---

## Sui Objects

Nami uses Sui objects to represent important user-owned protocol state.

Current objects:

* Identity
* Passport
* Badge
* Boost

Future objects may include:

* MembershipRecord
* VerificationRecord
* ConductStatus
* ModerationRecord
* AppealCase
* JuryGroup
* Squad
* Guild
* CosmeticUnlock
* TitleUnlock
* ChannelAccessPolicy

---

## Object Ownership

Sui object ownership allows users to own their Nami assets and state.

Current ownership flow:

* Identity is transferred to the user
* Passport is transferred to the user
* Badge objects are transferred to the user
* Boost objects are transferred to the user

Ownership should remain clear, auditable, and composable.

---

## Events

Nami uses Sui events to make state changes indexable.

Current events:

* IdentityCreated
* PassportCreated
* XPAdded
* BadgePointsAdded
* TierUpgraded
* BadgeMinted
* BoostUsed

Events allow off-chain services to build:

* Profiles
* Dashboards
* Discovery rankings
* Badge history
* Progression timelines
* Moderation tools
* Analytics

---

# Identity and zkLogin

## zkLogin Purpose

zkLogin should allow gamers to enter Nami without needing to understand wallets.

The ideal user experience:

```text
Sign in → Identity → Passport → Start journey
```

not:

```text
Create wallet → manage keys → understand blockchain → mint profile
```

zkLogin supports gamer-friendly onboarding.

---

## zkLogin Relationship to Identity

A user signing in through zkLogin should be able to create or access their Nami Identity.

Identity should remain the root ownership object.

Passport should become the progression companion to Identity.

---

## Wallet Users

Users who already have Sui wallets should be able to connect directly.

Wallet ownership may be one trust signal, but wallet ownership alone should not equal human verification.

---

# SuiNS

## Purpose

SuiNS may be used for human-readable identity, developer identity, channel identity, studio identity, guild identity, and subname-based organization.

Possible future uses:

* Player names
* Developer names
* Studio profiles
* Game hubs
* Guild names
* Channel names
* Verified subnames

---

## SuiNS and Verification

SuiNS may support trust, but should not be mandatory for all users.

Ordinary gamers should be able to use Nami without purchasing or managing a SuiNS name.

Developers, guilds, studios, and official channels may benefit more from SuiNS identity anchoring.

---

## Nodenames (Nami-native handles)

Nodenames are **user-chosen readable handles** registered at Passport claim (Act 2 of [onboarding.md](./onboarding.md)). They are distinct from:

```text
Display name     — profile copy; can change off-chain
SuiNS name       — optional paid namespace; not required for gamers
Nodename         — stable Nami identity handle chosen once at claim
```

### Purpose

```text
Readable @handle in chat, profiles, and discovery
Mapping to on-chain Identity without exposing raw addresses
Gamer-friendly claim flow alongside zkLogin / wallet connect
```

### Rules (target)

```text
Length: 3–24 characters (tunable)
Charset: lowercase letters, digits, underscore; no leading digit
Unique globally within Nami registry
Immutable after claim (display name may still change)
Reserved list for official / system names
Claim prefix: @fiend — every passport nodename starts with fiend; the user chooses a unique suffix
  Example: suffix gamer → stored nodename fiendgamer, shown as @fiendgamer
```

Pre-testnet drafts used the legacy @nami prefix; the claim UI still parses those for migration.

### On-chain target

Future `nami::onboarding::enter_nami` (or `identity` module extension) should:

```text
Mint Identity + Passport + core objects in one PTB
Register nodename → identity_id mapping
Emit nodename_registered event for indexer
```

Until Move support lands, frontend collects nodename in the claim step and persists it in the local onboarding draft only.

### Relationship to SuiNS

Nami may optionally anchor or verify against SuiNS later. **Nodenames are the default gamer path** — no purchase required.

See also [verification.md](./verification.md) for platform-linked identity (separate from nodename).

---

# Walrus

## Purpose

Walrus may be used for decentralized storage of larger data that should not live directly in Move objects.

Potential uses:

* Profile assets
* Avatar assets
* Passport theme assets
* Badge metadata
* Guild media
* Channel banners
* Appeal evidence references
* Moderation evidence references
* Event media
* Developer hub media

---

## On-Chain References

Nami should not store large files directly on-chain.

Instead, Move objects may store references to Walrus-stored content.

Examples:

* blob_id
* content_hash
* metadata_uri
* media_type
* uploaded_at_ms

This allows Nami to keep on-chain state small while supporting rich user experiences.

---

# Sui Seal

## Purpose

Sui Seal may support privacy and encryption features in future versions.

Potential uses:

* Private recovery data
* Private appeal evidence
* Private moderation evidence
* Private linked-account proofs
* Encrypted guild records
* Encrypted channel records
* Privacy-preserving verification data

---

## Privacy Principle

Nami should verify eligibility without exposing unnecessary private data.

Examples:

* Prove a user is verified without exposing their linked account publicly
* Prove appeal evidence exists without exposing sensitive content to everyone
* Allow anonymous jury review without revealing private identity data

---

# Sui Events and Indexers

## Event Indexing

Nami backend services should index Sui events.

Indexed events may power:

* User profiles
* Passport timelines
* Badge history
* Boost rankings
* Discovery cycles
* Moderation dashboards
* Recovery workflows
* Guild activity
* Squad relationships
* Customization unlocks

---

## Current Event Sources

Current event sources:

* identity.move
* passport.move
* badge.move
* boost.move

Future event sources:

* verification.move
* membership.move
* conduct.move
* moderation.move
* appeals.move
* jury.move
* channel_access.move
* squad.move
* guild.move
* cosmetics.move

---

# On-Chain vs Off-Chain Split

## On-Chain

Sui should store or anchor:

* Identity ownership
* Passport state
* Badge ownership
* Membership tier state
* Boost actions
* Reputation state
* Tier upgrade events
* Badge issuance events
* Future conduct status
* Future moderation status
* Future guild anchors
* Future squad anchors
* Future recovery proofs
* Future cosmetic unlock proofs

---

## Off-Chain

Off-chain systems should handle:

* Chat messages
* Discovery ranking
* Search
* Recommendations
* Profile display names
* Avatar configuration
* Equipped cosmetics
* Moderation evidence
* Appeal evidence
* Jury packets
* Notifications
* Analytics dashboards
* Real-time messaging

---

# SDK Layer

## Purpose

The Nami SDK should make Sui interactions simple for games, websites, dApps, channels, guilds, and developers.

The SDK should hide blockchain complexity where possible.

---

## SDK Responsibilities

The SDK may support:

* zkLogin sign-in
* Wallet connection
* Identity creation
* Passport creation
* Passport reads
* Badge reads
* Reputation reads
* Membership reads
* Boost usage
* Channel access checks
* Guild reads
* Squad reads
* Customization reads
* Event subscriptions

---

## Developer Integration

Developers should be able to integrate Nami into:

* Games
* Websites
* dApps
* Launchers
* Developer hubs
* Community portals
* Guild tools
* Event systems

Nami should be accessible beyond Sui-native games.

The goal is to support all games, not only Sui games.

---

# Future Messaging Layer

Nami chat should be fast and scalable.

Primary chat messages should likely be off-chain.

Sui should anchor:

* Identity
* Access
* Membership
* Reputation
* Badge proofs
* Channel permissions
* Moderation status

A future messaging layer may use Sui-native tools where appropriate, but the protocol should remain resilient if one messaging provider has an outage.

---

# Access Checks

Future effective access checks may combine:

* Passport tier
* Verification status
* Membership expiration
* Conduct signal
* Moderation status
* Channel access rules
* Badge ownership
* Guild membership
* Squad sponsorship
* NFT ownership

Raw membership tier alone will not be enough forever.

Example:

A user may have Elite membership but Black Passport status.

In that case, effective benefits should fall back to NPC-equivalent restrictions until respawn.

---

# Future Module Flow

Current flow:

```text
Identity
  ↓
Passport
  ↓
Badge
  ↓
XP / Level / Reputation
  ↓
Boost
```

Future flow:

```text
Identity
  ↓
Passport
  ├── Verification
  ├── Membership
  ├── Badges
  ├── Boosts
  ├── Conduct
  ├── Moderation
  ├── Squads
  ├── Guilds
  ├── Customization
  └── Recovery
```

---

# Development Commands

From the Move package root:

```bash
cd /c/Users/prica/nami_chat/contracts/nami
sui move build
sui move test
```

From the repo root:

```bash
cd /c/Users/prica/nami_chat
```

---

# Core Principles

Use Sui for ownership, proof, access, and trust.

Use off-chain services for scale, speed, chat, personalization, and evidence.

Use zkLogin to make onboarding gamer-friendly.

Use SuiNS where human-readable identity matters.

Use Walrus for rich storage when appropriate.

Use Seal for privacy and encryption when appropriate.

Keep Move objects small, composable, and auditable.

Nami should feel simple to gamers while remaining trustworthy under the hood.
