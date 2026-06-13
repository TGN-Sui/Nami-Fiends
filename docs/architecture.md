# Nami Architecture

## Purpose

Nami is a Sui-powered gaming identity, reputation, access, moderation, customization, and social protocol.

Nami is not only a chat app.

Nami is a portable gamer identity and trust layer for players, channels, squads, guilds, developers, creators, and future game-connected communities.

---

## Current Status

Current package:

```text
nami_chat/contracts/nami
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

# Repository Structure

```text
nami_chat/
├── backend/
├── contracts/
│   └── nami/
│       ├── sources/
│       ├── tests/
│       ├── Move.toml
│       └── Move.lock
├── docs/
├── frontend/
├── sdk/
└── README.md
```

---

# Layer Responsibilities

## contracts/

The Sui Move contract layer anchors durable protocol state.

Current responsibilities include:

* Identity ownership
* Passport progression
* Verification
* Membership
* Reputation
* Badges
* Boosts
* Channels
* Channel access
* Conduct
* Moderation
* Appeals
* Jury review
* Squads
* Guilds
* Profiles
* Titles
* Cosmetics
* Recovery requests
* Admin authority

---

## docs/

The documentation layer defines the protocol model, access rules, trust boundaries, architecture, and roadmap.

Docs should stay aligned with source code.

---

## backend/

The backend will index Sui events and power user-facing views.

Planned responsibilities:

* Event indexer
* Profile service
* Passport timeline
* Badge history
* Boost history
* Channel views
* Moderation dashboard
* Appeal dashboard
* Jury dashboard
* Squad and Guild views
* Discovery engine
* Recovery review dashboard

---

## frontend/

The frontend will provide the gamer-facing app experience.

Minimum surfaces:

* Sign-in
* Create Identity
* Create Passport
* View Profile
* View Passport
* View badges
* View titles
* View cosmetics
* View Conduct Signal
* Channel pages
* Squad pages
* Guild pages
* Admin/moderation demo
* Appeal/jury demo
* Recovery request demo

---

## sdk/

The SDK will allow games, dApps, channels, guilds, and developer hubs to integrate Nami.

Planned SDK responsibilities:

* Identity reads
* Passport reads
* Profile reads
* Membership reads
* Reputation reads
* Badge reads
* Conduct reads
* Channel access checks
* Boost helpers
* Squad reads
* Guild reads
* Event subscriptions
* zkLogin helpers

---

# Current Move Modules

```text
sources/
├── admin.move
├── appeals.move
├── badge.move
├── badge_issuer.move
├── boost.move
├── channel.move
├── channel_access.move
├── conduct.move
├── cosmetics.move
├── errors.move
├── guild.move
├── identity.move
├── jury.move
├── membership.move
├── moderation.move
├── passport.move
├── profile.move
├── recovery.move
├── squad.move
├── title.move
└── verification.move
```

Current tests:

```text
tests/nami_tests.move
```

---

# High-Level Protocol Map

```text
Identity
  ↓
Passport
  ├── Verification
  ├── Membership
  ├── Reputation
  ├── Badges
  ├── Boosts
  ├── Conduct
  ├── Profile
  ├── Titles
  ├── Cosmetics
  ├── Channels
  ├── Channel Access
  ├── Moderation
  ├── Appeals
  ├── Jury
  ├── Squads
  ├── Guilds
  └── Recovery
```

Authority layer:

```text
AdminCap
  ├── Badge Issuer Approval
  ├── Membership Upgrades
  ├── Moderation Actions
  ├── Appeal Resolution
  ├── Jury Case Open / Close
  ├── Cosmetic Unlock Grants
  ├── Recovery Resolution
  └── Channel Verification
