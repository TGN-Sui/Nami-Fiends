# Nami Identity

## Overview

Nami Identity is the root ownership layer of the Nami ecosystem.

Identity answers:

Who owns this Nami presence?

Passport answers:

What has this player done?

Identity should remain small, stable, and secure.

The Identity object anchors ownership, verification references, recovery paths, and the relationship to the user's Passport.

---

## Core Purpose

Identity exists to provide a persistent ownership anchor for each user.

A Nami Identity should support:

* Wallet ownership
* zkLogin ownership
* Human verification
* Recovery
* Passport linking
* Future social or game account connections
* Future privacy-preserving identity proofs

Identity should not become overloaded with progression, badges, chat, guild, or customization data.

---

## Identity vs Passport

Identity and Passport are separate systems.

### Identity

Identity represents ownership and authenticity.

Identity tracks:

* Owner
* Verification level
* Trust placeholders
* Passport reference
* Creation timestamp
* Version

---

### Passport

Passport represents the gamer journey.

Passport tracks:

* XP
* Level
* Level progress
* Badge points
* Reputation
* Membership tier
* Archetype
* Boost score
* Prestige points

---

## Why Separate Identity and Passport

Separating Identity and Passport keeps Nami modular.

Identity should be long-lived and stable.

Passport can evolve with progression, seasons, reputation, membership, badges, and prestige systems.

This separation allows Nami to upgrade gameplay and community systems without destabilizing the root ownership layer.

---

## Current Move Module

Current module:

```move
module nami::identity
```

Current source file:

```text
contracts/nami/sources/identity.move
```

---

## Current Identity Object

Current Identity structure:

```move
public struct Identity has key {
    id: UID,
    owner: address,
    trust_tier: u8,
    verification_level: u8,
    passport_id: option::Option<address>,
    created_at_ms: u64,
    version: u8,
}
```

---

# Field Definitions

## id

Type:

```move
UID
```

Purpose:

Unique Sui object identifier for the Identity.

This is the on-chain identity anchor.

---

## owner

Type:

```move
address
```

Purpose:

The wallet or zkLogin-controlled address that owns the Identity.

This address controls the Identity object.

Future recovery systems may allow ownership changes through secure recovery flows.

---

## trust_tier

Type:

```move
u8
```

Purpose:

Placeholder for future trust classification.

Current status:

```text
Reserved / placeholder
```

Trust should eventually be derived from multiple signals, including verification, reputation, conduct, moderation history, and recovery safety.

---

## verification_level

Type:

```move
u8
```

Purpose:

Placeholder for future verification strength.

Potential future values may represent:

* Unverified
* Human verified
* Strong verified
* Developer verified
* Organization verified

Current status:

```text
Reserved / placeholder
```

---

## passport_id

Type:

```move
option::Option<address>
```

Purpose:

Optional reference to the user's Passport object.

This allows Identity to point to the associated Passport while keeping the two systems separate.

Current status:

```text
Reserved for future automatic Passport linking
```

---

## created_at_ms

Type:

```move
u64
```

Purpose:

Timestamp of Identity creation in milliseconds.

Used for:

* Identity age
* Recovery checks
* Trust signals
* Historical indexing
* Future account age requirements

---

## version

Type:

```move
u8
```

Purpose:

Version number for future migration and upgrade planning.

Current version:

```text
1
```

---

# Identity Creation

Current Identity creation flow:

1. User signs in or connects wallet
2. Identity object is created
3. Identity ownership is assigned to the sender
4. IdentityCreated event is emitted

Current public initializer:

```move
init_identity(...)
```

---

# IdentityCreated Event

Emitted when a new Identity is created.

Fields:

* identity_id
* owner

Purpose:

* Track new identity creation
* Initialize indexing
* Connect future profile systems
* Support Passport creation flows

---

# zkLogin Relationship

Nami should support zkLogin as a gamer-friendly onboarding path.

The ideal flow:

```text
Sign in → Identity → Passport → Start journey
```

The user should not need to understand wallets before entering Nami.

zkLogin should allow users to access a Sui-backed identity through familiar login flows.

---

# Wallet Relationship

Users with existing Sui wallets should be able to connect directly.

Wallet ownership may serve as one identity signal.

However, wallet ownership alone should not prove humanity.

Verification systems should determine whether the user is eligible to move from NPC to Adventurer.

---

