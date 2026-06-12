# Nami Systems Overview

## Overview

Nami is a modular gaming identity, reputation, access, moderation, and social protocol.

Each Nami system has a specific responsibility.

The goal is to avoid mixing identity, reputation, membership, moderation, conduct, and social systems into one confusing object.

Nami should remain clear, scalable, and easy to extend.

---

# Core Principle

Each system should answer one primary question.

Identity answers:

```text
Who owns this presence?
```

Passport answers:

```text
What has this player done?
```

Verification answers:

```text
Has this player proven enough authenticity to unlock trusted access?
```

Membership answers:

```text
What benefits can this player access?
```

Reputation answers:

```text
What has this player earned?
```

Conduct answers:

```text
What kind of interaction should others expect?
```

Moderation answers:

```text
What restrictions are currently applied?
```

Appeals answer:

```text
How can a player challenge a moderation action?
```

Jury answers:

```text
How can trusted community members provide advisory review?
```

Squads answer:

```text
Who does this player personally sponsor or trust?
```

---

# Current Protocol Status

Current package:

```text
contracts/nami
```

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

Current test status:

```text
33 tests passing
0 warnings
```

---

# System Map

Current implemented systems:

* Identity System
* Passport System
* Verification System
* Membership System
* Reputation System
* Badge System
* Badge Issuer System
* Boost System
* Channel Access System
* Conduct System
* Moderation System
* Admin Authority System
* Appeals System
* Jury System
* Squad System
* Error System

Planned future systems:

* Guild System
* Customization System
* Title System
* Recovery System
* Discovery System
* Backend Indexer
* Frontend App
* SDK Layer
* zkLogin Production Flow

---

# Identity System

## Purpose

Identity is the root ownership layer.

Identity represents the owner-controlled Nami presence.

---

## Current Module

```move
module nami::identity
```

---

## Current Responsibilities

Identity currently supports:

* Identity object creation
* Owner tracking
* Verification level placeholder
* Trust tier placeholder
* Passport reference placeholder
* Creation timestamp
* Versioning
* Safe getters

---

## Should Not Handle

Identity should not store:

* XP
* Level
* Reputation
* Badge points
* Membership tier
* Conduct Signal
* Moderation evidence
* Appeals
* Jury votes
* Chat messages
* Guild memberships
* Squad memberships
* Customization settings

Identity should remain small and stable.

---

# Passport System

## Purpose

Passport is the gamer journey layer.

Passport stores progression, reputation, membership state, archetype, and future prestige state.

---

## Current Module

```move
module nami::passport
```

---

## Current Responsibilities

Passport currently supports:

* Passport object creation
* Linked Identity ID
* XP
* Curved level progression
* Level progress
* Badge points
* Reputation
* Archetype
* Membership tier
* Boost score placeholder
* Prestige points placeholder
* Safe getters
* Package-only state mutation hooks

---

## Default State

A new Passport starts as:

```text
Level: 1
XP: 0
Level Progress: 0
Badge Points: 0
Reputation: Newbie
Membership Tier: NPC
Prestige Points: 0
```

Everyone starts as NPC.

A new Passport should not automatically start as Adventurer.

---

# Verification System

## Purpose

Verification controls the transition from free/unverified access to verified-human/basic access.

---

## Current Module

```move
module nami::verification
```

---

## Current Transition

```text
NPC → Adventurer
```

---

## Current Responsibilities

Verification currently supports:

* VerificationRecord object
* Verification source codes
* Identity ownership check
* Passport-to-Identity link check
* NPC to Adventurer upgrade
* IdentityVerified event
* Verification record getters

---

## Future Verification Sources

Potential future verification sources:

* zkLogin
* X.com
* Steam
* Epic Games
* SuiNS
* Email
* Google
* Apple
* Privacy-preserving proof systems

---

# Membership System

## Purpose

Membership controls access and benefits.

Membership does not represent reputation.

Membership does not override moderation.

---

## Current Module

```move
module nami::membership
```

---

## Current Tiers

```text
0 = NPC
1 = Adventurer
2 = Pro
3 = Elite
```

---

## Current Responsibilities

Membership currently supports:

* Raw effective tier reads
* Conduct-aware effective tier reads
* Adventurer to Pro upgrade through package authority
* Pro to Elite upgrade through package authority
* Black Passport fallback to NPC-equivalent tier

---

## Current Authority Path

Membership upgrades are currently exposed through:

```move
module nami::admin
```

AdminCap controls Pro and Elite upgrades.

---