```

---

# Core Architecture Concepts

## Identity

Identity is the root ownership layer.

It should stay small, stable, and privacy-conscious.

Identity should not store progression, reputation, badges, conduct, moderation, or customization state.

---

## Passport

Passport is the player journey layer.

It stores progression, XP, level, badge points, reputation, archetype, membership tier, and future prestige hooks.

New Passports start as:

```text
NPC
```

---

## Verification

Verification controls the transition:

```text
NPC → Adventurer
```

Verification proves authenticity.

Verification does not create reputation.

---

## Membership

Membership controls feature access.

Current tiers:

```text
NPC
Adventurer
Pro
Elite
```

Membership does not equal trust or reputation.

---

## Reputation

Reputation is earned through meaningful activity.

Current reputation inputs include:

* Badge points
* XP
* Level progression

Reputation cannot be purchased.

---

## Badges

Badges are achievement and participation proofs.

Badge issuer authority protects badge quality.

Completion Badges require explicit permission.

---

## Boosts

Boosts are discovery signals.

They do not grant reputation, governance, ownership, or moderation authority.

---

## Conduct

Conduct communicates interaction style and restriction state.

Current signals:

```text
Green
Orange
Red
Black
```

Black Passport restricts active benefits.

---

## Channels

Channels are creator/community spaces.

Channels support:

* Owner
* Owner Passport ID
* Public/private setting
* Metadata reference
* Verification flag

Verified Channels are currently approved through AdminCap.

---

## Channel Access

Channel Access controls chat eligibility.

Policies are now tied to real Channel ownership.

Current policy inputs include:

* NPC chat toggle
* Minimum tier
* Minimum reputation
* Conduct status
* Moderation records

---

## Moderation

Moderation protects users and communities.

Current moderation actions:

```text
Warning
Mute
Channel Ban
Black Passport
```

Mutes and channel bans block chat.

Black Passport globally restricts active benefits.

---

## Appeals

Appeals give users a review path after moderation actions.

Current flow:

```text
Moderation action → Appeal opened → Admin resolution
```

---

## Jury

Jury review gives trusted users an advisory voice in appeals.

Current flow:

```text
Appeal → JuryCase → Pro/Elite vote → Recommendation
```

Jury is advisory during MVP.

---

## Squads

Squads are small trust and sponsorship groups.

Current eligibility:

```text
Pro or Elite
No active Black Passport
```

---

## Guilds

Guilds are larger persistent communities.

Current eligibility:

```text
Adventurer, Pro, or Elite
No active Black Passport
```

Guilds are separate from Squads.

---

## Profiles

Profiles are public display anchors for Passports.

Profiles store references for:

* Display name
* Bio
* Avatar
* Metadata

Rich media should remain off-chain.

---

## Titles

Titles are earned display proofs.

Current title source:

```text
Passport reputation
```

Titles do not grant authority or membership.

---

## Cosmetics

Cosmetics are customization unlock proofs and equipped loadouts.

Current categories:

```text
Profile Frame
Passport Theme
Chat Overlay
Avatar Style
Badge Display
Title Effect
```

Cosmetics do not grant reputation, verification, or authority.

---

## Recovery

Recovery creates formal account-safety requests.

Current flow:

```text
Identity + Passport → RecoveryRequest → Admin resolution
```

Recovery does not transfer ownership yet.

---

# Effective Access Model

Nami avoids relying only on raw Passport tier.

Effective access may include:

```text
Passport tier
+ Conduct status
+ Channel policy
+ Moderation records
```

Black Passport forces active benefits into NPC-equivalent restrictions while active.

This affects:

* Boosts
* Channel chat
* Squad access
* Guild actions
* Jury eligibility
* Profile updates
* Title claiming/equipping
* Cosmetic equipping

---

# On-Chain vs Off-Chain Split

## On-Chain

Nami should anchor durable protocol state on-chain:

* Identity
* Passport
* Verification records
* Membership tier state
* Badges
* Badge issuer caps
* Boosts
* Channels
* Channel policies
* Conduct status
* Moderation records
* Appeals
* Jury cases
* Squad and Guild objects
* Profiles
* Titles
* Cosmetic unlocks/loadouts
* Recovery requests
* Admin actions

---

## Off-Chain

Nami should keep high-volume or private data off-chain:

* Chat messages
* Attachments
* Private moderation evidence
* Private appeal evidence
* Private jury evidence
* Private recovery evidence
* Discovery ranking
* Search
* Notifications
* Long bios
* Avatar media
* Cosmetic assets
* Analytics

---

# Current Test Coverage

Current status:

```text
55 tests passing
0 warnings
```

Tests currently cover:

* Identity and Passport creation
* NPC default tier
* Verification
* Membership upgrades
* Badge progression
* Badge issuer permissions
* Boost access
* Channel creation/update/verification
* Channel access policy ownership
* Conduct restrictions
* Moderation enforcement
* Admin authority
* Appeals
* Jury review
* Squads
* Guilds
* Profiles
* Titles
* Cosmetics
* Recovery

---

# Current Dependency Map

```text
verification.move → identity.move + passport.move

membership.move → passport.move + conduct.move

badge.move → passport.move

badge_issuer.move → badge.move + passport.move

boost.move → membership.move + passport.move + conduct.move

channel.move → membership.move + passport.move + conduct.move

channel_access.move → channel.move + membership.move + passport.move + conduct.move + moderation.move

moderation.move → passport.move + conduct.move

appeals.move → passport.move + moderation.move

jury.move → appeals.move + passport.move + membership.move + conduct.move

squad.move → passport.move + membership.move + conduct.move

guild.move → passport.move + membership.move + conduct.move

profile.move → passport.move + conduct.move

title.move → passport.move + conduct.move

cosmetics.move → passport.move + conduct.move

recovery.move → identity.move + passport.move

admin.move → badge_issuer.move + membership.move + moderation.move + appeals.move + jury.move + cosmetics.move + recovery.move + channel.move
```

---

# Future Architecture Work

Remaining major MVP layers:

```text
Backend event indexer
Frontend Passport/Profile UI
SDK helpers
zkLogin production flow
Testnet deployment scripts
Scenario/adversarial test suite
```

Future protocol modules may include:

```text
developer_identity.move
membership_record.move
guild_roles.move
discovery_anchor.move
cosmetic_registry.move
```

---

# Architecture Principles

Identity owns presence.

Passport owns journey.

Verification unlocks trusted entry.

Membership controls access.

Reputation is earned.

Badges prove meaningful activity.

Conduct communicates interaction state.

Black Passport restricts active benefits.

Moderation protects communities.

Appeals create fairness.

Jury adds community voice.

Squads create small trust networks.

Guilds create larger communities.

Profiles display identity.

Titles recognize earned status.

Cosmetics express style.

Recovery protects continuity.

AdminCap secures MVP authority.

Backend powers scale.

Frontend creates the gamer experience.

SDK expands the ecosystem.

Sui anchors proof.
