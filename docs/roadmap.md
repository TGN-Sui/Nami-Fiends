# Nami Roadmap

## Overview

Nami is an interoperable gaming identity, reputation, access, discovery, moderation, and communication protocol.

Nami is being built for gamers, developers, guilds, squads, creators, channels, and future game communities.

The goal is not only to build a chat app.

The goal is to build a portable gamer identity and trust layer that can support world chat, developer hubs, game channels, discovery, moderation, customization, squads, guilds, appeals, and future SDK integrations.

---

# Current Status

## Current Phase

Nami is currently in:

```text
Phase 1.6 — Core On-Chain Protocol Expansion
```

The core Sui Move foundation is now strongly established.

Current package path:

```text
nami_chat/contracts/nami
```

Current status:

```text
Build passing
33 tests passing
0 warnings
```

---

# Current Move Modules

Current source modules:

```text
sources/
├── admin.move
├── appeals.move
├── badge.move
├── badge_issuer.move
├── boost.move
├── channel_access.move
├── conduct.move
├── errors.move
├── identity.move
├── jury.move
├── membership.move
├── moderation.move
├── passport.move
├── squad.move
└── verification.move
```

Current test file:

```text
tests/nami_tests.move
```

---

# Completed Core Systems

## Identity System

Status: Implemented Core

Identity is the root ownership layer.

Current capabilities:

* Identity object creation
* Owner tracking
* zkLogin/wallet-compatible ownership model
* Verification placeholder
* Trust placeholder
* Passport reference placeholder
* Creation timestamp
* Versioning
* Identity getters

Identity should remain small and stable.

---

## Passport System

Status: Implemented Core

Passport is the gamer journey layer.

Current capabilities:

* Passport creation
* NPC default membership tier
* XP tracking
* Curved level progression
* Level progress tracking
* Badge points
* Reputation ranks
* Archetype
* Boost score placeholder
* Prestige points placeholder
* Safe getters
* Tier mutation through controlled internal paths

Current default Passport state:

```text
Level 1
0 XP
0 level progress
0 badge points
Newbie reputation
NPC membership tier
0 prestige points
```

---

## Progression and Reputation

Status: Implemented Core

Progression is no longer linear.

Current progression design:

* Badge points feed XP
* XP feeds curved level progression
* Higher levels require more XP
* Level 100 is intended to represent meaningful dedication
* Prestige points begin after max-level progression
* Reputation is earned from badge points and progression

Current reputation ranks:

```text
Newbie
Gamester
Goblin
Goonie
Fiend
```

Reputation cannot be purchased.

---

## Verification System

Status: Implemented Core Authority

Verification controls the transition:

```text
NPC → Adventurer
```

Current capabilities:

* VerificationRecord object
* Supported verification source codes
* Identity ownership check
* Passport-to-Identity link check
* NPC to Adventurer transition
* IdentityVerified event

Future verification paths may include:

* zkLogin
* X.com
* Steam
* Epic Games
* SuiNS
* Email
* Privacy-preserving verification proofs

---

## Membership System

Status: Implemented Authority Wrapper

Membership currently controls:

```text
Adventurer → Pro → Elite
```

Current capabilities:

* Effective tier reads
* Conduct-aware effective tier reads
* Package-gated Pro upgrade
* Package-gated Elite upgrade
* Black Passport fallback to NPC-equivalent benefits

Future membership work:

* Expiration
* Renewal
* Grace periods
* Subscription proof
* Effective access snapshots

---

## Badge System

Status: Implemented Core

Current badge types:

```text
Basic Badge = 1 point
Event Badge = 2 points
Completion Badge = 3 points
```

Current capabilities:

* Badge object creation
* Badge minting
* Badge points applied to Passport
* XP updates
* Reputation updates
* BadgeMinted event

---

## Badge Issuer System

Status: Implemented Authority Layer

Badge issuer authority now controls who can issue specific badge types.

Current capabilities:

* BadgeIssuerCap object
* Issuer type classification
* Basic Badge permission
* Event Badge permission
* Completion Badge permission
* Permission-gated badge issuance
* BadgeIssuedByIssuer event

This supports the rule:

```text
Starting a game should not issue a Completion Badge.
```

Completion Badges require explicit authority.

---

## Boost System

Status: Implemented Core + Conduct-Aware Access

Current boost model:

```text
NPC = blocked
Adventurer = 1 boost
Pro = 6 boosts
Elite = 8 boosts
```

Current capabilities:

* Boost object creation
* BoostUsed event
* Effective tier checks
* Conduct-aware boost path
* Black Passport blocks boost benefits

Future boost work:

* Weekly cycles
* No rollover
* Per-channel caps
* Boost history indexing
* Discovery scoring