## Future Responsibilities

Future membership work should include:

* Expiration
* Renewal
* Grace periods
* Subscription proof
* Active membership records
* Downgrade handling
* Membership history

---

# Reputation System

## Purpose

Reputation reflects earned activity and contribution.

Reputation cannot be purchased.

---

## Current Location

Reputation is currently stored in:

```move
module nami::passport
```

---

## Current Ranks

```text
0 = Newbie
1 = Gamester
2 = Goblin
3 = Goonie
4 = Fiend
```

---

## Current Inputs

Current reputation inputs:

* Badge points
* XP
* Level progression

---

## Current Direction

Reputation uses curved progression.

Higher reputation should require meaningful contribution.

Badge quality matters.

Completion Badges should represent real completion.

---

# Badge System

## Purpose

Badges are on-chain proof of achievement, participation, or contribution.

---

## Current Module

```move
module nami::badge
```

---

## Current Badge Types

```text
Basic Badge = 1 point
Event Badge = 2 points
Completion Badge = 3 points
```

---

## Current Responsibilities

Badge currently supports:

* Badge object creation
* Badge point resolution
* Badge minting
* Passport badge point updates
* XP updates
* Reputation updates
* BadgeMinted event

---

## Boundary

Badge logic creates and applies badge value.

Badge authority is handled separately by Badge Issuer.

---

# Badge Issuer System

## Purpose

Badge Issuer controls who can issue badges.

This protects reputation integrity.

---

## Current Module

```move
module nami::badge_issuer
```

---

## Current Responsibilities

Badge Issuer currently supports:

* BadgeIssuerCap object
* Issuer type classification
* Basic Badge permission
* Event Badge permission
* Completion Badge permission
* Permission-gated badge issuance
* BadgeIssuedByIssuer event

---

## Current Authority Path

Badge issuer approval is controlled through:

```move
module nami::admin
```

AdminCap can approve badge issuers.

---

## Core Rule

Starting a game should not issue a Completion Badge.

Opening a game should not issue a Completion Badge.

Joining a channel should not issue a Completion Badge.

Completion Badge authority must be explicitly granted.

---

# Boost System

## Purpose

Boosts are discovery signals.

Boosts help members support channels, games, guilds, events, and communities.

---

## Current Module

```move
module nami::boost
```

---

## Current Boost Model

```text
NPC = blocked
Adventurer = 1
Pro = 6
Elite = 8
```

---

## Current Responsibilities

Boost currently supports:

* Boost object creation
* Boost power resolution
* BoostUsed event
* Raw effective tier boost path
* Conduct-aware boost path
* NPC boost blocking
* Black Passport boost blocking

---

## Boundary

Boosts are not:

* Reputation
* Governance
* Ownership
* Moderation power
* Badge authority

Boosts influence discovery only.

---

# Channel Access System

## Purpose

Channel Access controls who can chat in a channel.

---

## Current Module

```move
module nami::channel_access
```

---

## Current Responsibilities

Channel Access currently supports:

* ChannelAccessPolicy object
* Channel owner field
* Channel ID field
* NPC chat toggle
* Minimum tier requirement
* Minimum reputation requirement
* Raw chat access checks
* Conduct-aware chat checks
* Conduct + moderation-aware chat checks

---

## Current Channel Controls

A channel can currently define:

```text
Allow NPC Chat: Yes / No
Minimum Tier
Minimum Reputation
```

---

## Current Blocking Conditions

Channel chat can currently be blocked by:

* NPC chat disabled
* Minimum tier not met
* Minimum reputation not met
* Active Black Passport
* Active mute
* Active channel ban

---

# Conduct System

## Purpose

Conduct communicates interaction style and moderation standing.

---

## Current Module

```move
module nami::conduct
```

---

## Current Signals

```text
Green
Orange
Red
Black
```

---

## Signal Meaning

Green:

Friendly, casual, low-conflict.

Orange:

Serious, competitive, but respectful.

Red:

High-intensity, PvP-heavy, trash-talk tolerant.

Black:

Moderation penalty state.

---

## Current Responsibilities

Conduct currently supports:

* ConductStatus object
* User-selectable Green, Orange, Red
* Black reserved for moderation
* User cannot select Black
* PassportDowned event
* PassportRespawned event
* Active benefits check
* Black Passport benefit restriction

---

## Black Passport

Public language:

```text
Passport downed. Respawning in...
```

Black Passport currently causes:

* Effective tier fallback to NPC
* Boost restriction
* Chat restriction
* Squad benefit restriction
* Jury eligibility restriction

