# Nami Architecture

## Overview

Nami is a Sui-powered gaming identity, reputation, access, moderation, and social protocol.

The platform is designed for gamers, game developers, guilds, squads, verified channels, creators, and future game-integrated communities.

Nami is not only a chat application.

Nami is a portable gamer identity and trust layer.

The architecture separates the system into clear layers:

* Documentation
* Sui Move contracts
* Backend services
* Frontend application
* SDK integrations
* Future storage and privacy layers

Each layer has a specific responsibility.

---

# Repository Structure

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

# Layer Responsibilities

## docs/

The documentation layer defines protocol intent, system boundaries, architecture, trust rules, access rules, moderation rules, and roadmap direction.

Docs should answer:

* What does the system do?
* Why does it exist?
* What should live on-chain?
* What should stay off-chain?
* What is implemented now?
* What is planned later?

Docs should remain aligned with source code.

When docs and code disagree, the difference should be intentional and corrected quickly.

---

## contracts/

The contracts layer contains the Sui Move package.

Current package path:

```text
contracts/nami/
```

Current package name:

```text
nami
```

Current source path:

```text
contracts/nami/sources/
```

Current test path:

```text
contracts/nami/tests/
```

The contracts layer stores and enforces core protocol state.

It currently handles:

* Identity ownership
* Passport progression
* Verification state
* Membership access
* Badge issuance
* Badge issuer permissions
* Boost usage
* Channel access rules
* Conduct status
* Moderation records
* Admin authority
* Appeals
* Advisory jury flow
* Squads

---

## backend/

The backend layer will index events, power app experiences, and compute flexible off-chain logic.

Planned backend responsibilities:

* Sui event indexer
* Profile service
* Passport timeline service
* Badge history service
* Boost history service
* Discovery engine
* Moderation service
* Appeal service
* Jury service
* Squad service
* Guild service
* Notification service
* Search service
* Analytics service

The backend should not replace on-chain ownership.

The backend should make the protocol usable, searchable, fast, and presentable.

---

## frontend/

The frontend layer will provide the user-facing Nami experience.

Planned frontend surfaces:

* Landing page
* Sign-in / connect wallet
* Identity creation
* Passport creation
* Passport profile
* Reputation display
* Badge display
* Conduct Signal display
* Membership display
* Channel access demo
* Moderation/admin dashboard
* Appeal dashboard
* Jury review interface
* Squad profile
* Guild profile
* Customization editor
* Discovery page

The frontend should make Nami feel gamer-native, not like a blockchain dashboard.

---

## sdk/

The SDK layer will allow external games, apps, developer hubs, and community websites to integrate Nami.

Planned SDK responsibilities:

* Identity reads
* Passport reads
* Membership reads
* Reputation reads
* Badge reads
* Conduct reads
* Channel access checks
* Boost helper calls
* Squad reads
* Guild reads
* Event subscriptions
* Login helpers
* Future zkLogin helpers

The SDK should make Nami usable outside the Nami frontend.

---

# Current Move Package

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
33 tests passing
0 warnings
```

---

# Current Move Modules

Current modules:

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

# System Architecture Map

Current high-level flow:

```text
Identity
  ↓
Passport
  ├── Verification
  ├── Membership
  ├── Badge System
  ├── Badge Issuer Authority
  ├── Boost System
  ├── Channel Access
  ├── Conduct Signal
  ├── Moderation
  ├── Appeals
  ├── Jury
  └── Squads
