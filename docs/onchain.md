# Nami On-Chain Architecture

## Overview

The Nami on-chain layer is built with Sui Move.

The on-chain layer stores ownership, proof, progression state, access state, badge objects, boost events, and future protocol anchors.

Nami should not store every application detail on-chain.

Sui Move should be used for:

* Identity ownership
* Passport state
* Badge ownership
* Membership access state
* Boost proof
* Reputation state
* Future conduct status proofs
* Future moderation status proofs
* Future guild and squad anchors
* Future recovery proofs

Off-chain systems should handle:

* Chat messages
* Search
* Recommendations
* Moderation evidence
* Appeal evidence
* Discovery ranking
* Profile display settings
* Avatar configuration
* Customization layout
* Notifications

---

## Current Move Package

Current package path:

```text
nami_chat/contracts/nami
```

Current package name:

```move
nami
```

Current source path:

```text
nami_chat/contracts/nami/sources
```

Current test path:

```text
nami_chat/contracts/nami/tests
```

---

## Current Source Modules

Current implemented modules:

```text
sources/
├── badge.move
├── boost.move
├── errors.move
├── identity.move
└── passport.move
```

Current test file:

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

# Current Module Responsibilities

## identity.move

Identity is the root ownership layer.

Current responsibilities:

* Create Identity object
* Store owner
* Store trust tier placeholder
* Store verification level placeholder
* Store Passport reference placeholder
* Store creation timestamp
* Store version
* Emit IdentityCreated event

Identity should remain small and stable.

Identity should not store:

* XP
* Level
* Badges
* Reputation
* Chat messages
* Guild membership
* Squad relationships
* Moderation evidence
* Customization settings

---

## passport.move

Passport is the gamer journey and progression layer.

Current responsibilities:

* Create Passport object
* Store linked identity ID
* Store XP
* Store level
* Store level progress
* Store badge points
* Store reputation
* Store archetype
* Store membership tier
* Store boost score placeholder
* Store prestige points
* Store creation timestamp
* Apply badge points
* Apply XP
* Update curved level progression
* Update reputation
* Store tier state
* Emit Passport events

Current Passport default state:

```text
level = 1
xp = 0
level_progress = 0
badge_points = 0
reputation = Newbie
tier = NPC
boost_score = 0
prestige_points = 0
```

---

## badge.move

Badge is the achievement proof layer.

Current responsibilities:

* Define badge types
* Create Badge objects
* Resolve badge point values
* Mint badge objects
* Update Passport badge points
* Emit BadgeMinted event

Current badge types:

```text
Basic Badge = 1 point
Event Badge = 2 points
Completion Badge = 3 points
```

Badge points feed:

* XP
* Level progression
* Reputation

---

## boost.move

Boost is the discovery signal layer.

Current responsibilities:

* Read membership tier from Passport
* Resolve boost power
* Create Boost objects
* Emit BoostUsed event

Current boost model:

```text
NPC = blocked
Adventurer = 1
Pro = 6
Elite = 8
```

Boosts are discovery signals.

Boosts are not governance rights.

Boosts are not reputation.

---

## errors.move

Errors is the shared error code module.

Current responsibilities:

* Define protocol error codes
* Expose error code getters
* Support consistent abort codes across modules

Errors should be reused by future modules instead of hardcoded abort numbers where possible.

---

# Current Object Model

## Identity Object

Current Identity object stores:

* id
* owner
* trust_tier
* verification_level
* passport_id
* created_at_ms
* version

Identity represents ownership and verification foundation.

---

## Passport Object

Current Passport object stores:

* id
* identity_id
* xp
* level
* level_progress
* badge_points
* reputation
* archetype
* tier
* boost_score
* prestige_points
* created_at_ms

Passport represents progression, access state, and gamer history.

---

## Badge Object

Current Badge object stores:

* id
* owner
* badge_type
* points
* source

Badge represents an on-chain proof of achievement or participation.

---

## Boost Object

Current Boost object stores:

* id
* owner
* channel_id
* power
* week_id

Boost represents a discovery influence action.

---

# Current Events

## IdentityCreated

Emitted by:

```move
identity.move
```

Purpose:

Track Identity creation.

---

## PassportCreated

Emitted by:

```move
passport.move
```

Purpose:

Track Passport creation.

---

## XPAdded

Emitted by:

```move
passport.move
```

Purpose:

Track XP and level progress updates.

---

## BadgePointsAdded

Emitted by:

```move
passport.move
```

Purpose:

Track badge point updates and reputation changes.

---

## TierUpgraded

Emitted by:

```move
passport.move
```

Purpose:

Track membership tier changes.

---

## BadgeMinted

Emitted by:

```move
badge.move
```

Purpose:

Track badge issuance.

---

## BoostUsed

Emitted by:

```move
boost.move
```

Purpose:

Track channel boost actions.

---

# Current Access Design

Some mutation functions are package-only.

This prevents external users from directly calling sensitive functions.

Package-only functions may include:

* Passport XP updates
* Badge point updates
* Tier upgrades
* Badge minting

This design allows future authority modules to call protected functions while preventing direct user abuse.

Future modules should become the public permission gates.

---

# Current Dependency Flow

Current core dependency flow:

```text
Identity
  ↓
Passport
  ↓
Badge System
  ↓
XP / Level / Reputation
  ↓
Boost Access
```

