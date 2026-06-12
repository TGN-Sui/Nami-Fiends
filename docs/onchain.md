# Nami On-Chain Architecture

## Purpose

The Nami on-chain layer anchors ownership, access, proof, progression, moderation state, and protocol events.

Sui Move is used for the parts of Nami that must be verifiable, portable, and tamper-resistant.

Off-chain systems will handle scale-heavy experiences such as chat, search, discovery ranking, private evidence, profile rendering, and rich customization.

---

## Current Status

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

Current source modules:

```text
admin.move
appeals.move
badge.move
badge_issuer.move
boost.move
channel_access.move
conduct.move
errors.move
identity.move
jury.move
membership.move
moderation.move
passport.move
squad.move
verification.move
```

Current test file:

```text
tests/nami_tests.move
```

---

## What Belongs On-Chain

Nami should place durable protocol state on-chain.

Current on-chain state includes:

* Identity ownership
* Passport progression
* Verification records
* Membership tier state
* Badge objects
* Badge issuer capabilities
* Boost objects
* Channel access policies
* Conduct status
* Moderation records
* Admin capability
* Appeal cases
* Jury cases
* Jury vote receipts
* Squad objects
* Squad member records

Future on-chain state may include:

* Guild anchors
* Recovery proofs
* Cosmetic unlock proofs
* Title unlock proofs
* Developer authority records

---

## What Belongs Off-Chain

Nami should keep high-volume, private, or flexible data off-chain.

Off-chain systems should handle:

* Chat messages
* Chat attachments
* Private moderation evidence
* Private appeal evidence
* Jury evidence packets
* Discovery ranking
* Search
* Notifications
* Profile display names
* Avatar configuration
* Equipped cosmetics
* Rich media
* Analytics dashboards

Off-chain systems may reference on-chain object IDs and events.

---

# Current Object Model

## Identity

Module:

```move
module nami::identity
```

Purpose:

Root ownership layer.

Stores:

* Owner
* Verification placeholder
* Trust placeholder
* Passport reference placeholder
* Created timestamp
* Version

---

## Passport

Module:

```move
module nami::passport
```

Purpose:

Player journey layer.

Stores:

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

Controls:

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

On-chain proof of achievement or participation.

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

Controls which issuers can mint which badge types.

Protects Completion Badges from low-quality or automated issuance.

---

## Boost

Module:

```move
module nami::boost
```

Purpose:

Discovery signal object.

Boost access is based on effective membership tier and Conduct status.

---

## ChannelAccessPolicy

Module:

```move
module nami::channel_access
```

Purpose:

Controls chat eligibility for a channel.

Current rules include:

* NPC chat toggle
* Minimum tier
* Minimum reputation
* Conduct-aware checks
* Moderation-aware checks

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

Mutes and channel bans can block chat.

Black Passport updates Conduct status.

---

## AdminCap

Module:

```move
module nami::admin
```

Purpose:

Current MVP authority for sensitive actions.

AdminCap can currently:

* Approve badge issuers
* Upgrade membership
* Issue moderation actions
* Resolve appeals
* Open jury cases
* Close jury cases

AdminCap is an MVP authority model, not the final governance model.

---

## AppealCase

Module:

```move
module nami::appeals
```

Purpose:

Allows users to appeal moderation actions.

Appeals reference moderation records without storing private evidence directly on-chain.

---

## JuryCase and JuryVoteReceipt

Module:

```move
module nami::jury
```

Purpose:

Advisory community review for appeals.

Jurors must be Pro or Elite and must not be restricted by Black Passport status.

---

## Squad and SquadMember

Module:

```move
module nami::squad
```

Purpose:

Small trust and sponsorship groups.

Current creation requirements:

```text
Pro or Elite
No active Black Passport
```

---

# Current Authority Flow

Sensitive actions are not exposed directly through their storage modules.

Current authority flow:

```text
verification.move → NPC to Adventurer

admin.move → Badge issuer approval
admin.move → Pro / Elite upgrades
admin.move → Moderation actions
admin.move → Appeal resolution
admin.move → Jury case open / close
```

This keeps state mutation controlled while the protocol is still in MVP.

---

# Effective Access Model

Nami avoids relying only on raw Passport tier.

Current effective access can include:

```text
Passport tier
+ Conduct status
+ Channel policy
+ Moderation records
```

Example:

A user may hold Elite tier, but if their Conduct status is Black, effective benefits fall back to NPC-equivalent restrictions until respawn.

This affects:

* Boost access
* Channel chat
* Squad access
* Jury eligibility

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
* Channel access policy updates
* Conduct updates
* Passport down / respawn
* Moderation actions
* Admin actions
* Appeals
* Jury cases
* Jury votes
* Squad creation
* Squad sponsorship

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
* Channel access rules
* Conduct restrictions
* Moderation chat blocking
* Admin authority
* Appeals
* Jury flow
* Squads

Current status:

```text
33 tests passing
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

For broader system descriptions, see:

```text
docs/architecture.md
docs/systems.md
docs/access-control.md
docs/events.md
docs/moderation.md
docs/conduct-system.md
docs/squads.md
```