```

Admin authority currently controls sensitive actions:

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

# Identity Architecture

## Purpose

Identity is the root ownership layer.

Identity answers:

```text
Who owns this Nami presence?
```

Current module:

```move
module nami::identity
```

Current responsibilities:

* Create Identity object
* Store owner
* Store verification level placeholder
* Store trust tier placeholder
* Store Passport reference placeholder
* Store creation timestamp
* Store version
* Expose safe getters

Identity should remain small, stable, and privacy-conscious.

---

## Identity Boundaries

Identity should not store:

* XP
* Level
* Reputation
* Badge points
* Membership tier
* Conduct Signal
* Moderation evidence
* Chat messages
* Customization settings
* Guild membership
* Squad membership

Those belong in separate systems.

---

# Passport Architecture

## Purpose

Passport is the player journey layer.

Passport answers:

```text
What has this player done?
```

Current module:

```move
module nami::passport
```

Current responsibilities:

* Create Passport object
* Store linked Identity ID
* Store XP
* Store level
* Store level progress
* Store badge points
* Store reputation
* Store archetype
* Store membership tier
* Store boost score placeholder
* Store prestige points placeholder
* Apply badge points
* Apply curved XP progression
* Update reputation
* Expose safe getters
* Provide package-only state mutation hooks

---

## Passport Default State

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

NPC is the default tier.

A new Passport should not start as Adventurer.

---

# Verification Architecture

## Purpose

Verification controls the transition:

```text
NPC → Adventurer
```

Current module:

```move
module nami::verification
```

Current responsibilities:

* Validate verification source
* Confirm Identity ownership
* Confirm Passport is linked to Identity
* Create VerificationRecord
* Upgrade Passport from NPC to Adventurer
* Emit IdentityVerified event

Future verification paths may include:

* zkLogin
* X.com
* Steam
* Epic Games
* SuiNS
* Email
* Privacy-preserving identity proofs

---

# Membership Architecture

## Purpose

Membership controls access tiers.

Membership is separate from reputation.

Current module:

```move
module nami::membership
```

Current tiers:

```text
0 = NPC
1 = Adventurer
2 = Pro
3 = Elite
```

Current responsibilities:

* Read raw effective tier
* Read conduct-aware effective tier
* Upgrade Adventurer to Pro through package authority
* Upgrade Pro to Elite through package authority
* Return NPC-equivalent tier when Black Passport is active

---

## Future Membership Work

Future membership work should include:

* Expiration
* Renewal
* Grace periods
* Subscription proof
* Effective tier snapshots
* Downgrade handling
* Active membership records

---

# Badge Architecture

## Purpose

Badges are achievement and participation proofs.

Current module:

```move
module nami::badge
```

Current badge types:

```text
Basic Badge = 1 point
Event Badge = 2 points
Completion Badge = 3 points
```

Current responsibilities:

* Mint Badge objects
* Apply badge points to Passport
* Feed XP progression
* Feed reputation progression
* Emit BadgeMinted event

---

# Badge Issuer Architecture

## Purpose

Badge Issuer authority controls who can issue badges.

Current module:

```move
module nami::badge_issuer
```

Current responsibilities:

* Create BadgeIssuerCap
* Define issuer types
* Define badge permissions
* Allow or block Basic Badge issuance
* Allow or block Event Badge issuance
* Allow or block Completion Badge issuance
* Issue badges through a permission gate

This protects reputation integrity.

Starting a game should not issue a Completion Badge.

Completion Badges require authority.

---

# Boost Architecture

## Purpose

Boosts are discovery signals.

Current module:

```move
module nami::boost
```

Current boost model:

```text
NPC = blocked
Adventurer = 1
Pro = 6
Elite = 8
```

Current responsibilities:

* Read effective membership tier
* Read conduct-aware effective tier
* Create Boost object
* Emit BoostUsed event
* Block NPC boost usage
* Block Black Passport boost usage through conduct-aware effective tier

Boosts should influence discovery.

Boosts should not grant reputation, ownership, or governance.

---

# Channel Access Architecture

## Purpose

Channel Access controls who can chat in a channel.

Current module:

```move
module nami::channel_access
```

Current responsibilities:

* Create ChannelAccessPolicy
* Store channel owner
* Store channel ID
* Store NPC chat toggle
* Store minimum tier requirement
* Store minimum reputation requirement
* Check chat access
* Check conduct-aware chat access
* Check conduct + moderation-aware chat access

Core channel toggle:

```text
Allow NPC Chat: Yes / No
```

---

## Channel Access Restrictions

Channel chat can currently be blocked by:

* NPC chat disabled
* Minimum tier requirement
* Minimum reputation requirement
* Black Passport
* Active mute
* Active channel ban

---

# Conduct Architecture

## Purpose

Conduct communicates public interaction style and moderation status.

Current module:

```move
module nami::conduct
```

Current Conduct Signals:

```text
Green
Orange
Red
Black
```

Green, Orange, and Red are user-selectable.

Black is reserved for moderation.

Current responsibilities:

* Create ConductStatus
* Allow user-selected public conduct signal
* Prevent user-selected Black Signal
* Down Passport to Black through package authority
* Respawn after restriction expiration
* Check active benefits

---

# Black Passport

Black Passport means:

```text
Passport downed. Respawning in...
```

When Black Passport is active:

* Effective tier becomes NPC-equivalent
* Boosts are blocked
* Channel chat is blocked
* Squad benefits are blocked
* Jury eligibility is blocked
* Membership benefits are temporarily restricted

Black Passport should not erase earned history by default.

---

# Moderation Architecture

## Purpose

Moderation protects communities and users.

Current module:

```move
module nami::moderation
```

Current moderation actions:

```text
Warning
Mute
Channel Ban
Black Passport
```

Current responsibilities:

* Create ModerationRecord
* Issue warning
* Issue mute
* Issue channel ban
* Issue Black Passport
* Check active records
* Check active mutes
* Check active channel bans
* Determine whether moderation blocks chat

Moderation actions are package-gated and exposed through AdminCap.

---

# Admin Architecture

## Purpose

AdminCap is the authority layer for sensitive protocol actions.

Current module:

```move
module nami::admin
```

Current responsibilities:

* Create AdminCap on package initialization
* Create test AdminCap for tests
* Approve badge issuers
* Upgrade to Pro
* Upgrade to Elite
* Issue warnings
* Issue mutes
* Issue channel bans
* Issue Black Passport
* Resolve appeals
* Open jury cases
* Close jury cases
* Emit AdminAction events

AdminCap is not the final decentralization model.

It is the current secure MVP authority model.

---

# Appeals Architecture

## Purpose

Appeals create a fairness loop after moderation actions.

Current module:

```move
module nami::appeals
```

Current flow:

```text
Moderation action → Appeal opened → Admin resolution
```

Current responsibilities:

* Create AppealCase
* Validate appellant owns moderation record
* Reference moderation record ID
* Store public reference
* Track appeal status
* Resolve appeal through package authority
* Emit AppealOpened
* Emit AppealResolved

Private evidence should not be stored directly on-chain.

---

# Jury Architecture

## Purpose

Jury creates an advisory community review layer.

Current module:

```move
module nami::jury
```

Current flow:

```text
Appeal → JuryCase → Pro/Elite juror vote → Jury recommendation
```

Current responsibilities:

* Create JuryCase
* Require open appeal
* Require minimum votes
* Check Pro/Elite juror eligibility
* Block Black Passport jurors through effective tier
* Record juror vote receipts
* Close jury case
* Compute final recommendation

Current jury outcomes:

```text
Approved
Denied
Modified
```

Jury is advisory at this stage.

Admin still performs final appeal resolution.

---

# Squad Architecture

## Purpose

Squads are small gamer-native trust and sponsorship groups.

Current module:

```move
module nami::squad
```

Current responsibilities:

* Create Squad object
* Create SquadMember sponsorship object
* Allow Pro users to create squads
* Allow Elite users to create squads
* Block NPC squad creation
* Block Black Passport squad benefits
* Allow squad owner to sponsor members
* Enforce slot limits

Current slot model:

```text
Pro = 3 squad slots
Elite = 8 squad slots
```

Squads are not guilds.

Squads are small trust networks.

---

# Error Architecture

## Purpose

The errors module centralizes abort codes.

Current module:

```move
module nami::errors
```

Current error categories:

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

Modules should use error getter functions instead of hardcoded abort codes where possible.

---

# On-Chain vs Off-Chain Split

## On-Chain

The following should be on-chain or anchored on-chain:

* Identity ownership
* Passport state
* Verification records
* Membership tier state
* Badge objects
* Badge issuer capability
* Boost objects
* Channel access policy
* Conduct status
* Moderation records
* Admin actions
* Appeal cases
* Jury cases
* Jury vote receipts
* Squad objects
* Squad member sponsorship records
* Future guild anchors
* Future cosmetic unlock proofs
* Future recovery proofs

---

## Off-Chain

The following should usually be off-chain:

* Chat messages
* Chat attachments
* Private moderation evidence
* Private appeal evidence
* Jury evidence packets
* Profile display names
* Avatar configuration
* Customization layout
* Discovery ranking
* Search
* Notifications
* Analytics
* Media files
* Rich profile assets

Off-chain systems may reference on-chain object IDs and events.

---

# Current Test Architecture

Current test file:

```text
contracts/nami/tests/nami_tests.move
```

Current test status:

```text
33 tests passing
0 warnings
```

Current tests cover:

* Identity creation
* Passport creation
* NPC default state
* Verification flow
* Invalid verification failure
* Membership upgrade flow
* Badge minting
* Badge point reputation updates
* Badge issuer permissions
* Boost access
* Channel access
* Conduct status
* Black Passport restrictions
* Moderation records
* Chat blocking from moderation
* Admin authority
* Appeals
* Jury flow
* Squad creation
* Squad sponsorship

---

# Current Dependency Flow

Simplified current dependency map:

```text
identity.move
  ↓