# Human Verification

Identity should eventually connect to verification systems.

Possible verification sources:

* zkLogin
* X.com verification
* Sui wallet ownership
* SuiNS
* Steam account linkage
* Epic Games account linkage
* Email verification
* Future proof-of-humanity systems

Verification should help determine whether a user can become Adventurer.

Verification should not automatically create reputation.

---

# One Human, One Primary Identity

Nami should aim for:

```text
1 Human → 1 Primary Nami Identity
```

This helps reduce:

* Bot farming
* Sybil attacks
* Boost manipulation
* Badge farming
* Duplicate reward claims
* Multi-wallet abuse

Linked accounts such as X, Steam, Epic, or email should not be reusable across multiple Nami Identities.

---

# Identity and Membership

Membership tier currently lives in Passport.

Identity may store verification-level information that helps determine membership eligibility.

Example:

```text
Verified Identity → Passport eligible for Adventurer
```

Identity should not directly store Pro or Elite subscription logic.

Future membership logic should live in:

```text
membership.move
```

---

# Identity and Reputation

Identity should not store reputation.

Reputation belongs to Passport.

This keeps reputation tied to player journey and badge history rather than raw ownership.

---

# Identity and Conduct

Identity should not store Conduct Signal.

Conduct should eventually live in a separate conduct system.

Possible future module:

```text
conduct.move
```

Conduct may reference Passport or Identity, but it should not be embedded directly into Identity.

---

# Identity and Recovery

Recovery is one of the most important future uses of Identity.

Identity recovery may support:

* zkLogin recovery
* Linked social recovery
* Linked game account recovery
* Optional email recovery
* Squad support
* Guild support
* Manual review

Recovery must preserve security and prevent account theft.

---

## Recovery Principles

Recovery should not allow instant account takeover.

Recovery should use:

* Waiting periods
* Multiple proof sources
* Events
* Review flows
* Optional guardians
* Manual fallback paths

Recovery should preserve the user's Passport whenever possible.

---

# Identity Privacy

Identity should minimize public exposure of private data.

Nami should avoid storing the following directly on-chain:

* Real names
* Emails
* Private social handles
* Private game account identifiers
* Private recovery secrets
* Private moderation evidence
* Personal documents

On-chain state should store proof, not sensitive raw data.

---

# Identity and SuiNS

SuiNS may support human-readable identity.

Possible future uses:

* Player names
* Developer profiles
* Studio identities
* Guild names
* Channel names
* Game hub names

SuiNS should be optional for ordinary gamers.

Developers, studios, guilds, and official channels may benefit more from SuiNS identity anchoring.

---

# Identity and Developers

Developers may eventually have special identity classifications.

Developer identities may support:

* Studio verification
* Game ownership
* Channel ownership
* Badge issuer authority
* Announcement rights
* Developer hub creation

Developer verification should be stronger than ordinary player verification.

---

# Identity and Channels

Verified channel ownership may eventually depend on Identity.

A channel owner should be linked to a trusted Identity or organization.

Channel ownership should not be based only on display names.

---

# Identity and Appeals

Appeal systems should protect Identity privacy.

Anonymous jury members should not see:

* Wallet addresses
* Linked social accounts
* Real names
* Email addresses
* Private game account identifiers

Appeals should use case IDs, anonymized events, and evidence summaries.

---

# Current Boundaries

Identity currently should not manage:

* XP
* Levels
* Reputation
* Badges
* Boosts
* Guild membership
* Squad sponsorship
* Chat messages
* Moderation evidence
* Customization settings
* Discovery ranking

These belong in separate systems.

---

# Future Move Modules

Future modules related to Identity may include:

* verification.move
* recovery.move
* linked_account.move
* developer_identity.move
* provider_registry.move

---

# Future Events

Potential future Identity events:

* IdentityCreated
* IdentityVerified
* VerificationSourceLinked
* VerificationSourceRemoved
* IdentityRecovered
* OwnerUpdated
* PassportLinked
* DeveloperVerified

Events should avoid exposing private provider data.

---

# Core Principles

Identity is the root ownership layer.

Identity should remain small.

Identity should be privacy-conscious.

Identity should support zkLogin and wallets.

Identity should anchor recovery.

Identity should connect to Passport without becoming Passport.

Nami Identity should make gamers feel like they own their presence without forcing them to understand blockchain complexity.
