# Nami Architecture

## Overview

Nami is an interoperable gaming identity, reputation, discovery, and communication protocol.

The architecture is designed as a monorepo with separate layers for documentation, smart contracts, backend services, frontend applications, and SDK integrations.

Nami should feel simple for gamers while maintaining strong protocol foundations underneath.

---

## Repository Structure

Current repository root:

```text
nami_chat/
```

Current structure:

```text
nami_chat/
├── README.md
├── backend/
├── contracts/
│   └── nami/
│       ├── Move.toml
│       ├── Move.lock
│       ├── sources/
│       └── tests/
├── docs/
├── frontend/
└── sdk/
```

---

## Layer Responsibilities

### docs/

The documentation layer defines the protocol truth.

Docs explain:

* Vision
* Architecture
* Protocol systems
* Identity
* Passport
* Membership
* Verification
* Reputation
* Badges
* Boosts
* Conduct
* Moderation
* Recovery
* Events
* Discovery
* Squads
* Guilds
* Sui integration
* Resilience

Docs should guide code.

If code and docs disagree, the mismatch should be resolved intentionally.

---

### contracts/

The contracts layer contains Sui Move packages.

Current package:

```text
contracts/nami/
```

Current modules:

```text
badge.move
boost.move
errors.move
identity.move
passport.move
```

Contracts should store ownership, proof, access state, progression state, and protocol events.

---

### backend/

The backend layer will support scalable off-chain systems.

Planned backend services:

* Event indexer
* Chat service
* Discovery engine
* Profile service
* Moderation service
* Appeal service
* Jury assignment service
* Badge issuer service
* Customization service
* Recovery service
* Notification service

Backend services should compute and serve high-volume user experiences.

---

### frontend/

The frontend layer will provide user-facing Nami applications.

Planned frontend experiences:

* Nami user dashboard
* Passport profile
* World chat
* Developer hubs
* Game channels
* Guild pages
* Squad pages
* Discovery pages
* Moderation dashboards
* Appeal pages
* Customization editor

---

### sdk/

The SDK layer will allow external games, websites, dApps, channels, guilds, and communities to integrate Nami.

Planned SDK capabilities:

* Login
* Identity creation
* Passport creation
* Passport reads
* Membership reads
* Reputation reads
* Badge reads
* Boost usage
* Channel access checks
* Conduct reads
* Guild reads
* Squad reads
* Chat integration
* Event subscriptions

---

## Current Move Package

Current package root:

```text
nami_chat/contracts/nami
```

Build command:

```bash
cd /c/Users/prica/nami_chat/contracts/nami
sui move build
```

Test command:

```bash
cd /c/Users/prica/nami_chat/contracts/nami
sui move test
```

Current status:

```text
Build passing
6 tests passing
0 failed
```

---

## Current On-Chain Modules

### identity.move

Root ownership layer.

Responsibilities:

* Create Identity object
* Store owner
* Store verification placeholder
* Store trust placeholder
* Store Passport reference placeholder
* Emit IdentityCreated

Identity should remain minimal and stable.

---

### passport.move

Player journey layer.

Responsibilities:

* Create Passport object
* Store XP
* Store level
* Store level progress
* Store badge points
* Store reputation
* Store archetype
* Store membership tier
* Store boost score placeholder
* Store prestige points
* Apply curved progression
* Update reputation
* Emit Passport events

Passport is the core player progression object.

---

### badge.move

Achievement proof layer.

Responsibilities:

* Define badge types
* Mint Badge objects
* Resolve badge points
* Update Passport badge points
* Feed XP and reputation progression
* Emit BadgeMinted

Badges should represent meaningful activity.

---

### boost.move

Discovery signal layer.

Responsibilities:

* Read Passport tier
* Resolve boost power
* Create Boost objects
* Emit BoostUsed

Boosts influence discovery but do not grant governance or reputation.

---

### errors.move

Shared error code layer.

Responsibilities:

* Define protocol error codes
* Expose error getters
* Support consistent abort behavior

---

## Current Core Flow

Current implemented flow:

```text
Identity
  ↓
Passport
  ↓
Badge
  ↓
XP / Level / Reputation
  ↓
Boost Access
```

Current behavior:

* User creates Identity
* User creates Passport
* Passport starts as NPC
* Badge points feed XP
* XP uses curved progression
* Progression updates reputation
* Passport tier determines boost access
* NPC cannot boost
* Adventurer can boost

---

## Identity Architecture

Identity is the root ownership anchor.

Identity should remain separate from Passport.

Identity owns or references the long-term user presence.

Passport represents the user’s journey.

Future identity systems may include:

* zkLogin
* Wallet ownership
* X.com verification
* Steam linkage
* Epic Games linkage
* SuiNS
* Recovery
* Developer verification
* Organization verification

---

## Passport Architecture

Passport is the player journey object.

Passport stores:

* XP
* Level
* Level progress
* Badge points
* Reputation
* Membership tier
* Archetype
* Boost score
* Prestige points

Passport should not store:

* Chat messages
* Profile display names
* Avatar configurations
* Moderation evidence
* Appeal evidence
* Full guild member lists
* Full squad member lists

---

## Membership Architecture

Membership controls access.

Current tiers:

```text
NPC
Adventurer
Pro
Elite
```

NPC is the default state.

Adventurer represents verified human/basic access.

Pro and Elite represent paid supporter tiers.

Future membership systems should support:

* Expiration
* Renewal
* Grace periods
* Effective tier checks
* Subscription-aware access

Future module:

```text
membership.move
```

---

## Verification Architecture

Verification determines whether a user can move from NPC to Adventurer.

Future verification may use:

* zkLogin
* X.com
* Steam
* Epic Games
* SuiNS
* Wallet ownership
* Email
* Future privacy-preserving proofs

Future module:

```text
verification.move
```

Verification should prove authenticity, not reputation.

---

## Reputation Architecture

Reputation is earned through meaningful activity.

Current ranks:

```text
Newbie
Gamester
Goblin
Goonie
Fiend
```

Current inputs:

* Badge points
* XP
* Level progression

Reputation is separate from membership.

Reputation cannot be purchased.

---

## Badge Architecture

Badges are proof of achievement.

Current badge types:

```text
Basic Badge = 1 point
Event Badge = 2 points
Completion Badge = 3 points
```

Completion Badges must represent meaningful completion.

Starting a game should not issue a Completion Badge.

Future badge systems may include:

* Badge issuer authority
* Badge registry
* Badge review
* Badge revocation
* Badge issuer suspension

---

## Boost Architecture

Boosts are discovery signals.

Current boost access:

```text
NPC = no boost access
Adventurer = 1
Pro = 6
Elite = 8
```

Future boost systems should support:

* Weekly cycles
* No rollover
* Per-channel caps
* Anti-abuse checks
* Membership expiration checks
* Conduct restrictions

---

## Conduct Architecture

Conduct will communicate interaction state.

Planned signals:

```text
Green
Orange
Red
Black
```

Green means friendly/casual.

Orange means competitive but respectful.

Red means high-intensity/PvP-heavy.

Black means Passport downed due to moderation.

Future module:

```text
conduct.move
```

Conduct is separate from reputation and membership.

---

## Moderation Architecture

Moderation protects users and communities.

Planned actions:

* Warning
* Temporary mute
* Channel ban
* Black Passport
* Permanent restriction
* Appeal review
* Anonymous jury review

Future modules:

```text
moderation.move
appeals.move
jury.move
```

Moderation should be evidence-based, reviewable, and resistant to mob punishment.

---

## Channel Access Architecture

Channels will control who can read, chat, and participate.

Planned access modes:

* Public read
* NPC chat allowed
* NPC chat disabled
* Adventurer+ chat
* Pro+ chat
* Elite-only chat
* Reputation-gated chat
* Badge-gated chat
* Guild-gated chat
* Squad-gated chat
* NFT-gated chat