passport.move
  ↓
verification.move
membership.move
badge.move
boost.move
channel_access.move
conduct.move
moderation.move
appeals.move
jury.move
squad.move
admin.move
```

More specific relationship map:

```text
verification.move → identity.move + passport.move

membership.move → passport.move + conduct.move

badge.move → passport.move

badge_issuer.move → badge.move + passport.move

boost.move → membership.move + passport.move + conduct.move

channel_access.move → membership.move + passport.move + conduct.move + moderation.move

moderation.move → passport.move + conduct.move

appeals.move → passport.move + moderation.move

jury.move → appeals.move + passport.move + membership.move + conduct.move

squad.move → passport.move + membership.move + conduct.move

admin.move → badge_issuer.move + membership.move + moderation.move + appeals.move + jury.move
```

---

# Future Architecture Modules

Planned future modules may include:

```text
guild.move
cosmetics.move
title.move
recovery.move
developer_identity.move
provider_registry.move
discovery_anchor.move
```

---

# Guild Architecture Direction

Guilds should be larger persistent communities.

Guilds may include:

* Guild object
* Founder
* Roles
* Members
* Guild channels
* Guild reputation
* Guild badge permissions
* Guild discovery hooks
* Guild events

Guilds should not replace Squads.

Squads are small trust groups.

Guilds are larger community structures.

---

# Customization Architecture Direction

Customization should create gamer-native identity expression.

Planned customization areas:

* Profile avatars
* 2D VTuber-style avatars
* Passport themes
* Profile frames
* Chat overlays
* Fonts
* Badge displays
* Earned title displays
* Guild display selection
* Prestige effects

Most customization settings should be off-chain.

On-chain should store unlock proofs for meaningful or rare items.

---

# Recovery Architecture Direction

Recovery should help users regain access to Identity and Passport safely.

Possible recovery inputs:

* zkLogin recovery
* Linked social accounts
* Linked game accounts
* Optional email
* Squad support
* Guild support
* Manual review

Recovery should avoid instant account takeover.

---

# Backend Architecture Direction

Backend services should index events and build derived views.

Planned backend services:

* Event indexer
* User profile service
* Passport timeline service
* Badge history service
* Boost history service
* Moderation service
* Appeal service
* Jury service
* Squad service
* Guild service
* Discovery engine
* Notification service

Backend data should be rebuildable from on-chain events where possible.

---

# Frontend Architecture Direction

Minimum frontend MVP should include:

* Sign-in
* Create Identity
* Create Passport
* Passport profile
* Reputation display
* Badge display
* Conduct Signal display
* Membership display
* Channel access demo
* Admin/moderation demo
* Appeal demo
* Jury demo
* Squad demo

The frontend should feel like a gamer platform, not a protocol explorer.

---

# SDK Architecture Direction

The SDK should make Nami easy to integrate.

Planned SDK features:

* Connect wallet
* zkLogin helper
* Identity read
* Passport read
* Membership read
* Reputation read
* Badge read
* Conduct read
* Channel access check
* Boost helper
* Squad read
* Guild read
* Event subscription helper

---

# MVP Architecture Status

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

# Core Architecture Principles

Identity owns presence.

Passport owns journey.

Verification unlocks Adventurer.

Membership controls access.

Reputation is earned.

Badges prove meaningful activity.

Badge issuers protect reputation quality.

Boosts signal discovery.

Channel access controls participation.

Conduct communicates interaction state.

Black Passport restricts benefits.

Moderation protects communities.

Appeals create fairness.

Jury adds community voice.

Squads create small trust networks.

AdminCap controls sensitive MVP actions.

Backend powers scale.

Frontend creates the gamer experience.

SDK expands the ecosystem.

Sui anchors proof.
