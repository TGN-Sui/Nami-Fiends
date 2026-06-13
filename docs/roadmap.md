# Nami Roadmap

## Purpose

Nami is a Sui-powered gaming identity, reputation, access, moderation, customization, and social protocol.

The goal is to build a portable gamer identity and trust layer for players, channels, squads, guilds, developers, creators, and future game-connected communities.

Nami should feel like a world gamers enter, not a form they fill out.

---

## Current Status

Current package:

```text
contracts/nami
```

Current protocol status:

```text
Build passing
55 tests passing
0 warnings
```

Current MVP progress:

```text
[██████████████░░░░░░] 71%
```

---

# Current Move Modules

Implemented modules:

```text
admin.move
appeals.move
badge.move
badge_issuer.move
boost.move
channel.move
channel_access.move
conduct.move
cosmetics.move
errors.move
guild.move
identity.move
jury.move
membership.move
moderation.move
passport.move
profile.move
recovery.move
squad.move
title.move
verification.move
```

Current test file:

```text
tests/nami_tests.move
```

---

# Completed Protocol Systems

Current implemented systems:

```text
Identity
Passport
Verification
Membership
Reputation
Badges
Badge Issuers
Boosts
Channels
Channel Access
Conduct
Moderation
Admin Authority
Appeals
Jury
Squads
Guilds
Profiles
Titles
Cosmetics
Recovery
Errors
```

---

# Current MVP Capabilities

Nami currently supports:

* Identity creation
* Passport creation
* NPC default tier
* Verification from NPC to Adventurer
* Pro and Elite upgrades through AdminCap
* Curved progression and reputation
* Badge minting
* Badge issuer authority
* Boost usage
* Channel creation, update, and verification
* Channel access policies tied to real Channel ownership
* NPC chat toggle
* Conduct Signals
* Black Passport restrictions
* Moderation records
* Mutes and channel bans blocking chat
* Appeals
* Advisory jury review
* Squads
* Guilds
* Public Profiles
* Earned Titles
* Cosmetic unlocks and loadouts
* Recovery requests and admin resolution

---

# Current Authority Model

AdminCap currently controls sensitive MVP actions:

```text
Badge issuer approval
Pro / Elite upgrades
Moderation actions
Appeal resolution
Jury case open / close
Cosmetic unlock grants
Recovery resolution
Channel verification
```

AdminCap is the MVP safety model.

It is not the final decentralization model.

---

# Current Effective Access Model

Nami does not rely only on raw Passport tier.

Effective access may include:

```text
Passport tier
+ Conduct status
+ Channel policy
+ Moderation records
```

Black Passport forces active benefits into NPC-equivalent restrictions while active.

This currently affects:

```text
Boosts
Channel chat
Squads
Guilds
Jury eligibility
Profile updates
Title claiming/equipping
Cosmetic equipping
```

---

# Current Documentation Status

Core documentation is synced with the latest protocol modules.

Recently synced:

```text
customization.md
recovery.md
events.md
onchain.md
access-control.md
architecture.md
systems.md
```

Remaining mini-sync targets:

```text
roadmap.md
README.md
admin.md
membership.md
moderation.md
conduct-system.md
```

Some of these may only need small updates.

---

# MVP Definition

A presentable MVP requires more than passing contracts.

Minimum presentable MVP:

```text
Move protocol foundation
Passing test suite
Documentation aligned with code
Testnet deployment path
Backend event indexer
Basic frontend Passport/Profile UI
Basic Channel UI
Basic moderation/admin dashboard
Basic appeal/jury dashboard
Basic recovery request view
Basic SDK read helpers
zkLogin or wallet onboarding flow
Scenario/adversarial test suite
```

---

# Current MVP Progress

```text
Nami Presentable MVP Progress

[██████████████░░░░░░] 71%
```

Current breakdown:

```text
On-chain protocol foundation:   ~98% done
Documentation architecture:     Mini-sync in progress
Backend/indexer:                 0% done
Frontend/profile UI:             0% done
SDK integration:                 0% done
zkLogin production flow:          0% done
```