Future module:

```text
channel_access.move
```

Core toggle:

```text
Allow NPC Chat: Yes / No
```

---

## Squad Architecture

Squads are small trust networks.

Planned rules:

```text
NPC = no squad slots
Adventurer = no squad slots
Pro = limited squad slots
Elite = expanded squad slots
```

Squads are not guilds.

Future module:

```text
squad.move
```

---

## Guild Architecture

Guilds are persistent community structures.

Guilds may support:

* Guild identity
* Guild roles
* Guild channels
* Guild reputation
* Guild events
* Guild badge permissions
* Guild discovery
* Future governance

Future module:

```text
guild.move
```

---

## Customization Architecture

Customization lets users express identity.

Planned customization categories:

* Profile avatars
* 2D VTuber-style avatars
* Profile frames
* Passport themes
* Chat overlays
* Fonts
* Chat backgrounds
* Badge displays
* Earned title displays
* Guild display selection
* Prestige effects

Most customization settings should live off-chain.

On-chain should store unlock proofs for meaningful or rare items.

---

## Discovery Architecture

Discovery should be community-driven.

Discovery inputs may include:

* Boosts
* Reputation
* Badge quality
* Conduct health
* Channel activity
* Guild activity
* Squad activity
* Developer verification
* Channel verification
* Moderation health
* Event participation

Discovery ranking should be computed off-chain.

Sui should anchor trusted signals.

---

## Communication Architecture

Chat should be fast and scalable.

Primary chat messages should live off-chain.

Sui should anchor:

* Identity
* Passport
* Membership
* Reputation
* Badges
* Boosts
* Conduct status
* Channel access
* Moderation status

---

## Recovery Architecture

Recovery should help users regain access without compromising security.

Future recovery may use:

* zkLogin recovery
* Linked social recovery
* Linked game account recovery
* Optional email recovery
* Squad support
* Guild support
* Manual review

Future module:

```text
recovery.move
```

Recovery should preserve Passport history whenever possible.

---

## On-Chain vs Off-Chain

### On-Chain

Sui should store or anchor:

* Identity ownership
* Passport state
* Badge ownership
* Membership tier state
* Boost actions
* Reputation state
* Tier upgrade events
* Badge events
* Boost events
* Future conduct status
* Future moderation status
* Future recovery proof
* Future guild anchors
* Future squad anchors
* Future cosmetic unlock proofs

---

### Off-Chain

Backend services should handle:

* Chat messages
* Discovery ranking
* Moderation evidence
* Appeal evidence
* Jury packets
* Profile display names
* Avatar configuration
* Customization layout
* Search
* Notifications
* Analytics

---

## Future Source Modules

Potential future Move modules:

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

## Development Principles

Build small modules.

Keep state ownership clear.

Use Passport as the player journey object.

Use Identity as the root ownership object.

Use authority modules for sensitive permissions.

Use events for indexing.

Keep private evidence off-chain.

Do not let payment create reputation.

Do not let conduct replace reputation.

Do not let boosts become governance.

Do not store chat messages directly in Move.

---

## Current Milestone

Current milestone:

```text
Phase 1 Core Move Protocol Complete
```

Current achievement:

```text
Identity + Passport + Badge + Boost core builds and passes tests.
```

Next coding milestone:

```text
Phase 1.1 Verification and Membership Authority
```

Planned next modules:

```text
verification.move
membership.move
```

These modules should begin moving tier authority away from Passport-only functions and toward explicit authority gates.

---

## Core Principle

Nami should be modular enough to grow into a full gaming identity world without losing clarity.

Each system should own one responsibility.

Identity owns presence.

Passport owns journey.

Membership owns access.

Reputation owns earned standing.

Conduct owns interaction signal.

Moderation owns restrictions.

Discovery owns visibility.

Customization owns expression.

Sui anchors proof.
