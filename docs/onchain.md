# Nami On-Chain Architecture

## Purpose

The Nami on-chain layer anchors durable protocol state.

Sui Move is used for ownership, access, proof, progression, moderation, appeals, jury review, squads, guilds, channels, profiles, customization unlocks, and recovery requests.

High-volume or private data should remain off-chain.

---

## Current Status

Current package path:

```text
nami_chat/contracts/nami
```

Current status:

```text
Build passing
55 tests passing
0 warnings
```

---

# Current Move Modules

Current source modules:

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

# What Belongs On-Chain

Nami should place durable, verifiable protocol state on-chain.

Current on-chain state includes:

* Identity ownership
* Passport progression
* Verification records
* Membership tier state
* Badge objects
* Badge issuer capabilities
* Boost objects
* Channel objects
* Channel access policies
* Conduct status
* Moderation records
* Admin capability
* Appeal cases
* Jury cases
* Jury vote receipts
* Squad objects
* Squad member records
* Guild objects
* Guild member records
* Profile objects
* Earned title proofs
* Title display objects
* Cosmetic unlock proofs
* Cosmetic loadouts
* Recovery requests

Future on-chain state may include:

* Membership renewal records
* Guild roles
* Developer identity records
* Cosmetic metadata registries
* Recovery ownership transfer proofs
* Discovery anchor snapshots

---

# What Belongs Off-Chain

Nami should keep high-volume, private, or flexible data off-chain.

Off-chain systems should handle:

* Chat messages
* Chat attachments
* Private moderation evidence
* Private appeal evidence
* Private jury evidence
* Private recovery evidence
* Discovery ranking
* Search
* Notifications
* Profile media
* Avatar configuration
* Long bios
* Rich customization assets
* Analytics dashboards

Off-chain systems may reference on-chain object IDs, events, hashes, encrypted storage references, or Walrus references.

---

# Core Object Model

## Identity

Module:

```move
module nami::identity
```

Purpose:

Root ownership layer.

Identity should remain small and stable.

---

## Passport

Module:

```move
module nami::passport
```

Purpose:

Player journey layer.

Passport stores:

* Linked Identity ID
* XP
* Level
* Level progress
* Badge points
* Reputation
* Archetype
* Membership tier
* Boost score placeholder
* Prestige points placeholder

Default tier:

```text
NPC
```

---

## VerificationRecord

Module:

```move
module nami::verification
```

Purpose:

Proof that a user passed a supported verification path.

Current transition:

```text
NPC → Adventurer
```

---

## Badge

Module:

```move
module nami::badge
```

Purpose:

On-chain achievement or participation proof.

Current badge values:

```text
Basic = 1
Event = 2
Completion = 3
```

---

## BadgeIssuerCap

Module:

```move
module nami::badge_issuer
```

Purpose:

Controls who may issue badge types.

Completion Badge authority must be explicit.

---

## Boost

Module:

```move
module nami::boost
```

Purpose:

Discovery signal object.

Boost access uses effective tier and Conduct status.

---

## Channel

Module:

```move
module nami::channel
```

Purpose:

Creator or community channel object.

Channels support:

* Owner
* Owner Passport ID
* Name
* Description
* Metadata reference
* Public/private setting
* Verification flag

Verified channels are controlled through AdminCap during MVP.

---

## ChannelAccessPolicy

Module:

```move
module nami::channel_access
```

Purpose:

Controls chat eligibility for a Channel.

Current rules include:

* NPC chat toggle
* Minimum tier
* Minimum reputation
* Conduct-aware checks
* Moderation-aware checks
* Channel ownership-aware policy creation and updates

---

## ConductStatus

Module:

```move
module nami::conduct
```

Purpose:

Public interaction signal and moderation state.

Signals:

```text
Green
Orange
Red
Black
```

Black Passport restricts benefits through effective access checks.

---

## ModerationRecord

Module:

```move
module nami::moderation
```

Purpose:

Stores moderation actions.

Current actions:

```text
Warning
Mute
Channel Ban
Black Passport
```

---

## AdminCap

Module:

```move
module nami::admin
```

Purpose:

Current MVP authority layer for sensitive actions.

AdminCap currently controls:

* Badge issuer approval
* Membership upgrades
* Moderation actions
* Appeal resolution
* Jury case opening and closing
* Cosmetic unlock grants
* Recovery resolution
* Channel verification

---

## AppealCase

Module:

```move
module nami::appeals
```

Purpose:

Allows users to appeal moderation actions.

Private evidence should remain off-chain.

---

## JuryCase and JuryVoteReceipt

Module:

```move
module nami::jury
```

Purpose:

Advisory community review for appeals.

Jurors must be Pro or Elite by effective tier.

---

## Squad and SquadMember

Module:

```move
module nami::squad
```

Purpose:

Small trust and sponsorship groups.

Current eligibility:

```text
Pro or Elite
No active Black Passport
```

---

## Guild and GuildMember

Module:

```move
module nami::guild
```

Purpose:

Larger persistent community structures.

Current eligibility:

```text
Adventurer, Pro, or Elite
No active Black Passport
```

---

## Profile

Module:

```move
module nami::profile
```

Purpose:

Public Passport display anchor.

Profiles store references for:

* Display name
* Bio
* Avatar
* Metadata

Media should remain off-chain.

---

## EarnedTitle and TitleDisplay

Module:

```move
module nami::title
```

Purpose:

Earned title proofs and equipped title display.

Current title source:

```text
Passport reputation
```

---

## CosmeticUnlock and CosmeticLoadout

Module:

```move
module nami::cosmetics
```

Purpose:

Customization unlock proofs and equipped cosmetic state.

Current cosmetic categories:

```text
Profile Frame
Passport Theme
Chat Overlay
Avatar Style
Badge Display
Title Effect
```

---

## RecoveryRequest

Module:

```move
module nami::recovery
```

Purpose:

Formal account recovery request and admin resolution flow.

Current recovery does not transfer ownership yet.

---

# Current Authority Flow

Sensitive actions are not exposed directly to ordinary users.

Current authority paths:

```text
verification.move → NPC to Adventurer

admin.move → Badge issuer approval
admin.move → Pro / Elite upgrades
admin.move → Moderation actions
admin.move → Appeal resolution
admin.move → Jury case open / close
admin.move → Cosmetic unlock grants
admin.move → Recovery resolution
admin.move → Channel verification
```

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

* Boost access
* Channel chat
* Squad access
* Guild actions
* Jury eligibility
* Profile updates
* Title claiming and equipping
* Cosmetic equipping

---

# Current Events

Current event families include:

* Identity creation
* Passport creation
* XP updates
* Badge point updates
* Tier upgrades
* Verification
* Badge minting
* Badge issuer activity
* Boost usage
* Channel creation and verification
* Channel access policy updates
* Conduct updates
* Passport down / respawn
* Moderation actions
* Admin actions
* Appeals
* Jury cases
* Jury votes
* Squad creation and sponsorship
* Guild creation and membership
* Profile creation and updates
* Title claiming and equipping
* Cosmetic unlocks and equipping
* Recovery requests and resolutions

Detailed event descriptions belong in:

```text
docs/events.md
```

---

# Current Testing

Current tests verify:

* Identity and Passport creation
* NPC default tier
* Verification flow
* Membership upgrade flow
* Badge progression
* Badge issuer permissions
* Boost access
* Channel creation, updates, and verification
* Channel access policy ownership
* Conduct restrictions
* Moderation chat blocking
* Admin authority
* Appeals
* Jury flow
* Squads
* Guilds
* Profiles
* Titles
* Cosmetics
* Recovery

Current status:

```text
55 tests passing
0 warnings
```

---

# On-Chain Design Rules

Use Move objects for durable protocol state.

Use events for indexable protocol history.

Use capability objects for sensitive authority.

Keep private evidence off-chain.

Keep chat messages off-chain.

Do not store raw personal identity data on-chain.

Do not make payment equal reputation.

Do not let raw tier bypass Conduct or Moderation restrictions.

Do not let cosmetics, titles, or boosts become authority.

Do not transfer recovery ownership automatically until the safety model is mature.

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

# Related Docs

```text
docs/architecture.md
docs/systems.md
docs/events.md
docs/access-control.md
docs/customization.md
docs/recovery.md
docs/moderation.md
docs/conduct-system.md
```