Black Passport should not erase earned history by default.

---

# Moderation System

## Purpose

Moderation protects users, channels, and the protocol.

---

## Current Module

```move
module nami::moderation
```

---

## Current Actions

```text
Warning
Mute
Channel Ban
Black Passport
```

---

## Current Responsibilities

Moderation currently supports:

* ModerationRecord object
* Warning records
* Mute records
* Channel ban records
* Black Passport records
* Active restriction checks
* Active mute checks
* Active channel ban checks
* Chat-blocking checks
* Integration with Conduct
* Integration with Channel Access

---

## Authority Path

Moderation actions are package-gated and exposed through:

```move
module nami::admin
```

AdminCap is the current MVP authority.

---

# Admin Authority System

## Purpose

AdminCap controls sensitive protocol actions during the MVP phase.

---

## Current Module

```move
module nami::admin
```

---

## Current Responsibilities

Admin currently supports:

* AdminCap creation on package init
* Test AdminCap creation
* Badge issuer approval
* Upgrade to Pro
* Upgrade to Elite
* Issue warning
* Issue mute
* Issue channel ban
* Issue Black Passport
* Resolve appeals
* Open jury cases
* Close jury cases
* AdminAction events

---

## Boundary

AdminCap is the current safe MVP authority model.

AdminCap is not the final decentralization model.

Future systems may replace or extend AdminCap with:

* Role-based moderators
* Channel owner permissions
* Guild authority
* DAO-like governance
* Multi-admin controls
* Timelocks
* Emergency controls

---

# Appeals System

## Purpose

Appeals create a fairness loop after moderation actions.

---

## Current Module

```move
module nami::appeals
```

---

## Current Flow

```text
Moderation action → Appeal opened → Admin resolution
```

---

## Current Statuses

```text
Open
Approved
Denied
Modified
```

---

## Current Responsibilities

Appeals currently supports:

* AppealCase object
* AppealOpened event
* AppealResolved event
* Open appeal for own moderation record
* Validate moderation record ownership
* Reference moderation record ID
* Store public reference
* Admin-controlled resolution path

---

## Privacy Boundary

Appeal evidence should not be stored directly on-chain.

On-chain appeal data should use:

* Public reference
* Case label
* Evidence hash
* Off-chain storage reference
* Anonymized summary reference

Private evidence belongs off-chain or encrypted.

---

# Jury System

## Purpose

Jury creates advisory community review for appeals.

---

## Current Module

```move
module nami::jury
```

---

## Current Flow

```text
Appeal → JuryCase → Pro/Elite juror vote → Jury recommendation
```

---

## Current Jury Results

```text
Approved
Denied
Modified
```

---

## Current Responsibilities

Jury currently supports:

* JuryCase object
* JuryVoteReceipt object
* Admin-opened jury case
* Required vote count
* Pro/Elite juror eligibility
* Conduct-aware juror eligibility
* Black Passport juror blocking
* Vote submission
* Final recommendation calculation
* Admin-closed jury case

---

## Boundary

Jury is advisory at this stage.

Admin still performs final appeal resolution.

Future versions may allow stronger jury influence once abuse prevention and privacy systems are mature.

---

# Squad System

## Purpose

Squads are small trust and sponsorship groups.

Squads are gamer-native social structures.

---

## Current Module

```move
module nami::squad
```

---

## Current Slot Model

```text
Pro = 3 squad slots
Elite = 8 squad slots
```

---

## Current Responsibilities

Squad currently supports:

* Squad object
* SquadMember object
* Pro squad creation
* Elite squad creation
* NPC squad creation blocked
* Conduct-aware squad eligibility
* Black Passport squad blocking
* Squad owner sponsorship
* Slot limit enforcement
* SquadCreated event
* SquadMemberSponsored event

---

## Boundary

Squads are not guilds.

Squads are small trust networks.

Guilds will be larger persistent community structures.

---

# Error System

## Purpose

The Error System centralizes abort codes.

---

## Current Module

```move
module nami::errors
```

---

## Current Error Categories

Current error categories include:

* Identity
* Passport
* Verification
* Access Control
* Guilds
* Squads
* Boosts
* Badges
* Membership
* Badge Issuers
* Conduct
* Moderation
* Appeals
* Jury

---

## Rule

Modules should use shared error getter functions where possible.

This keeps abort behavior consistent across the protocol.

---

# Current System Dependency Map

## Core Dependency Flow