---

# Phase 0 — Documentation Foundation

Status:

```text
Mostly complete
```

Goal:

Keep docs aligned with source code.

Current focus:

```text
Mini-sync docs after title, cosmetics, recovery, channel, and profile modules
```

---

# Phase 1 — Core Move Protocol

Status:

```text
Near complete
```

Implemented:

```text
Identity
Passport
Verification
Membership
Reputation
Badges
Badge Issuers
Boosts
Channels
Channel Access
Conduct
Moderation
Admin
Appeals
Jury
Squads
Guilds
Profiles
Titles
Cosmetics
Recovery
Errors
```

Remaining possible Phase 1 hardening:

```text
Membership expiration
Admin role separation
More negative tests
Scenario/adversarial test suite
Deployment scripts
```

---

# Phase 1.8 — Protocol Hardening

Status:

```text
Next recommended coding phase
```

Goal:

Try to break the system before moving heavily into frontend/backend.

Planned scenario tests:

```text
Unauthorized owner attempts
Wrong Passport / Conduct pairing
Black Passport bypass attempts
Invalid tier transitions
Invalid badge issuer permissions
Invalid channel policy ownership
Moderation bypass attempts
Appeal ownership abuse
Jury eligibility abuse
Squad and Guild authority abuse
Profile/title/cosmetic restriction bypass
Recovery abuse paths
```

This phase should intentionally test hostile and incorrect flows.

---

# Phase 2 — Backend Event Indexer

Status:

```text
Not started
```

Goal:

Index Sui events and build app-ready views.

Initial backend services:

```text
Event indexer
Profile service
Passport timeline
Badge history
Boost history
Channel service
Moderation service
Appeal service
Jury service
Squad service
Guild service
Recovery service
```

---

# Phase 3 — Frontend MVP

Status:

```text
Not started
```

Minimum frontend screens:

```text
Sign in
Create Identity
Create Passport
View Profile
View Passport
View badges
View titles
View cosmetics
View Conduct Signal
View membership tier
Channel page
Channel access settings
Squad page
Guild page
Moderation/admin dashboard
Appeal/jury dashboard
Recovery request page
```

---

# Phase 4 — SDK Layer

Status:

```text
Not started
```

Initial SDK helpers:

```text
Read Identity
Read Passport
Read Profile
Read Membership
Read Reputation
Read Badges
Read Conduct
Read Channel
Check Channel Access
Read Squads
Read Guilds
Read Titles
Read Cosmetics
Subscribe to events
```

---

# Phase 5 — zkLogin / Wallet Onboarding

Status:

```text
Not started
```

Goal:

Create a gamer-friendly login and onboarding flow.

Potential paths:

```text
Wallet connect
zkLogin
Social login references
Future linked accounts
Recovery-aware onboarding
```

---

# Phase 6 — Discovery Layer

Status:

```text
Planned
```

Discovery may use:

```text
Boosts
Reputation
Badge quality
Conduct health
Moderation health
Channel verification
Guild activity
Squad activity
Profile activity
Developer verification
```

Discovery should be mostly off-chain and anchored by on-chain signals.

---

# Phase 7 — Public Launch Preparation

Status:

```text
Future
```

Launch requirements:

```text
Testnet deployment
Deployment docs
Security review
AdminCap custody plan
Backend indexer live
Frontend MVP live
Basic analytics
Moderation dashboard
Privacy review
Community guideline drafts
Support/recovery process
Scenario test results
```

---

# Long-Term Vision

Nami becomes a portable identity and trust layer for gaming.

A player should be able to carry their:

```text
Identity
Passport
Profile
Reputation
Badges
Titles
Cosmetics
Conduct Signal
Membership access
Squads
Guilds
Channel history
Appeals history
Recovery history
Prestige
Developer relationships
Discovery influence
```

across connected games, communities, and experiences.