---

## Channel Access System

Status: Implemented Core + Moderation-Aware Access

Current capabilities:

* ChannelAccessPolicy object
* NPC chat toggle
* Minimum tier requirement
* Minimum reputation requirement
* Conduct-aware chat checks
* Moderation-aware chat checks
* Mutes block chat
* Channel bans block chat
* Black Passport blocks chat

Core channel rule:

```text
Allow NPC Chat: Yes / No
```

---

## Conduct System

Status: Implemented Core

Current Conduct Signals:

```text
Green
Orange
Red
Black
```

Current capabilities:

* ConductStatus object
* User-selected public signal
* Green, Orange, Red selectable by user
* Black reserved for moderation penalty
* PassportDowned event
* PassportRespawned event
* Active benefit checks
* Black Passport disables benefits

Public language:

```text
Passport downed. Respawning in...
```

---

## Moderation System

Status: Implemented Core Authority

Current moderation actions:

```text
Warning
Mute
Channel Ban
Black Passport
```

Current capabilities:

* ModerationRecord object
* Warning records
* Mute records
* Channel ban records
* Black Passport records
* Active restriction checks
* Chat-blocking checks
* Integration with Conduct
* Integration with Channel Access

---

## Admin Authority System

Status: Implemented Core Authority

AdminCap is now the controlled authority layer for sensitive actions.

Current AdminCap authority includes:

* Approve badge issuers
* Upgrade to Pro
* Upgrade to Elite
* Issue warning
* Issue mute
* Issue channel ban
* Issue Black Passport
* Resolve appeals
* Open jury cases
* Close jury cases

AdminCap creates the first real-world authority boundary for the protocol.

---

## Appeals System

Status: Implemented Core

Appeals create a fairness loop after moderation actions.

Current flow:

```text
Moderation action → Appeal opened → Admin resolution
```

Current capabilities:

* AppealCase object
* AppealOpened event
* AppealResolved event
* Open appeal for own moderation record
* Admin resolves appeal
* Approved / Denied / Modified outcomes

Appeal evidence should remain off-chain or privacy-preserving.

---

## Jury System

Status: Implemented Advisory Core

The Jury System creates the first community review layer.

Current flow:

```text
Appeal → JuryCase → Pro/Elite juror vote → Jury recommendation
```

Current capabilities:

* JuryCase object
* JuryVoteReceipt object
* Admin opens jury case
* Pro/Elite juror eligibility
* Black Passport blocks jury eligibility through effective tier
* Juror vote submission
* Admin closes jury case
* Final recommendation calculation

Current jury results:

```text
Approved
Denied
Modified
```

Jury is advisory at this stage.

---

## Squad System

Status: Implemented Core

Squads are small trust and sponsorship groups.

Current capabilities:

* Squad object
* SquadMember object
* Pro users can create squads
* Elite users can create squads
* NPC users cannot create squads
* Black Passport blocks squad benefits through effective tier
* Squad owner can sponsor members
* Pro squad slots
* Elite squad slots

Current slot model:

```text
Pro = 3 squad slots
Elite = 8 squad slots
```

---

# Current Test Coverage

Current test count:

```text
33 tests passing
0 failed
0 warnings
```

Current tests cover:

* Identity creation
* Passport creation
* NPC default tier
* Verification NPC to Adventurer flow
* Invalid verification source failure
* Membership upgrades
* Badge minting
* Badge point reputation updates
* Badge issuer permissions
* NPC boost restriction
* Adventurer boost access
* Channel NPC chat toggle
* Channel tier requirements
* Conduct creation
* Conduct signal updates
* User cannot select Black
* Black Passport disables benefits
* Black Passport affects effective tier
* Black Passport blocks chat
* Moderation warnings
* Moderation Black Passport action
* Moderation mute blocks chat
* Moderation channel ban blocks chat
* AdminCap issuer approval
* AdminCap membership upgrades
* AdminCap moderation actions
* Appeal opening
* Appeal resolution
* Jury case opening
* Jury voting
* Jury case closing
* Squad creation
* NPC squad restriction
* Squad sponsorship

---

# MVP Definition

A presentable MVP requires more than on-chain modules.

The minimum presentable MVP should include:

* Sui Move protocol foundation
* Passing tests
* Basic deployment path
* Backend event indexer
* Basic profile service
* Basic frontend Passport UI
* Basic channel UI
* Basic moderation/admin dashboard
* Simple wallet or zkLogin login flow
* Documentation aligned with code
* README setup instructions

---

# Current MVP Progress

```text
Nami Presentable MVP Progress

[███████████░░░░░░░░░] 55%
```

Current breakdown:

```text
On-chain protocol foundation:   ~93% done
Documentation architecture:     ~85% done
Backend/indexer:                 0% done
Frontend/profile UI:             0% done
SDK integration:                 0% done
zkLogin production flow:          0% done
```

---

# Phase 0 — Documentation Foundation

Status: Active / Near Complete

Goal:

Keep all protocol documents aligned with the actual source code.

Remaining documentation sync targets:

* architecture.md
* systems.md
* onchain.md
* events.md
* access-control.md
* moderation.md
* conduct-system.md
* squads.md
* badge-system.md
* membership.md
* admin.md
* appeals.md
* jury.md

---

# Phase 1 — Core Move Protocol

Status: Mostly Complete

Implemented:

* identity.move
* passport.move
* verification.move
* membership.move
* badge.move
* badge_issuer.move
* boost.move
* channel_access.move
* conduct.move
* moderation.move
* admin.move
* appeals.move
* jury.move
* squad.move
* errors.move

Remaining possible Phase 1 modules:

* guild.move
* customization/cosmetics.move
* title.move
* recovery.move

---

# Phase 1.7 — Documentation Sync

Status: Current Priority

Goal:

Bring documentation to 100% alignment with the current codebase before adding more modules.

This prevents architectural drift.

This phase should be completed before continuing with:

* guild.move
* cosmetics.move
* recovery.move
* backend/indexer
* frontend UI

---

# Phase 2 — Guild System

Status: Planned

Goal:

Build larger persistent community structures.

Planned guild capabilities:

* Guild object
* Guild founder
* Guild roles
* Guild membership
* Guild reputation
* Guild access policies
* Guild event hooks
* Guild badge issuer hooks
* Guild discovery hooks

Guild creation should likely require:

* Adventurer or higher
* Minimum reputation
* No active Black Passport
* Possibly Pro or Elite for advanced guild features

---

# Phase 3 — Customization System

Status: Planned

Goal:

Create gamer-native identity expression.

Planned customization:

* Profile avatars
* 2D VTuber-style avatars
* Profile frames
* Passport themes
* Chat overlays
* Fonts
* Badge displays
* Earned title displays
* Guild display selection
* Prestige effects

Most customization should be off-chain.

On-chain should store meaningful unlock proofs.

---

# Phase 4 — Recovery System

Status: Planned

Goal:

Help users recover their Nami Identity and Passport safely.

Possible recovery paths:

* zkLogin recovery
* Linked social recovery
* Linked game account recovery
* Optional email recovery
* Squad support
* Guild support
* Manual review

Recovery should protect against account theft.

---

# Phase 5 — Backend and Indexer

Status: Not Started

Goal:

Build off-chain services that read Sui events and power the app experience.

Planned services:

* Event indexer
* Profile service
* Passport timeline service
* Badge history service
* Boost history service
* Moderation service
* Appeal service
* Jury service
* Squad service
* Discovery engine

---

# Phase 6 — Frontend MVP

Status: Not Started

Goal:

Build the first usable Nami interface.

Minimum frontend screens:

* Connect/sign in
* Create Identity
* Create Passport
* View Passport
* View reputation
* View badges
* View Conduct Signal
* View membership tier
* Channel access demo
* Moderation/admin demo
* Appeal demo
* Squad demo

---

# Phase 7 — SDK Layer

Status: Not Started

Goal:

Allow games, websites, dApps, guilds, and developer hubs to integrate Nami.

Planned SDK features:

* Identity read
* Passport read
* Membership read
* Reputation read
* Badge read
* Conduct read
* Channel access check
* Boost call helper
* Event subscription helper

---

# Phase 8 — Discovery Layer

Status: Planned

Goal:

Build community-driven discovery.

Discovery inputs may include:

* Boosts
* Reputation
* Badge quality
* Conduct health
* Moderation health
* Channel activity
* Guild activity
* Squad activity
* Developer verification

Boosts should influence discovery, not fully control it.

---

# Phase 9 — Public Launch Preparation

Status: Future

Required before public launch:

* Testnet deployment
* Deployment documentation
* Security review
* Admin key/cap management plan
* Backend indexer running
* Frontend MVP
* Basic analytics
* Basic moderation dashboard
* Privacy review
* Terms and community guideline drafts
* User onboarding flow
* Support/recovery flow

---

# Long-Term Vision

Nami becomes the persistent identity and trust layer for gaming.

A player should be able to carry their:

* Identity
* Passport
* Reputation
* Badges
* Titles
* Conduct Signal
* Membership access
* Guild history
* Squad relationships
* Appeals history
* Prestige
* Customization unlocks
* Developer relationships
* Discovery influence

across every connected experience.

Nami should feel like a world gamers enter, not a form they fill out.