```text
Identity
  ↓
Passport
  ├── Verification
  ├── Membership
  ├── Reputation
  ├── Badges
  ├── Boosts
  ├── Channel Access
  ├── Conduct
  ├── Moderation
  ├── Appeals
  ├── Jury
  └── Squads
```

---

## Authority Dependency Flow

```text
AdminCap
  ├── Badge Issuer Approval
  ├── Membership Upgrades
  ├── Moderation Actions
  ├── Appeal Resolution
  ├── Jury Case Opening
  └── Jury Case Closing
```

---

## Social/Trust Dependency Flow

```text
Passport
  ↓
Membership + Conduct
  ↓
Squad Eligibility

Appeal
  ↓
JuryCase
  ↓
Pro/Elite Juror Vote
  ↓
Recommendation
```

---

# Current Test Coverage

Current test count:

```text
33 tests passing
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

# Future System: Guilds

## Purpose

Guilds will be larger persistent community structures.

Guilds may support:

* Guild object
* Founder
* Roles
* Members
* Guild reputation
* Guild events
* Guild channels
* Guild badge permissions
* Guild discovery signals

Guilds should not replace Squads.

---

# Future System: Customization

## Purpose

Customization allows identity expression.

Planned customization includes:

* 2D avatars
* Profile frames
* Passport themes
* Chat overlays
* Fonts
* Badge displays
* Earned title displays
* Guild display selection
* Prestige effects

Most customization settings should live off-chain.

Meaningful unlock proofs may live on-chain.

---

# Future System: Recovery

## Purpose

Recovery helps users regain access safely.

Possible recovery signals:

* zkLogin
* Linked social accounts
* Linked game accounts
* Optional email
* Squad support
* Guild support
* Manual review

Recovery must prevent account takeover.

---

# Future System: Discovery

## Purpose

Discovery helps users find quality communities.

Discovery may use:

* Boosts
* Reputation
* Badge quality
* Conduct health
* Moderation health
* Channel activity
* Guild activity
* Squad activity
* Developer verification
* Channel verification

Discovery should be computed mostly off-chain.

Sui should anchor trusted inputs.

---

# Future System: Backend Indexer

## Purpose

The backend indexer will read events and build user-facing data.

The indexer should power:

* Passport profiles
* Badge history
* Boost history
* Moderation timelines
* Appeal timelines
* Jury timelines
* Squad profiles
* Discovery rankings

Derived backend data should be rebuildable from on-chain events where possible.

---

# Future System: Frontend App

## Purpose

The frontend will make Nami usable.

Minimum frontend surfaces:

* Sign-in
* Create Identity
* Create Passport
* View Passport
* View reputation
* View membership
* View Conduct Signal
* View badges
* View squads
* Channel access demo
* Moderation/admin demo
* Appeals demo
* Jury demo

The frontend should feel like a gamer platform, not a blockchain explorer.

---

# Future System: SDK

## Purpose

The SDK lets external games and communities integrate Nami.

The SDK should support:

* Identity reads
* Passport reads
* Membership reads
* Reputation reads
* Badge reads
* Conduct reads
* Channel access checks
* Boost helpers
* Squad reads
* Event subscriptions
* Future zkLogin helpers

---

# System Boundaries

## Access Is Not Reputation

Membership controls access.

Reputation reflects earned contribution.

---

## Verification Is Not Reputation

Verification proves authenticity.

Reputation must still be earned.

---

## Conduct Is Not Reputation

Conduct communicates interaction style or restriction state.

Red is not punishment.

Black is punishment.

---

## Boosts Are Not Governance

Boosts influence discovery.

Boosts do not grant ownership, moderation power, or governance rights.

---

## Squads Are Not Guilds

Squads are small trust groups.

Guilds are larger community structures.

---

## Appeals Are Not Evidence Storage

Appeals should reference evidence.

Private evidence should stay off-chain or encrypted.

---

# MVP System Status

Current presentable MVP progress:

```text
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

# Core Principles

Nami should be modular.

Each system should own one responsibility.

Identity owns presence.

Passport owns journey.

Verification unlocks trusted entry.

Membership controls access.

Reputation is earned.

Badges prove meaningful activity.

Badge issuers protect quality.

Boosts signal discovery.

Channel Access controls participation.

Conduct communicates interaction state.

Moderation protects communities.

Appeals create fairness.

Jury adds community voice.

Squads create small trust networks.

AdminCap protects sensitive MVP actions.

Future backend services power scale.

Future frontend creates the gamer experience.

Future SDK expands Nami beyond its own app.