Current module dependency pattern:

```text
badge.move → passport.move
boost.move → passport.move
passport.move → errors.move
```

Boost reads Passport tier through a getter instead of directly accessing Passport fields.

This preserves Move module boundaries.

---

# Current Testing

Current tests verify:

* Identity creation
* Passport creation
* NPC default tier
* NPC to Adventurer to Pro to Elite tier flow
* Badge minting updates Passport badge points
* Curved reputation threshold updates
* NPC cannot boost
* Adventurer can boost

Current test result:

```text
6 tests passing
0 failed
```

---

# On-Chain vs Off-Chain Boundaries

## Should Be On-Chain

The following should be on-chain or anchored on-chain:

* Identity ownership
* Passport object
* Badge objects
* Membership tier state
* Tier upgrade events
* Badge issuance events
* Boost usage events
* Future conduct status proof
* Future moderation penalty proof
* Future recovery proof
* Future guild object anchors
* Future squad object anchors
* Future badge issuer authority

---

## Should Be Off-Chain

The following should usually be off-chain:

* Chat messages
* Chat attachments
* Moderation evidence
* Appeal evidence
* Jury evidence packets
* Discovery ranking calculations
* Profile display name
* Avatar configuration
* Customization layout
* Search indexing
* Notifications
* Analytics dashboards

Off-chain data may reference on-chain object IDs and events.

---

# Future On-Chain Modules

Planned future modules may include:

```text
verification.move
membership.move
conduct.move
moderation.move
appeals.move
jury.move
channel_access.move
squad.move
guild.move
badge_issuer.move
badge_registry.move
badge_review.move
cosmetics.move
title.move
avatar.move
recovery.move
```

---

## verification.move

Planned responsibility:

* Control NPC to Adventurer transition
* Validate human verification
* Support zkLogin verification hooks
* Support X.com verification carryover
* Support Steam / Epic / SuiNS verification hooks
* Emit verification events

---

## membership.move

Planned responsibility:

* Control Pro and Elite membership
* Support expiration
* Support renewal
* Support effective tier checks
* Support grace periods
* Prevent expired memberships from retaining benefits

---

## conduct.move

Planned responsibility:

* Store or anchor Passport Signal status
* Support Green, Orange, Red, Black signals
* Support Black Passport restriction state
* Support respawn timers
* Emit conduct events

---

## moderation.move

Planned responsibility:

* Issue warnings
* Issue mutes
* Issue channel bans
* Apply Black Passport restrictions
* Support permanent restriction records
* Emit moderation events

---

## appeals.move

Planned responsibility:

* Open appeal cases
* Track appeal state
* Emit appeal events
* Preserve privacy through case IDs and anonymized references

---

## jury.move

Planned responsibility:

* Assign anonymous jury groups
* Track advisory or binding decisions
* Support Pro / Elite jury eligibility
* Avoid exposing private identity data

---

## channel_access.move

Planned responsibility:

* Store channel access rules
* Toggle NPC chat
* Store minimum tier requirements
* Store minimum reputation requirements
* Support badge-gated, guild-gated, squad-gated, and NFT-gated chat

---

## squad.move

Planned responsibility:

* Create squads
* Track sponsorship relationships
* Manage squad slots
* Support weekly sponsorship cycles
* Support squad display

---

## guild.move

Planned responsibility:

* Create guilds
* Track guild membership
* Track guild roles
* Anchor guild identity
* Support guild events and future governance

---

## badge_issuer.move

Planned responsibility:

* Approve badge issuers
* Define issuer classes
* Define allowed badge types
* Limit Completion Badge issuance
* Suspend abusive issuers

---

## cosmetics.move

Planned responsibility:

* Store cosmetic unlock proofs
* Support rare on-chain cosmetics
* Support prestige unlocks
* Emit customization unlock events

---

# Future Effective Access Checks

Future access should not rely only on raw Passport tier.

Effective access may need to consider:

```text
membership tier
+ membership expiration
+ verification status
+ conduct status
+ moderation restrictions
+ channel rules
```

Example:

A user may have Elite tier but Black Passport status.

In that case, their effective benefits should fall back to NPC-equivalent restrictions until respawn.

---

# Future Seasonal Progression

Future seasonal systems may reset or archive:

* XP
* Level
* Level progress
* Seasonal prestige points

Seasonal resets should not delete:

* Identity
* Passport
* Historical badges
* Lifetime reputation history
* Membership history
* Guild history
* Squad history

---

# Future Privacy Design

Nami should avoid exposing unnecessary personal information on-chain.

Sensitive data should remain off-chain or privacy-preserving.

Do not store:

* Real names
* Private emails
* Raw linked social handles
* Private game account identifiers
* Moderation evidence
* Private chat logs
* Recovery secrets

On-chain should store proofs, states, and events.

---

# Development Commands

From the Move package root:

```bash
cd /c/Users/prica/nami_chat/contracts/nami
sui move build
sui move test
```

From the repository root:

```bash
cd /c/Users/prica/nami_chat
```

---

# Core Principle

Nami should use Sui Move for ownership, proof, trust, access, and event integrity.

Nami should use off-chain services for speed, search, chat, personalization, moderation evidence, and discovery ranking.

The on-chain layer should be powerful enough to prove what matters, but small enough to remain maintainable.
